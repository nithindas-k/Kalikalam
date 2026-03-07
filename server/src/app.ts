import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import audioRoutes from "./modules/audio/audio.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { API_ROUTES } from "./constants/routes";

const app = express();
const PORT = process.env.PORT || 5000;


const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:3000",
].filter(Boolean) as string[];

app.use(
    cors({
        origin: (origin, callback) => {
      
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app")) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Accept"],
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(`${API_ROUTES.BASE}${API_ROUTES.AUDIOS}`, audioRoutes);


app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});


app.use(errorMiddleware);


connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
});
