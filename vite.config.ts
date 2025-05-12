import { defineConfig } from 'vite';

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  root: 'src', // Serve index.html from src/
  clearScreen: false, // Prevent obscuring Rust errors
  server: {
    port: 1420, // Match tauri.conf.json devUrl
    strictPort: true, // Fail if port is unavailable
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : true, // Enable HMR locally
    watch: {
      ignored: ['**/src-tauri/**'], // Ignore Rust backend
    },
  },
  build: {
    outDir: '../dist', // Output to podai-refine-color/dist/
    emptyOutDir: true, // Clear dist/ before building
  },
});