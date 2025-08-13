import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    include: ['{src,test}/**/*.{spec,test,e2e,e2e-spec}.{ts,tsx,js,jsx}'],
    css: true
  }
})
