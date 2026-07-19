import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import { Providers } from "./app/providers";
import "./styles/globals.css";
import "./styles/sharing.css";
import "./styles/admin.css";
import "./styles/cocktails.css";
import "./styles/friends.css";
import "./styles/auth.css";
import "./styles/profile.css";
import "./styles/comments.css";
import "./styles/chat.css";
import "./styles/notifications.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  });
}
