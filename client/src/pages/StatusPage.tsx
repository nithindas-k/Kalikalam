import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, GeoJSON, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { motion } from "framer-motion";
import { Laugh, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";

// --- Remove Defaults ---
delete (L.Icon.Default.prototype as any)._getIconUrl;

const INDIA_GEOJSON_URL = "https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States.geojson";
const KERALA_GEOJSON_URL = "https://raw.githubusercontent.com/geohacker/kerala/master/geojsons/district.geojson";

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const INDIA_BOUNDS: [[number, number], [number, number]] = [[5, 65], [38, 98]];

const createAvatarIcon = (url: string, isSelected: boolean) => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
         <div class="w-8 h-8 rounded-full border-2 ${isSelected ? 'border-orange-500 scale-125 shadow-[0_0_15px_rgba(212,168,67,0.6)]' : 'border-[#d4a843]'} bg-black relative z-10 overflow-hidden transition-all duration-300">
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
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [view, setView] = useState<"india" | "kerala">("india");
  const [indiaGeo, setIndiaGeo] = useState<any>(null);
  const [keralaGeo, setKeralaGeo] = useState<any>(null);

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

    const fetchUsers = async () => {
       try {
          const res = await fetch("http://localhost:5000/api/auth");
          if (res.ok) {
             const data = await res.json();
             setMembers(data);
          }
       } catch (e) { console.error("API error", e); }
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
          if (view === "india") {
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
    fillColor: "#d4a843", weight: 2, opacity: 0.8, color: "#d4a843", fillOpacity: 0.0
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
      mouseover: (e: any) => { e.target.setStyle({ fillOpacity: 0.3, fillColor: "#d4a843" }); },
      mouseout: (e: any) => { e.target.setStyle(indiaStyle); }
    });
  };

  return (
    <div className="h-screen w-full relative bg-black text-white flex flex-col font-sans overflow-hidden">
      
      <header className="h-20 flex items-center justify-between px-6 bg-black border-b border-white/5 z-[2000]">
         <div className="flex items-center gap-4">
            <Link to={ROUTES.HOME} className="flex items-center gap-3">
               <div className="w-10 h-10 bg-[#d4a843] rounded-xl flex items-center justify-center shadow-lg shadow-[#d4a843]/10">
                  <Laugh className="w-6 h-6 text-black" />
               </div>
               <div className="flex flex-col">
                  <h1 className="text-2xl font-black italic uppercase text-[#d4a843] tracking-tighter leading-none">HA! Connect</h1>
                  <p className="text-[8px] uppercase font-bold text-neutral-500 tracking-[0.2em]">Live Community Network</p>
               </div>
            </Link>
         </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        
        <div className="flex-1 relative bg-neutral-100 overflow-hidden border-t border-white/5">
          <MapContainer 
            center={INDIA_CENTER} 
            zoom={5} 
            maxBounds={INDIA_BOUNDS}
            maxBoundsViscosity={1.0}
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
                       <div className="flex flex-col items-center p-2 min-w-[160px] text-center">
                          <img src={m.image || "https://i.pravatar.cc/150"} className="w-12 h-12 rounded-full border-2 border-[#d4a843] mb-2 shadow-lg" />
                          <h4 className="text-sm font-black italic uppercase italic text-white leading-none mb-1">{m.name}</h4>
                          <p className="text-[9px] font-bold text-[#d4a843] uppercase tracking-widest">{m.location?.name || 'Local Hub'}</p>
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

        <aside className="w-full md:w-80 lg:w-96 bg-black border-l border-white/5 flex flex-col h-full z-[1000]">
           <div className="p-8 pb-4">
              <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter leading-[0.8] mb-8">CONNECTED <br/>NOW</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-[#111] p-4 rounded-3xl border border-white/5">
                    <span className="text-[7px] text-neutral-500 uppercase font-black tracking-widest block mb-2">Legends</span>
                    <span className="text-2xl font-black text-white">{members.length}</span>
                 </div>
                 <div className="bg-[#111] p-4 rounded-3xl border border-white/5">
                    <span className="text-[7px] text-neutral-500 uppercase font-black tracking-widest block mb-2">Region</span>
                    <span className="text-2xl font-black text-emerald-500">{view === 'india' ? 'India' : 'Kerala'}</span>
                 </div>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 custom-scrollbar">
              {members.map(m => (
                <motion.div
                  key={m._id}
                  onClick={() => { setSelectedUser(m); if(m.location) setView('kerala'); }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${selectedUser?._id === m._id ? 'bg-[#d4a843]/10 border-[#d4a843]/30' : 'bg-transparent border-white/5 hover:bg-white/5'}`}
                >
                   <div className="relative">
                      <img src={m.image || "https://i.pravatar.cc/150"} className="w-11 h-11 rounded-full border border-white/10 shadow-sm" />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{m.name}</div>
                      <div className="text-[9px] text-[#d4a843] uppercase font-black italic tracking-widest truncate">
                         {m.location?.name || 'Local'} {m.location?.district ? `• ${m.location.district}` : ''}
                      </div>
                   </div>
                   <ChevronRight className="w-4 h-4 text-neutral-700" />
                </motion.div>
              ))}
           </div>

           <div className="p-8 border-t border-white/5">
              <button className="w-full py-4 bg-[#d4a843] text-black text-[10px] font-black uppercase italic tracking-widest rounded-xl shadow-lg active:scale-95 transition-all">
                 Join Elite Status
              </button>
           </div>
        </aside>
      </div>

      <style>{`
        .leaflet-container { background: #000 !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,168,67,0.2); border-radius: 10px; }
        .premium-popup .leaflet-popup-content-wrapper { background: #000; color: white; border: 1px solid #d4a843; border-radius: 1.5rem; padding: 0.5rem; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
        .premium-popup .leaflet-popup-tip { background: #000; border: 1px solid #d4a843; }
        .leaflet-popup-close-button { color: #d4a843 !important; }
      `}</style>
    </div>
  );
}
