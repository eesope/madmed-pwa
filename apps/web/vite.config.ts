import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "MadMed",
        short_name: "MadMed",
        description: "Medication tracker for households",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      // dev에서도 SW 등록/테스트 가능하게 (iPhone 테스트에 도움)
      devOptions: {
        enabled: true,
        type: "module",
      },
      workbox: {
        // React Router SPA용: 네비게이션 요청은 index.html로
        navigateFallback: "/index.html",
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: [".trycloudflare.com"],
  },
});
