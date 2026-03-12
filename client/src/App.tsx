import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import LandingPage from "@/pages/LandingPage";
import AudiosPage from "@/pages/AudiosPage";
import VideosPage from "@/pages/VideosPage";
import LoginPage from "@/pages/admin/LoginPage";
import RegisterPage from "@/pages/admin/RegisterPage";
import { ROUTES } from "@/constants/routes";

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
        <Route path={ROUTES.ADMIN_LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.ADMIN_REGISTER} element={<RegisterPage />} />
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
