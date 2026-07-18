import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Change this if your GitHub repository name is different!
  base: '/leetcode-visualizer/', 
})
