import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc'

export default defineConfig({
  plugins: [
    swc.vite({
      jsc: {
        target: 'es2020',
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true }
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/setup.ts',
    include: ['test/**/*.e2e-spec.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage-e2e',
      reporter: ['text', 'html', 'lcov']
    }
  }
})
