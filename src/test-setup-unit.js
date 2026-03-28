/**
 * Vitest unit test setup for jsdom environment.
 * Provides browser API stubs that jsdom does not implement.
 */

// matchMedia is not implemented in jsdom but used at module-level in theme.js
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });
}
