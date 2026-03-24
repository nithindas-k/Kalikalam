import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

interface User {
    id: string;
    name: string;
    email: string;
    image: string;
    role: "user" | "admin";
    location?: {
        name: string;
        district?: string;
        state?: string;
        lat: number;
        lng: number;
    };
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    updateUser: (updatedUser: User) => void;
    syncLocation: (uid: string, isManual?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem("auth_token");
        const savedUser = localStorage.getItem("auth_user");

        if (savedToken && savedUser) {
            try {
                const decoded: any = jwtDecode(savedToken);
                const isExpired = decoded.exp * 1000 < Date.now();

                if (isExpired) {
                    logout();
                } else {
                    const parsedUser = JSON.parse(savedUser);
                    setToken(savedToken);
                    setUser(parsedUser);
                    syncLocation(parsedUser.id); // Sync location on initial load
                }
            } catch {
                logout();
            }
        }
        setLoading(false);
    }, []);

    const syncLocation = (uid: string, isManual: boolean = false) => {
        if ("geolocation" in navigator) {
            if (isManual) Object.assign(toast, { __gpsId: toast.loading("Acquiring GPS satellite fix...") });
            
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                
                // 🌍 ADAPTIVE MULTI-LAYER GEOCODING
                let locationDetails = { name: "Safe Hub", district: "Kerala", state: "India" };
                try {
                   const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                   const data = await res.json();
                   const addr = data.address;
                   locationDetails = {
                      name: addr.city || addr.town || addr.village || addr.suburb || "Local Hub",
                      district: addr.county || addr.district || "Kerala District",
                      state: addr.state || "Kerala"
                   };
                } catch (e) { console.warn("Reverse geocode failed", e); }

                try {
                    const response = await fetch(`http://localhost:5000/api/auth/profile/${uid}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                           location: { ...locationDetails, lat: latitude, lng: longitude } 
                        })
                    });
                    if (response.ok) {
                        const updatedData = await response.json();
                        // Update local user state if it's the current user
                        if (user && user.id === uid && updatedData.user) {
                            updateUser(updatedData.user);
                        }
                        if (isManual) {
                           toast.dismiss((toast as any).__gpsId);
                           toast.success("Location synchronized successfully!");
                        }
                    } else if (isManual) {
                        toast.dismiss((toast as any).__gpsId);
                        toast.error("Database update failed.");
                    }
                } catch (e) {
                    console.error("Auto-location sync failed", e);
                    if (isManual) {
                        toast.dismiss((toast as any).__gpsId);
                        toast.error("Failed to connect to server.");
                    }
                }
            }, (err) => {
               console.warn("User GPS denied", err);
               if (isManual) {
                  toast.dismiss((toast as any).__gpsId);
                  if (err.code === err.PERMISSION_DENIED) {
                     toast.error("Location permission denied. Please enable it in browser settings.");
                  } else {
                     toast.error("Failed to acquire GPS signal.");
                  }
               }
            }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
        } else if (isManual) {
            toast.error("Geolocation is not supported by your browser.");
        }
    };

    const login = (newToken: string, userData: User) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem("auth_token", newToken);
        localStorage.setItem("auth_user", JSON.stringify(userData));
        syncLocation(userData.id); // Sync location on login
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem("auth_user", JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, syncLocation }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
