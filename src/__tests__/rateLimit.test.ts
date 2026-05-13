import { describe, it, expect, beforeEach, vi } from 'vitest';

// We need to reload the module to reset its Map state between tests
// Vitest supports dynamic import for module isolation

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  it('allows requests under the limit', async () => {
    const { checkRateLimit } = await import('../lib/rateLimit');
    const result = checkRateLimit('test-key', { windowMs: 60_000, max: 3 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('blocks after hitting max', async () => {
    const { checkRateLimit } = await import('../lib/rateLimit');
    checkRateLimit('block-key', { windowMs: 60_000, max: 2 });
    checkRateLimit('block-key', { windowMs: 60_000, max: 2 });
    const result = checkRateLimit('block-key', { windowMs: 60_000, max: 2 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after window expires', async () => {
    const { checkRateLimit } = await import('../lib/rateLimit');
    checkRateLimit('reset-key', { windowMs: 1_000, max: 1 });
    checkRateLimit('reset-key', { windowMs: 1_000, max: 1 }); // should block

    vi.advanceTimersByTime(2_000); // past window

    const result = checkRateLimit('reset-key', { windowMs: 1_000, max: 1 });
    expect(result.allowed).toBe(true);
  });
});
