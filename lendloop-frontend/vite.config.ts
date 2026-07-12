import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

// Standard, platform-agnostic Vite config for the LendLoop frontend
// (TanStack Start + Nitro). Works locally, on Render, and on Vercel:
//  - Locally / Render: Nitro builds the "node-server" preset by default,
//    producing `.output/server/index.mjs`, which is started with `npm start`.
//  - Vercel: Nitro auto-detects the Vercel build environment (the `VERCEL`
//    env var Vercel sets during builds) and switches to the "vercel" preset
//    automatically — no extra config needed.
export default defineConfig({
  server: {
    port: 3000,
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
    nitro(),
    viteReact(),
  ],
});
