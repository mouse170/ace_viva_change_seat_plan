import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/ace_viva_change_seat_plan/',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'esnext',
  },
})
