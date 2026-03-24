import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
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

export default function App() {
  return (
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
        <Route path={ROUTES.HOME} element={<LandingPage />} />
        <Route path={ROUTES.AUDIOS} element={<AudiosPage />} />
        <Route path={ROUTES.VIDEOS} element={<VideosPage />} />
        <Route path={ROUTES.CHAT} element={<ChatPage />} />
        <Route path={ROUTES.ADMIN_LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.ADMIN_REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.ADMIN_REQUESTS} element={<AdminRequestsPage />} />
        <Route path={ROUTES.ADMIN_AUDIOS} element={<AdminAudiosPage />} />
        <Route path={ROUTES.ADMIN_VIDEOS} element={<AdminVideosPage />} />
        <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
        <Route path={ROUTES.USER_PROFILE} element={<UserProfilePage />} />
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
