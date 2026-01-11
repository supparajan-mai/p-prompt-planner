import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// พี่พร้อมปรับปรุงเพื่อรองรับการ Deploy บน Netlify และมาตรฐานสมัยใหม่จ๊ะ
export default defineConfig({
  plugins: [react()],
  build: {
    // บังคับให้ใช้มาตรฐานสมัยใหม่เพื่อรองรับ import.meta.env จ๊ะ
    target: 'esnext',
    // ป้องกันปัญหา Memory ในบางสภาพแวดล้อม
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    esbuildOptions: {
      // สำหรับการรันตอนพัฒนา (Dev Mode)
      target: 'esnext',
    },
  },
})