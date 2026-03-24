export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    senderImage: string;
    type: "text" | "image" | "audio";
    content: string;
    timestamp: string;
}

export interface TypingIndicator {
    senderName: string;
    isTyping: boolean;
}
