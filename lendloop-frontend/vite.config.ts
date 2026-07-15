import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

// Standard, platform-agnostic Vite config for the LendLoop frontend
// (TanStack Start + Nitro). Works on any machine or host — locally, on
// Render, on Vercel, etc.:
//  - Locally / Render: Nitro builds the "node-server" preset by default,
//    producing `.output/server/index.mjs`, which is started with `npm start`.
//  - Vercel: Nitro auto-detects the Vercel build environment (the `VERCEL`
//    env var Vercel sets during builds) and switches to the "vercel" preset
//    automatically — no extra config needed.
//
// Ports are configurable via a `.env` file at the project root (see
// `.env.example`) so this runs on whatever port you want (3000, 5000, 8080…)
// without editing this file:
//   FRONTEND_PORT — port this dev/prod server listens on (default 5000)
//   BACKEND_PORT  — port the Express backend listens on, used to build the
//                   local proxy target below (default 3001)
export default defineConfig(({ mode }) => {
  // Load ALL env vars (not just VITE_-prefixed ones) from `.env` files so
  // FRONTEND_PORT / BACKEND_PORT can be set there like any other setting.
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), "") };
  const frontendPort = Number(env.FRONTEND_PORT || env.PORT || 5000);
  const backendPort = Number(env.BACKEND_PORT || 3001);

  return {
    server: {
      port: frontendPort,
      host: "0.0.0.0",
      allowedHosts: true,
    },
    resolve: {
      // Avoid duplicate React/TanStack instances being bundled twice.
      dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
    },
    plugins: [
      viteTsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
      tanstackStart({
        server: { entry: "server" },
      }),
      nitro({
        routeRules: {
          "/api/**": { proxy: `http://localhost:${backendPort}/api/**` },
          "/health": { proxy: `http://localhost:${backendPort}/health` },
        },
      }),
      viteReact(),
    ],
  };
});
