import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Existing tests were written against Jest globals before the project moved
// from react-scripts to Vite. Keep them compatible while using Vitest.
globalThis.jest = vi;

afterEach(() => {
  cleanup();
});
