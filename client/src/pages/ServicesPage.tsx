import { Timeline } from "@/components/ui/timeline";
import { Users, Laugh, MessageSquare, Key, ShieldCheck, Mic, Lock, Video, Headphones, Fingerprint } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

// --- REUSABLE COMPACT ANIMATED WRAPPER ---
const InteractiveBox = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    whileHover={{ scale: 1.02, translateY: -3 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 400, damping: 15 }}
    className={`relative overflow-hidden rounded-xl border border-white/10 bg-neutral-900/60 p-4 flex items-center justify-center min-h-[140px] md:min-h-[180px] shadow-lg group/box cursor-pointer hover:shadow-orange-500/5 ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-blue-500/5 opacity-0 group-hover/box:opacity-100 transition-opacity duration-300" />
    <div className="relative z-10 w-full h-full flex items-center justify-center">
      {children}
    </div>
  </motion.div>
);

const SectionHeader = ({ icon: Icon, title, colorClass = "text-orange-500" }: { icon: any; title: string; colorClass?: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <motion.div 
      whileHover={{ rotate: 10, scale: 1.05 }}
      className={`p-2 rounded-xl bg-white/5 border border-white/10 ${colorClass}/10`}
    >
      <Icon className={`w-5 h-5 ${colorClass}`} />
    </motion.div>
    <h4 className="text-xl md:text-2xl font-black italic uppercase tracking-tight text-white">
      {title.split(' ')[0]} <span className={colorClass}>{title.split(' ').slice(1).join(' ')}</span>
    </h4>
  </div>
);

// --- COMPACT ANIMATED COMPONENTS ---

const LaughingAnim = () => (
  <InteractiveBox className="bg-orange-500/5">
    <div className="relative">
      <motion.div animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
        <Laugh className="w-12 h-12 text-orange-500" />
      </motion.div>
      <AnimatePresence>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.1, 0.7], y: -50, x: (i - 1) * 20 }}
            transition={{ repeat: Infinity, duration: 2, delay: i * 0.6 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 text-orange-400 font-bold italic text-sm"
          >
            HA!
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  </InteractiveBox>
);

const VideoAnim = () => (
  <InteractiveBox className="bg-blue-500/5">
    <div className="flex flex-col items-center gap-2">
       <Video className="w-10 h-10 text-blue-500" />
       <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [4, 10, 4] }}
              transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
              className="w-1 bg-blue-500/30 rounded-full"
            />
          ))}
       </div>
    </div>
  </InteractiveBox>
);

const ChatAnim = () => (
  <InteractiveBox className="bg-cyan-500/5">
     <div className="w-full max-w-[120px] space-y-2">
       {[0, 1].map((i) => (
         <div key={i} className={`h-2 rounded-full ${i % 2 === 0 ? 'bg-cyan-500/20 w-full' : 'bg-white/10 w-2/3'}`} />
       ))}
       <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2 }} className="flex gap-1 justify-center pt-1">
          <div className="w-1 h-1 bg-cyan-500 rounded-full" />
          <div className="w-1 h-1 bg-cyan-500 rounded-full" />
       </motion.div>
    </div>
  </InteractiveBox>
);

const VaultAnim = () => (
  <InteractiveBox className="bg-purple-500/5">
    <motion.div animate={{ rotateY: [0, 360] }} transition={{ repeat: Infinity, duration: 5 }}>
      <Key className="w-12 h-12 text-purple-500" />
    </motion.div>
  </InteractiveBox>
);

const ShieldAnim = () => (
  <InteractiveBox className="bg-emerald-500/5">
    <div className="relative">
       <ShieldCheck className="w-12 h-12 text-emerald-500" />
       <motion.div animate={{ top: ["-10%", "110%", "-10%"] }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="absolute left-0 right-0 h-0.5 bg-emerald-400/40 blur-[1px]" />
    </div>
  </InteractiveBox>
);

const VoiceAnim = () => (
   <InteractiveBox className="bg-red-500/5">
      <div className="flex items-center gap-1 h-8">
         {[...Array(8)].map((_, i) => (
           <motion.div
             key={i}
             animate={{ height: [5, Math.random() * 25 + 5, 5] }}
             transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.05 }}
             className="w-1 bg-red-500 rounded-full"
           />
         ))}
      </div>
   </InteractiveBox>
);

export default function ServicesPage() {
  const data = [
    {
      title: "Comedy",
      content: (
        <div className="space-y-3">
          <SectionHeader icon={Laugh} title="Pure Comedy" />
          <p className="text-neutral-400 text-xs md:text-sm mb-6 max-w-xl leading-relaxed">
            Short skits and full podcasts. The funniest content in one place.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             <LaughingAnim />
             <VideoAnim />
          </div>
        </div>
      ),
    },
    {
      title: "Social",
      content: (
        <div className="space-y-3">
          <SectionHeader icon={MessageSquare} title="Global Connection" colorClass="text-cyan-500" />
          <p className="text-neutral-400 text-xs md:text-sm mb-6 max-w-xl leading-relaxed">
            Chat 24/7 with friends and comedy lovers worldwide.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             <ChatAnim />
             <InteractiveBox className="bg-indigo-500/5">
                <Users className="w-10 h-10 text-indigo-500/40" />
             </InteractiveBox>
          </div>
        </div>
      ),
    },
    {
      title: "Security",
      content: (
        <div className="space-y-3">
          <SectionHeader icon={ShieldCheck} title="Ironclad Auth" colorClass="text-emerald-500" />
          <p className="text-neutral-400 text-xs md:text-sm mb-6 max-w-xl leading-relaxed">
            Secure Google login to protect your profile and private keys.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             <ShieldAnim />
             <InteractiveBox className="bg-teal-500/5">
                <Fingerprint className="w-10 h-10 text-teal-500/40" />
             </InteractiveBox>
          </div>
        </div>
      ),
    },
    {
      title: "Premium",
      content: (
        <div className="space-y-3">
          <SectionHeader icon={Key} title="Secret Vault" colorClass="text-purple-500" />
          <p className="text-neutral-400 text-xs md:text-sm mb-6 max-w-xl leading-relaxed">
            Unlock exclusive masterpieces with private digital keys.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             <VaultAnim />
             <InteractiveBox className="bg-pink-500/5">
                <Lock className="w-10 h-10 text-pink-500/40" />
             </InteractiveBox>
          </div>
        </div>
      ),
    },
    {
      title: "Audio",
      content: (
        <div className="space-y-3">
          <SectionHeader icon={Mic} title="Voice Rooms" colorClass="text-rose-500" />
          <p className="text-neutral-400 text-xs md:text-sm mb-6 max-w-xl leading-relaxed">
             Zero-latency rooms for group laughter and talk sessions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             <VoiceAnim />
             <InteractiveBox className="bg-rose-500/5">
                <Mic className="w-10 h-10 text-rose-500/40" />
             </InteractiveBox>
          </div>
        </div>
      ),
    },
  ];
  
  return (
    <div className="min-h-screen w-full relative bg-[#040404]">
       <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.05),transparent)] pointer-events-none" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none" />
       </div>
        
        <div className="relative z-10">
          <Timeline data={data} />
        </div>
        
        <div className="max-w-5xl mx-auto pb-20 px-4 relative z-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="relative p-8 md:p-12 rounded-3xl bg-neutral-900/40 border border-white/5 backdrop-blur-3xl text-center overflow-hidden group"
            >
                 <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                 
                 <div className="relative z-10">
                    <Headphones className="w-8 h-8 text-orange-500 mx-auto mb-4" />
                    <h3 className="text-2xl md:text-5xl font-black italic uppercase text-white mb-4 tracking-tighter">
                       Ready for the <span className="text-orange-500">Experience?</span>
                    </h3>
                    <p className="text-neutral-400 max-w-md mx-auto mb-8 text-sm md:text-base">Join the most elite comedy community in the world. Secure. Private. Hilarious.</p>
                    <motion.button 
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       className="px-8 py-4 bg-orange-500 text-black font-black uppercase italic tracking-wider rounded-xl shadow-xl shadow-orange-500/10"
                    >
                       Get Started Now
                    </motion.button>
                 </div>
            </motion.div>
        </div>
    </div>
  );
}
