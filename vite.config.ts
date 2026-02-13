import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React生态分离
          'vendor-react': ['react', 'react-dom'],
          // Three.js生态分离
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          // MediaPipe分离
          'vendor-mediapipe': ['@mediapipe/tasks-vision'],
        },
      },
    },
    // 提高chunk大小警告阈值
    chunkSizeWarningLimit: 600,
  },
})
