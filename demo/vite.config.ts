import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The demo/showcase app. `pnpm demo` serves it; `pnpm demo:build` emits a
// static site you can host anywhere.
export default defineConfig({
  root: new URL('.', import.meta.url).pathname,
  base: './',
  plugins: [react(), tailwindcss()],
  server: { host: '127.0.0.1', port: 5177, open: false },
  build: { outDir: 'dist', emptyOutDir: true },
})
