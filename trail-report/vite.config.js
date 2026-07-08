import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// IMPORTANT: `base` must match your repo name for GitHub Pages.
// If your repo is https://github.com/<you>/trail-report, leave this as "/trail-report/".
// If you rename the repo, change it here too.
export default defineConfig({
  base: "/mochicat-trail-report/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Trail Report",
        short_name: "Trail Report",
        description: "Personal training dashboard — data stored locally on your device.",
        theme_color: "#0C110D",
        background_color: "#0C110D",
        display: "standalone",
        orientation: "portrait",
        scope: "/mochicat-trail-report/",
        start_url: "/mochicat-trail-report/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "index.html"
      }
    })
  ]
});
