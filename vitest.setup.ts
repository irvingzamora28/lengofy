import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock the route function
global.route = vi.fn((name: string, params?: any) => {
  return `/api/${name}`;
});

// Add types for global route function
declare global {
  function route(name: string, params?: any): string;
}
