// matchMedia stub (typed)
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    })
  });
}

// ResizeObserver stub (typed, no "as any")
if (!('ResizeObserver' in window)) {
  class ResizeObserver {
    observe(_target: Element) {}
    unobserve(_target: Element) {}
    disconnect() {}
  }
  // type-augment and assign safely
  (window as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = ResizeObserver;
}