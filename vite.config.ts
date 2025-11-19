import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Dynamically import Replit plugins only if available
async function getReplitPlugins() {
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    try {
      const [errorModal, cartographer, devBanner] = await Promise.all([
        import("@replit/vite-plugin-runtime-error-modal").catch(() => null),
        import("@replit/vite-plugin-cartographer").catch(() => null),
        import("@replit/vite-plugin-dev-banner").catch(() => null),
      ]);
      
      return [
        errorModal?.default?.(),
        cartographer?.cartographer?.(),
        devBanner?.devBanner?.(),
      ].filter(Boolean);
    } catch {
      return [];
    }
  }
  return [];
}

export default defineConfig(async () => {
  const replitPlugins = await getReplitPlugins();
  const projectRoot = import.meta.dirname;
  
  return {
    root: projectRoot,
    plugins: [
      react(),
      ...replitPlugins,
    ],
    resolve: {
      alias: {
        "@": path.resolve(projectRoot, "client", "src"),
        "@shared": path.resolve(projectRoot, "shared"),
        "@assets": path.resolve(projectRoot, "attached_assets"),
      },
    },
    build: {
      outDir: path.resolve(projectRoot, "dist/public"),
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(projectRoot, "index.html"),
        },
        output: {
          entryFileNames: "assets/[name]-[hash].js",
        },
      },
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
