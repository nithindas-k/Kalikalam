import { useState } from "react"
import { ChevronDown, X, Mic2, MicOff } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Participant {
  id: string
  name: string
  avatar: string
  isSpeaking?: boolean
}

interface VoiceChatProps {
  participants: Participant[]
  isConnected?: boolean
  isMuted?: boolean
  onJoin?: () => void
  onLeave?: () => void
  onToggleMute?: () => void
  onClose?: () => void
}

const COLLAPSED_WIDTH = 268
const EXPANDED_WIDTH = 300
const EXPANDED_HEIGHT = 380

const AVATAR_SIZE_COLLAPSED = 44
const AVATAR_SIZE_EXPANDED = 44
const AVATAR_OVERLAP = -12

const MOCK_PARTICIPANTS: Participant[] = [
  { id: "mock-1", name: "Oğuz", avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/man-with-sunglasses-profile-artistic-3Q0PBah5WBqwZeeWGCWABFOpCyhcmD.jpg", isSpeaking: true },
  { id: "mock-2", name: "Ashish", avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/man-with-cap-colorful-gradient-background-k6UaFzKucKJ2tzaK32l1XFTkv5dPAS.jpg" },
  { id: "mock-3", name: "Mariana", avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/person-with-winter-hat-scarf-cold-5KFfWSpCqM4Ksf7yXgiVhxSweVw5tH.jpg" },
  { id: "mock-4", name: "MDS", avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/silhouette-dark-artistic-portrait-HUaRj3gVUuhrGF2L8HaOGlawK4EAfZ.jpg" },
  { id: "mock-5", name: "Ana", avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/woman-smiling-outdoor-background-M1BHNIp7XAzAPWwbIbY47V6WEFk703.jpg" },
  { id: "mock-6", name: "Natko", avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/man-with-beard-hoodie-casual-tx32EFYsG69NBSuftk3cN16mOegxOe.jpg", isSpeaking: true },
  { id: "mock-7", name: "Afshin", avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/man-with-sunglasses-red-shirt-blue-background-KvK2BMFg07EE8rLsTSQ8891UfCcSIV.jpg" },
];

function SpeakingIndicator({ show }: { show: boolean }) {
  return (
    <div
      className={cn(
        "absolute -top-1 -right-1 bg-background rounded-full p-1.5 shadow-md",
        "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        show ? "opacity-100 scale-100" : "opacity-0 scale-0",
      )}
    >
      <div className="flex items-center justify-center gap-[2px]">
        <span className="w-[3px] h-[6px] bg-foreground rounded-full animate-wave-1" />
        <span className="w-[3px] h-[6px] bg-foreground rounded-full animate-wave-2" />
        <span className="w-[3px] h-[6px] bg-foreground rounded-full animate-wave-3" />
      </div>
    </div>
  )
}

function AudioWaveIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <div
      className={cn(
        "absolute w-10 h-10 rounded-full bg-foreground flex items-center justify-center",
        "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        isExpanded ? "opacity-0 scale-75" : "opacity-100 scale-100",
      )}
      style={{
        left: 12,
        top: "50%",
        transform: `translateY(-50%) ${isExpanded ? "scale(0.75)" : "scale(1)"}`,
      }}
    >
      <div className="flex items-center justify-center gap-[2px]">
        <span className="w-[3px] h-[6px] bg-background rounded-full animate-wave-1" />
        <span className="w-[3px] h-[6px] bg-background rounded-full animate-wave-2" />
        <span className="w-[3px] h-[6px] bg-background rounded-full animate-wave-3" />
      </div>
    </div>
  )
}

function getAvatarPosition(index: number, isExpanded: boolean) {
  if (!isExpanded) {
    const startX = 60
    return {
      x: startX + index * (AVATAR_SIZE_COLLAPSED + AVATAR_OVERLAP),
      y: 8,
      size: AVATAR_SIZE_COLLAPSED,
      opacity: index < 4 ? 1 : 0,
      scale: 1,
    }
  } else {
    const gridStartX = 24
    const gridStartY = 70
    const colWidth = 63 // tightly fits 4 items in 300px
    const rowHeight = 85

    let col: number
    let row: number

    if (index < 4) {
      col = index
      row = 0
    } else {
      col = index - 4
      row = 1
    }

    return {
      x: gridStartX + col * colWidth,
      y: gridStartY + row * rowHeight,
      size: AVATAR_SIZE_EXPANDED,
      opacity: 1,
      scale: 1,
    }
  }
}

export function VoiceChat({
  participants = [],
  isConnected = false,
  isMuted = false,
  onJoin,
  onLeave,
  onToggleMute,
  onClose
}: VoiceChatProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const isMocked = !isConnected && participants.length === 0;
  const displayParticipants = isMocked ? MOCK_PARTICIPANTS : participants;
  const overflowCount = displayParticipants.length > 4 ? displayParticipants.length - 4 : 0;

  return (
    <>
      <style>{`
        @keyframes wave {
          0%, 100% { height: 6px; }
          50% { height: 14px; }
        }
        .animate-wave-1 { animation: wave 0.5s ease-in-out infinite; }
        .animate-wave-2 { animation: wave 0.5s ease-in-out infinite 0.1s; }
        .animate-wave-3 { animation: wave 0.5s ease-in-out infinite 0.2s; }
      `}</style>

      <div
        onClick={() => !isExpanded && setIsExpanded(true)}
        className={cn(
          "relative bg-background shadow-xl shadow-black/10 border border-border overflow-hidden cursor-pointer",
          "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          !isExpanded && "hover:shadow-2xl hover:shadow-black/15",
        )}
        style={{
          width: isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
          height: isExpanded ? EXPANDED_HEIGHT : 60,
          borderRadius: isExpanded ? 24 : 999,
        }}
      >
        <AudioWaveIcon isExpanded={isExpanded} />

        {/* Counter */}
        {overflowCount > 0 && (
          <div
            className={cn(
              "absolute flex items-center gap-0.5 text-muted-foreground",
              "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
              isExpanded ? "opacity-0 pointer-events-none" : "opacity-100",
            )}
            style={{
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <span className="text-md font-medium">+{overflowCount}</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        )}

        {/* Empty state on Collapsed (Obsolete with mocks) */}

        {/* Header */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-4 pb-3",
            "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isExpanded ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
          style={{
            transitionDelay: isExpanded ? "100ms" : "0ms",
          }}
        >
          <div className="w-8" />
          <h2 className="text-[15px] font-semibold text-foreground">Voice Chat</h2>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(false)
              onClose?.()
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Divider */}
        <div
          className={cn(
            "absolute left-4 right-4 h-px bg-border",
            "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isExpanded ? "opacity-100" : "opacity-0",
          )}
          style={{ top: 52 }}
        />

        {displayParticipants.map((participant, index) => {
          const pos = getAvatarPosition(index, isExpanded)
          const delay = isExpanded ? index * 30 : (6 - index) * 20

          return (
            <div
              key={participant.id}
              className="absolute transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{
                left: pos.x,
                top: pos.y,
                width: pos.size,
                height: isExpanded ? pos.size + 28 : pos.size,
                opacity: pos.opacity,
                zIndex: isExpanded ? 1 : 4 - index,
                transitionDelay: `${delay}ms`,
              }}
            >
              <div className="relative flex flex-col items-center">
                <div
                  className="rounded-full overflow-hidden ring-[2.5px] ring-background shadow-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{
                    width: pos.size,
                    height: pos.size,
                  }}
                >
                  <img
                    src={participant.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${participant.name}`}
                    alt={participant.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <SpeakingIndicator show={isExpanded && !!participant.isSpeaking} />

                <span
                  className={cn(
                    "absolute text-[13px] font-medium text-muted-foreground whitespace-nowrap",
                    "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    isExpanded ? "opacity-100" : "opacity-0",
                  )}
                  style={{
                    top: pos.size + 8,
                    transitionDelay: isExpanded ? `${150 + index * 30}ms` : "0ms",
                  }}
                >
                  {participant.name}
                </span>
              </div>
            </div>
          )
        })}

        {/* Empty state on Expanded (Obsolete with Mocks) */}


        {/* Bottom Actions */}
        {!isConnected ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onJoin?.()
            }}
            className={cn(
              "absolute left-4 right-4 bg-orange-500 hover:bg-orange-600 text-black font-bold py-3.5 rounded-2xl text-[15px]",
              "active:scale-[0.98]",
              "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
              isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
            )}
            style={{
              bottom: 50,
              transitionDelay: isExpanded ? "200ms" : "0ms",
            }}
          >
            Join Now
          </button>
        ) : (
          <div
            className={cn(
              "absolute left-4 right-4 flex gap-3",
              "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
              isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            )}
            style={{
              bottom: 45,
              transitionDelay: isExpanded ? "200ms" : "0ms"
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onToggleMute?.() }}
              className={`flex-1 ${isMuted ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-white/[0.04] text-white/80 hover:bg-white/[0.08]"} py-3.5 rounded-2xl font-medium text-[15px] flex items-center justify-center gap-2 transition-all`}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic2 className="w-4 h-4" />}
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onLeave?.() }}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3.5 rounded-2xl font-medium text-[15px] shadow-lg shadow-red-500/20 transition-colors"
            >
              Leave
            </button>
          </div>
        )}

        <p
          className={cn(
            "absolute inset-x-0 text-center text-[13px] text-muted-foreground",
            "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isExpanded ? "opacity-100" : "opacity-0",
          )}
          style={{
            bottom: 16,
            transitionDelay: isExpanded ? "250ms" : "0ms",
          }}
        >
          {!isConnected ? "Mic will be muted initially." : isMuted ? "You are muted." : "Your mic is live."}
        </p>
      </div>
    </>
  )
}
