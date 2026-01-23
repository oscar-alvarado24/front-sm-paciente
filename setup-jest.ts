// setup-jest.ts
import 'jest-preset-angular/setup-jest';
import { TextEncoder, TextDecoder } from 'node:util';
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

// Configurar Zone.js para testing
setupZoneTestEnv();

// Polyfills para Node.js en entorno de navegador
Object.assign(globalThis, {
  TextDecoder,
  TextEncoder,
  URL: globalThis.window === undefined ? URL : globalThis.window.URL,
  URLSearchParams: globalThis.window === undefined ? URLSearchParams : globalThis.window.URLSearchParams
});

// Mock para matchMedia
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock para CSS
Object.defineProperty(globalThis, 'CSS', {
  value: {
    supports: () => false,
    escape: (ident: string) => ident,
  }
});

// Mock para getComputedStyle
Object.defineProperty(globalThis, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (prop: string) => '',
    display: 'none',
    appearance: ['-webkit-appearance']
  })
});

// Mock para ResizeObserver
globalThis.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock para IntersectionObserver
globalThis.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(),
}));

// Mock para MutationObserver
globalThis.MutationObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(),
}));

// Suprimir warnings específicos
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args: any[]) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    // Ignorar warnings específicos
    if (
      message.includes('Material') ||
      message.includes('Angular') ||
      message.includes('JIT compilation')
    ) {
      return;
    }
    originalWarn(...args);
  };

  console.error = (...args: any[]) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    // Ignorar errores específicos
    if (
      message.includes('Not implemented') ||
      message.includes('Could not parse CSS') ||
      message.includes('NG0504') ||
      message.includes('NG0908')
    ) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Limpiar mocks después de cada test
afterEach(() => {
  jest.clearAllMocks();
});