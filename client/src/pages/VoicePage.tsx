import { useVoiceChat } from "@/context/VoiceChatContext"
import { VoiceChat } from "@/components/ui/audio-chat"
import Navbar from "@/components/Navbar"

export default function VoicePage() {
    const { participants, isConnected, isMuted, joinVoice, leaveVoice, toggleMute } = useVoiceChat()

   
    return (
        <div className="flex flex-col h-full bg-[#040404] overflow-y-auto">
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="md:scale-125 lg:scale-[1.4] transition-transform">
                <VoiceChat 
                    participants={participants}
                    isConnected={isConnected}
                    isMuted={isMuted}
                    onJoin={joinVoice}
                    onLeave={leaveVoice}
                    onToggleMute={toggleMute}
                />
            </div>
        </div>
        </div>
    )
}
