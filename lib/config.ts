export const config = {
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000",
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3002",
  frontendUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
};