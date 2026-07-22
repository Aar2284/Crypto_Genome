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
        configure: (proxy) => {
          // Silence ECONNREFUSED noise when backend is offline — app handles this gracefully
          proxy.on("error", () => {})
        },
      },
      // Proxy WebSocket connection to FastAPI backend
      "/ws": {
        target: "ws://localhost:8000",
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("error", () => {})
        },
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
})
