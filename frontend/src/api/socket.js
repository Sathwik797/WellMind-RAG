import { io } from "socket.io-client";

function formatSocketUrl(raw) {
  if (!raw) return "http://localhost:5000";
  let url = String(raw).trim();
  if (
    !url.startsWith("http://") &&
    !url.startsWith("https://") &&
    !url.startsWith("ws://") &&
    !url.startsWith("wss://")
  ) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, "");
}

const SOCKET_URL = formatSocketUrl(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL);

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true,
});
socket.on("connect", () => console.log("Socket connected:", socket.id));
socket.on("connect_error", (err) => console.error("Socket connect error:", err.message));