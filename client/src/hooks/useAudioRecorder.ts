import { useRef, useState, useCallback } from "react";

export function useAudioRecorder() {
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                setAudioBlob(blob);
                stream.getTracks().forEach((t) => t.stop());
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setRecording(true);
        } catch {
            console.error("Microphone permission denied");
        }
    }, []);

    const stopRecording = useCallback((): Promise<Blob | null> => {
        return new Promise((resolve) => {
            const recorder = mediaRecorderRef.current;
            if (!recorder) return resolve(null);

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                setAudioBlob(blob);
                recorder.stream?.getTracks().forEach((t) => t.stop());
                resolve(blob);
            };

            recorder.stop();
            setRecording(false);
        });
    }, []);

    const clearAudio = useCallback(() => setAudioBlob(null), []);

    return { recording, audioBlob, startRecording, stopRecording, clearAudio };
}
