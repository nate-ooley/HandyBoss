import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { VoiceProvider } from "./contexts/VoiceContext";

createRoot(document.getElementById("root")!).render(
  <WebSocketProvider>
    <VoiceProvider>
      <App />
    </VoiceProvider>
  </WebSocketProvider>
);
