import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import audioRoutes from "./modules/audio/audio.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { API_ROUTES } from "./constants/routes";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type"],
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(`${API_ROUTES.BASE}${API_ROUTES.AUDIOS}`, audioRoutes);

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorMiddleware);

// Start
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
});
