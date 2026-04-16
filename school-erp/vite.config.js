import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      ignored: [
        '**/backend/**',
        '**/backend/.mongodb-data/**',
        '**/backend/.mongodb-log/**',
        '**/backend/node_modules/**',
      ],
    },
  },
})
