import '@testing-library/jest-dom'

process.env.VITE_API_URL ||= 'http://localhost:3000';

// Polyfill matchMedia for AntD’s responsive hooks
if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),            // deprecated
            removeListener: jest.fn(),         // deprecated
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }),
    });
}

// (Optional) Some AntD components use ResizeObserver
if (!(window as any).ResizeObserver) {
    class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
    (window as any).ResizeObserver = ResizeObserver;
}