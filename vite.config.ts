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
  
  // Use process.cwd() for Vercel compatibility - it should be the project root
  const projectRoot = process.cwd();
  const clientRoot = path.resolve(projectRoot, "client");
  
  return {
    plugins: [
      react(),
      ...replitPlugins,
    ],
    resolve: {
      alias: {
        "@": path.resolve(clientRoot, "src"),
        "@shared": path.resolve(projectRoot, "shared"),
        "@assets": path.resolve(projectRoot, "attached_assets"),
      },
    },
    root: clientRoot,
    build: {
      outDir: path.resolve(projectRoot, "dist/public"),
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(clientRoot, "index.html"),
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
