import { vi } from "vitest";

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem(key: string) {
    return this.store[key] || null;
  },
  setItem(key: string, value: string) {
    this.store[key] = value;
  },
  removeItem(key: string) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
  get length() {
    return Object.keys(this.store).length;
  },
  key(index: number) {
    return Object.keys(this.store)[index] || null;
  }
};

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true
});

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
};

Object.defineProperty(global, "navigator", {
  value: { geolocation: mockGeolocation },
  writable: true
});

// Mock window for web panel tests
Object.defineProperty(global, "window", {
  value: {
    ...global,
    userLocation: null,
    speechSynthesis: {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn(() => [])
    },
    ethereum: undefined
  },
  writable: true
});

// Mock fetch
global.fetch = vi.fn();