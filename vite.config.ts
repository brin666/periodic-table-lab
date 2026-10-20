import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // UI/content edits should not invalidate the large, stable React runtime.
        manualChunks(id) {
          if (
            /node_modules\/(react|react-dom|scheduler)\//.test(
              id.replaceAll("\\", "/"),
            )
          )
            return "react-runtime";
        },
      },
    },
  },
  server: {
    port: 4178,
    strictPort: true,
    proxy: {
      "/api/feedback": {
        target: "http://127.0.0.1:4186",
        changeOrigin: false,
      },
    },
    // QA build copies and screenshots are not app inputs. On Windows, watching
    // a large export while it is being copied can terminate the dev server.
    watch: { ignored: ["**/qa/**"] },
  },
});
