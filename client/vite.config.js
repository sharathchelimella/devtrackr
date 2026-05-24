import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000", // ✅ IMPORTANT FIX
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Split big libraries into separate chunks for optimization
            if (id.includes("recharts") || id.includes("d3") || id.includes("react-resize-detector")) {
              return "recharts-vendor";
            }
            if (id.includes("lucide-react")) {
              return "lucide-vendor";
            }
            return "vendor";
          }
        }
      }
    }
  }
});
