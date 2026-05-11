import { describe, it, expect } from 'vitest';

describe('Initial Test Setup', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle strings', () => {
    const name = 'Eventio';
    expect(name).toBe('Eventio');
  });
});
