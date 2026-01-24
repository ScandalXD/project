import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import cocktailRoutes from "./routes/cocktail.routes";




const app = express();

app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use("/api", cocktailRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", profileRoutes);

export default app;
