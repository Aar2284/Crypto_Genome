import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy REST API calls to FastAPI backend
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      // Proxy WebSocket connection to FastAPI backend
      "/ws": {
        target: "ws://localhost:8000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
})
