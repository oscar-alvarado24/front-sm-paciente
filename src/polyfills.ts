(window as any).global = window;
(window as any).process = {
  env: { DEBUG: undefined },
};

// Buffer polyfill
import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;