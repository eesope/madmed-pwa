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
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
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
        enabled: false,
        type: "module",
      },
      workbox: {
        // React Router SPA용: 네비게이션 요청은 index.html로
        navigateFallback: "/index.html",
      },
      // injectManifest 에서는 navigateFallback 을 Service Worker 코드에서 처리 
      // == SW는 VitePWA 가 자동 생성하는 블랙박스 SW가 아닌, customized src/sw.ts 가 됨
      // == Firebase Cloud Message background 로직도 위 파일에 포함 가능 
    }),
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: [".trycloudflare.com"],
  },
});
