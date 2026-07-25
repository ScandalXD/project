import "dotenv/config";
import app from "./app";
import { createServer } from "http";
import { initializeChatSocket } from "./services/socket.service";

const PORT = Number(process.env.PORT) || 3000;
const httpServer = createServer(app);

initializeChatSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
