import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, GeoJSON, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { motion } from "framer-motion";
import { ChevronRight, Map as MapIcon, Users, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

// --- Remove Defaults ---
delete (L.Icon.Default.prototype as any)._getIconUrl;

const INDIA_GEOJSON_URL = "https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States.geojson";
const KERALA_GEOJSON_URL = "https://raw.githubusercontent.com/geohacker/kerala/master/geojsons/district.geojson";

const WORLD_CENTER: [number, number] = [20, 0];
const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

const createAvatarIcon = (url: string, isSelected: boolean) => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
         <div class="w-8 h-8 rounded-full border-2 ${isSelected ? 'border-orange-500 scale-125 shadow-[0_0_15px_rgba(249,115,22,0.6)]' : 'border-orange-500/40'} bg-black relative z-10 overflow-hidden transition-all duration-300">
            <img src="${url}" class="w-full h-full object-cover" />
         </div>
         <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black z-20"></div>
      </div>
    `,
    className: "custom-avatar-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export default function StatusPage() {
  const { user, syncLocation } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [view, setView] = useState<"world" | "india" | "kerala">("world");
  const [activeTab, setActiveTab] = useState<"map" | "list">("map"); // Mobile Toggler
  const [indiaGeo, setIndiaGeo] = useState<any>(null);
  const [keralaGeo, setKeralaGeo] = useState<any>(null);

  const fetchUsers = async () => {
    try {
        const res = await fetch("http://localhost:5000/api/auth");
        if (res.ok) {
            const data = await res.json();
            setMembers(data);
        }
    } catch (e) { console.error("API error", e); }
  };

  const handleSyncLocation = () => {
    if (user?.id) {
        syncLocation(user.id, true);
        // Refresh list slightly after to catch some changes
        setTimeout(fetchUsers, 3000); 
    }
  };

  // --- 🛰️ CONTINUOUS HUB ENGINE ---
  useEffect(() => {
    const loadGeoData = async () => {
       try {
          const [indiaRes, keralaRes] = await Promise.all([
             fetch(INDIA_GEOJSON_URL),
             fetch(KERALA_GEOJSON_URL)
          ]);
          setIndiaGeo(await indiaRes.json());
          setKeralaGeo(await keralaRes.json());
       } catch (e) { console.error("GeoJSON error", e); }
    };

    loadGeoData();
    fetchUsers();
    const interval = setInterval(fetchUsers, 15000);
    return () => clearInterval(interval);
  }, []);

  const MapController = () => {
    const map = useMap();
    const prevView = useRef<string>(view);
    
    useEffect(() => {
       if (prevView.current !== view) {
          if (view === "world") {
             map.setView(WORLD_CENTER, 2);
          } else if (view === "india") {
             map.setView(INDIA_CENTER, 5);
          } else {
             map.fitBounds([
                [8.18, 74.85],
                [12.8, 77.4],
             ], { padding: [40, 40] });
          }
          prevView.current = view;
       }
    }, [view, map]);

    return null;
  };

  const indiaStyle = {
    fillColor: "#333", weight: 1, opacity: 0.2, color: "#999", fillOpacity: 0.05
  };

  const keralaStyle = {
    fillColor: "#f97316", weight: 2, opacity: 0.8, color: "#f97316", fillOpacity: 0.0
  };

  const onEachState = (feature: any, layer: any) => {
    layer.on({
      click: (e: any) => {
         if (feature.properties.ST_NM === "Kerala" || feature.properties.State_Name === "Kerala") {
            setView("kerala");
         } else {
            const map = e.target._map;
            map.fitBounds(e.target.getBounds());
         }
      },
      mouseover: (e: any) => { e.target.setStyle({ fillOpacity: 0.3, fillColor: "#f97316" }); },
      mouseout: (e: any) => { e.target.setStyle(indiaStyle); }
    });
  };

  return (
    <div className="h-screen w-full relative bg-black text-white flex flex-col font-sans overflow-hidden">
      
      <Navbar />

      {/* MOBILE TAB TOGGLER - Floating Overlay */}
      <div className="md:hidden fixed top-20 left-1/2 -translate-x-1/2 z-[2005] bg-black/60 backdrop-blur-xl p-1 rounded-xl border border-white/5 flex shadow-2xl">
         <button 
            onClick={() => setActiveTab("map")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'map' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'text-neutral-400 hover:text-white'}`}
         >
            <MapIcon className="w-3.5 h-3.5" /> Map
         </button>
         <button 
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'list' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'text-neutral-400 hover:text-white'}`}
         >
            <Users className="w-3.5 h-3.5" /> List
         </button>
      </div>

      {/* FLOATING MOBILE SYNC BUTTON (On Map View) */}
      {activeTab === 'map' && user && (
         <button 
            onClick={handleSyncLocation}
            className="md:hidden fixed bottom-24 right-4 z-[2005] w-14 h-14 bg-orange-500 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-black group"
         >
            <RefreshCw className="w-6 h-6 text-black group-hover:rotate-180 transition-transform duration-700" />
         </button>
      )}

      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        
        {/* 🗺️ LEAFLET SECTION */}
        <div className={`flex-1 relative bg-neutral-100 overflow-hidden border-t border-white/5 ${activeTab === 'map' ? 'block' : 'hidden md:block'}`}>
          <MapContainer 
            center={WORLD_CENTER} 
            zoom={2} 
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapController />

            {view === "india" && indiaGeo && (
              <GeoJSON data={indiaGeo} style={indiaStyle} onEachFeature={onEachState} />
            )}

            {view === "kerala" && keralaGeo && (
              <GeoJSON data={keralaGeo} style={keralaStyle} />
            )}
            
            {members.map(m => {
               if (!m.location?.lat || !m.location?.lng) return null;
               return (
                 <Marker 
                   key={m._id} 
                   position={[m.location.lat, m.location.lng]}
                   icon={createAvatarIcon(m.image || "https://i.pravatar.cc/150", selectedUser?._id === m._id)}
                   eventHandlers={{ 
                     click: () => {
                       setSelectedUser(m);
                       if(m.location) setView('kerala');
                     }
                   }}
                 >
                    <Popup className="premium-popup">
                       <div className="flex flex-col items-center p-2 min-w-[150px] text-center">
                          <img src={m.image || "https://i.pravatar.cc/150"} className="w-12 h-12 rounded-full border-2 border-orange-500 mb-2 shadow-lg" />
                          <h4 className="text-sm font-black italic uppercase text-white leading-none mb-1">{m.name}</h4>
                          <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">{m.location?.name || 'Local Hub'}</p>
                          <p className="text-[7px] text-neutral-400 uppercase font-black tracking-widest mb-2">
                             {m.location?.district || 'Kerala'} {m.location?.state ? `• ${m.location.state}` : ''}
                          </p>
                          <div className="w-full h-[1px] bg-white/10 mb-2" />
                          <span className="text-[7px] font-black italic text-emerald-500 uppercase tracking-widest">{m._id === user?.id ? 'THIS IS YOU' : 'MEMBER: LIVE'}</span>
                       </div>
                    </Popup>
                 </Marker>
               );
            })}
          </MapContainer>
        </div>

        {/* 📋 MEMBERS ASIDE SECTION */}
        <aside className={`w-full md:w-80 lg:w-96 bg-black border-l border-white/5 flex flex-col h-full z-[1000] ${activeTab === 'list' ? 'block' : 'hidden md:flex'}`}>
           <div className="p-8 pb-4">
              <h2 className="text-3xl md:text-4xl font-black italic uppercase text-white tracking-tighter leading-[0.8] mb-8">CONNECTED <br/>NOW</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-[#111] p-4 rounded-3xl border border-white/5">
                    <span className="text-[7px] text-neutral-500 uppercase font-black tracking-widest block mb-2">Legends</span>
                    <span className="text-2xl font-black text-white">{members.length}</span>
                 </div>
                 <div className="bg-[#111] p-4 rounded-3xl border border-white/5 cursor-pointer hover:border-orange-500/30 transition-all"
                      onClick={() => setView(view === 'world' ? 'india' : view === 'india' ? 'kerala' : 'world')}>
                    <span className="text-[7px] text-neutral-500 uppercase font-black tracking-widest block mb-2">Region</span>
                    <span className="text-2xl font-black text-emerald-500 capitalize">{view}</span>
               </div>
            </div>
         </div>

            {/* 📍 UPDATE LOCATION ACTION */}
            {user && (
               <div className="px-8 mb-6">
                  <button 
                  onClick={handleSyncLocation}
                  className="w-full p-4 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between group hover:bg-orange-500/20 transition-all active:scale-[0.98]"
                  >
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                           <RefreshCw className="w-5 h-5 text-black group-hover:rotate-180 transition-transform duration-700" />
                        </div>
                        <div className="text-left">
                           <span className="text-[10px] font-black uppercase text-white tracking-widest block leading-none mb-1">Update Hub</span>
                           <span className="text-[8px] font-bold text-orange-400 uppercase tracking-widest opacity-60">Sync My GPS</span>
                        </div>
                     </div>
                     <ChevronRight className="w-4 h-4 text-orange-500/50" />
                  </button>
               </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 custom-scrollbar">
              {members.map(m => (
                <motion.div
                  key={m._id}
                  onClick={() => { setSelectedUser(m); if(m.location) { setView('kerala'); setActiveTab('map'); } }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${selectedUser?._id === m._id ? 'bg-orange-500/10 border-orange-500/30' : 'bg-transparent border-white/5 hover:bg-white/5'}`}
                >
                   <div className="relative">
                      <img src={m.image || "https://i.pravatar.cc/150"} className="w-11 h-11 rounded-full border border-white/10 shadow-sm" />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{m.name}</div>
                      <div className="text-[9px] text-orange-500 uppercase font-black italic tracking-widest truncate">
                         {m.location?.name || 'Local'} {m.location?.district ? `• ${m.location.district}` : ''}
                      </div>
                   </div>
                   <ChevronRight className="w-4 h-4 text-neutral-700" />
                </motion.div>
              ))}
           </div>

           <div className="p-8 border-t border-white/5 mb-20 md:mb-0">
              <button className="w-full py-4 bg-orange-500 text-black text-[10px] font-black uppercase italic tracking-widest rounded-xl shadow-lg active:scale-95 transition-all">
                 Join Elite Status
              </button>
           </div>
        </aside>
      </div>

      <style>{`
        .leaflet-container { background: #000 !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(249,115,22,0.2); border-radius: 10px; }
        .premium-popup .leaflet-popup-content-wrapper { background: #000; color: white; border: 1px solid #f97316; border-radius: 1.5rem; padding: 0.5rem; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
        .premium-popup .leaflet-popup-tip { background: #000; border: 1px solid #f97316; }
        .leaflet-popup-close-button { color: #f97316 !important; }
      `}</style>
    </div>
  );
}
