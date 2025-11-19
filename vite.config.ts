import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// Plugin to handle root index.html when root is set to client/
function rootIndexHtmlPlugin(projectRoot: string, clientRoot: string): Plugin {
  return {
    name: "root-index-html",
    configResolved(config) {
      // Copy index.html to client/ temporarily for build
      const rootHtml = path.resolve(projectRoot, "index.html");
      const clientHtml = path.resolve(clientRoot, "index.html");
      if (fs.existsSync(rootHtml) && !fs.existsSync(clientHtml)) {
        const content = fs.readFileSync(rootHtml, "utf-8");
        // Rewrite the script path to be relative to client root
        const rewritten = content.replace(
          'src="/src/main.tsx"',
          'src="./src/main.tsx"'
        );
        fs.writeFileSync(clientHtml, rewritten);
      }
    },
    buildEnd() {
      // Clean up the temporary file
      const clientHtml = path.resolve(clientRoot, "index.html");
      if (fs.existsSync(clientHtml)) {
        fs.unlinkSync(clientHtml);
      }
    },
  };
}

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
  const clientRoot = path.resolve(projectRoot, "client");
  
  return {
    root: clientRoot,
    plugins: [
      rootIndexHtmlPlugin(projectRoot, clientRoot),
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
    build: {
      outDir: path.resolve(projectRoot, "dist/public"),
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(clientRoot, "index.html"),
        output: {
          entryFileNames: "assets/[name]-[hash].js",
        },
      },
    },
    publicDir: path.resolve(projectRoot, "client", "public"),
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
