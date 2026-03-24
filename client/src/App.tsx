import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/context/AuthContext";
import LandingPage from "@/pages/LandingPage";
import AudiosPage from "@/pages/AudiosPage";
import VideosPage from "@/pages/VideosPage";
import LoginPage from "@/pages/admin/LoginPage";
import RegisterPage from "@/pages/admin/RegisterPage";
import AdminRequestsPage from "@/pages/admin/AdminRequestsPage";
import AdminAudiosPage from "@/pages/admin/AdminAudiosPage";
import AdminVideosPage from "@/pages/admin/AdminVideosPage";
import { ROUTES } from "@/constants/routes";
import ProfilePage from "@/pages/admin/ProfilePage";
import UserProfilePage from "@/pages/UserProfilePage";
import ChatPage from "@/pages/ChatPage";
import { useAuth } from "@/context/AuthContext";
import UserLayout from "@/components/UserLayout";

// ─── Route Guard ────────────────────────────────────────────────────────────
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#020202] text-white flex items-center justify-center">Loading auth...</div>;
  if (!user) return <Navigate to={ROUTES.HOME} replace />;
  return <>{children}</>;
};

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "hsl(0 0% 8%)",
                border: "1px solid hsl(0 0% 16%)",
                color: "hsl(30 10% 96%)",
              },
            }}
            richColors
          />
          <Routes>
            <Route path={ROUTES.HOME} element={<UserLayout><LandingPage /></UserLayout>} />
            <Route path={ROUTES.AUDIOS} element={<UserLayout><AudiosPage /></UserLayout>} />
            <Route path={ROUTES.VIDEOS} element={<UserLayout><VideosPage /></UserLayout>} />
            <Route path={ROUTES.CHAT} element={<ProtectedRoute><UserLayout><ChatPage /></UserLayout></ProtectedRoute>} />

            <Route path={ROUTES.ADMIN_LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.ADMIN_REGISTER} element={<RegisterPage />} />
            <Route path={ROUTES.ADMIN_REQUESTS} element={<AdminRequestsPage />} />
            <Route path={ROUTES.ADMIN_AUDIOS} element={<AdminAudiosPage />} />
            <Route path={ROUTES.ADMIN_VIDEOS} element={<AdminVideosPage />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            <Route path={ROUTES.USER_PROFILE} element={<ProtectedRoute><UserLayout><UserProfilePage /></UserLayout></ProtectedRoute>} />
            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
