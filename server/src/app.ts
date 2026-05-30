import cors from "cors";
import express from "express";
import path from "path";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import cocktailRoutes from "./routes/cocktail.routes";
import favoriteRoutes from "./routes/favorite.routes";
import adminRoutes from "./routes/admin.routes";
import likeRoutes from "./routes/like.routes";
import commentRoutes from "./routes/comment.routes";
import notificationRoutes from "./routes/notification.routes";
import reportRoutes from "./routes/report.routes";
import friendRoutes from "./routes/friend.routes";
import chatRoutes from "./routes/chat.routes";
import chatReportRoutes from "./routes/chatReport.routes";
import adminChatRoutes from "./routes/adminChat.routes";

const app = express();

app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use("/api/auth", authRoutes);
app.use("/api", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", favoriteRoutes);
app.use("/api", cocktailRoutes);
app.use("/api", likeRoutes);
app.use("/api", commentRoutes);
app.use("/api", notificationRoutes);
app.use("/api", reportRoutes);
app.use("/api", friendRoutes);
app.use("/api", chatRoutes);
app.use("/api", chatReportRoutes);
app.use("/api/admin", adminChatRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

export default app;
