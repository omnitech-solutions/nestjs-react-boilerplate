import '@testing-library/jest-dom/vitest'

import './polyfills'

process.env.VITE_API_URL ||= 'http://localhost:3000';

const realError = console.error
vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const msg = args[0]
    if (typeof msg === 'string' && msg.includes('XMLHttpRequest')) return
    realError(...args as [])
})