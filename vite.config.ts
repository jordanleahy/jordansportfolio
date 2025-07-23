import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { staticOGPlugin } from "./src/plugins/staticOGPlugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    // Generate static OG files before build
    staticOGPlugin({
      enabled: mode === 'production',
      verbose: true
    }),
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Ensure static files are properly included
    rollupOptions: {
      // Don't bundle the static OG files - they should be copied as-is
      external: ['/blog/*.html']
    }
  }
}));
