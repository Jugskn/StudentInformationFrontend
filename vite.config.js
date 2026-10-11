import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import oxlint from 'vite-plugin-oxlint'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), oxlint(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
