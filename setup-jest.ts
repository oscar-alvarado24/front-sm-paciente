import 'jest-preset-angular/setup-jest';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills para el entorno de pruebas
Object.assign(global, { TextDecoder, TextEncoder });

// Mock de window.matchMedia (común en tests de Material)
Object.defineProperty(window, 'matchMedia', {
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

// Mock de CSS
Object.defineProperty(window, 'CSS', {
  value: null
});

Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    display: 'none',
    appearance: ['-webkit-appearance']
  })
});

// Mock de document.doctype
Object.defineProperty(document, 'doctype', {
  value: '<!DOCTYPE html>'
});

// Mock de transform
Object.defineProperty(document.body.style, 'transform', {
  value: () => ({
    enumerable: true,
    configurable: true
  })
});

// Suprimir warnings específicos de console
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Material')
    ) {
      return;
    }
    originalWarn(...args);
  };

  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
       args[0].includes('Could not parse CSS stylesheet'))
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