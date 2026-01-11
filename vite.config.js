import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // ตั้งค่า target เป็น esnext เพื่อรองรับ import.meta
    target: 'esnext' 
  },
  optimizeDeps: {
    esbuildOptions: {
      // ตั้งค่า target สำหรับการรันตอนพัฒนา (dev)
      target: 'esnext'
    }
  }
})
