import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(token: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const nextSocket = io("http://localhost:3000", {
      auth: {
        token,
      },
    });

    nextSocket.on("connect", () => {
      setIsConnected(true);
      setError("");
    });

    nextSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    nextSocket.on("connect_error", (err) => {
      setError(err.message);
      setIsConnected(false);
    });

    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
    };
  }, [token]);

  return {
    socket,
    isConnected,
    error,
  };
}
