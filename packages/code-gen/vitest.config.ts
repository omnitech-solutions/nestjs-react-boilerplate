import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc'
import path from 'path'

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
    resolve: {
        alias: {
            '@utils': path.resolve(__dirname, 'src/utils'),
            '@utils/*': path.resolve(__dirname, 'src/utils/*')
        }
    },
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/*.{spec,test}.ts', 'test/**/*.{spec,test}.ts'],
        passWithNoTests: true,
        coverage: {
            provider: 'v8',
            reportsDirectory: 'coverage',
            reporter: ['text', 'html', 'lcov']
        },
    }
})