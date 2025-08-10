import '@testing-library/jest-dom/vitest'

import './polyfills'

process.env.VITE_API_URL ||= 'http://127.0.0.1:3000';

// Stub fetch (covers most libs)
vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
})))

// (Optional) Minimal XHR stub if something still uses it
class XHRStub {
    open() {}
    send() { /* no-op */ }
    setRequestHeader() {}
    abort() {}
}
vi.stubGlobal('XMLHttpRequest', XHRStub as any)