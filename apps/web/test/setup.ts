import '@testing-library/jest-dom/vitest';
import './polyfills';

process.env.VITE_API_URL ||= 'http://127.0.0.1:3000';

// Stub fetch (typed)
vi.stubGlobal(
    'fetch',
    vi.fn(async (_input?: RequestInfo | URL, _init?: RequestInit) => ({
        ok: true,
        status: 200,
        json: async () => ({} as unknown),
        text: async () => ''
    })) as unknown as typeof fetch
);

// Minimal XHR stub (typed)
class XHRStub {
    open(_method?: string, _url?: string) {}
    send(_body?: Document | XMLHttpRequestBodyInit | null) { /* no-op */ }
    setRequestHeader(_name: string, _value: string) {}
    abort() {}
}
vi.stubGlobal('XMLHttpRequest', XHRStub as unknown as typeof XMLHttpRequest);