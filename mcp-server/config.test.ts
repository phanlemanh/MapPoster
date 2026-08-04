import { describe, it, expect } from 'vitest';
import { envNumber, loadServerConfig, DEFAULT_MAX_BODY_BYTES, DEFAULT_POOL_ACQUIRE_TIMEOUT_MS } from './config';

describe('envNumber', () => {
  const env = (v?: string) => ({ X: v }) as unknown as NodeJS.ProcessEnv;

  it('falls back when the variable is unset or empty', () => {
    expect(envNumber({} as NodeJS.ProcessEnv, 'X', 7)).toBe(7);
    expect(envNumber(env(''), 'X', 7)).toBe(7);
  });

  it('refuses a non-numeric value instead of yielding NaN', () => {
    // `Number('yes')` is NaN, and every `size > NaN` comparison is false — so the
    // request-body cap, the pool size and the cache bound all fail OPEN, silently.
    expect(() => envNumber(env('yes'), 'X', 7)).toThrow(/not a valid integer/);
    expect(() => envNumber(env('8mb'), 'X', 7)).toThrow(/X="8mb"/);
  });

  it('refuses values outside the declared range', () => {
    expect(() => envNumber(env('0'), 'X', 7, { min: 1 })).toThrow(/\[1, /);
    expect(() => envNumber(env('99'), 'X', 7, { max: 10 })).toThrow(/, 10\]/);
    expect(() => envNumber(env('1.5'), 'X', 7)).toThrow(/not a valid integer/);
  });

  it('accepts a value inside the range', () => {
    expect(envNumber(env('12'), 'X', 7, { min: 1, max: 64 })).toBe(12);
  });
});

describe('loadServerConfig', () => {
  it('defaults to a loopback app host and the 8 MiB body cap', () => {
    const c = loadServerConfig({} as NodeJS.ProcessEnv);
    expect(c.appHost).toBe('127.0.0.1');
    expect(c.maxBodyBytes).toBe(DEFAULT_MAX_BODY_BYTES);
    expect(c.poolSize).toBe(2);
  });

  it('allows port 0 (ephemeral) but refuses a garbage pool size', () => {
    expect(loadServerConfig({ MAPPOSTER_APP_PORT: '0' } as NodeJS.ProcessEnv).appPort).toBe(0);
    // poolSize NaN makes `created < size` always false: the pool never mints a
    // page and every render deadlocks. Fail at startup instead.
    expect(() => loadServerConfig({ MAPPOSTER_POOL: 'two' } as NodeJS.ProcessEnv)).toThrow(/MAPPOSTER_POOL/);
    expect(() => loadServerConfig({ MAPPOSTER_HTTP_MAX_BODY: 'lots' } as NodeJS.ProcessEnv)).toThrow(/MAPPOSTER_HTTP_MAX_BODY/);
  });

  it('defaults the pool-acquire timeout and refuses a garbage override', () => {
    expect(loadServerConfig({} as NodeJS.ProcessEnv).poolAcquireTimeoutMs).toBe(DEFAULT_POOL_ACQUIRE_TIMEOUT_MS);
    expect(loadServerConfig({ MAPPOSTER_POOL_ACQUIRE_TIMEOUT_MS: '5000' } as NodeJS.ProcessEnv).poolAcquireTimeoutMs).toBe(5000);
    expect(() => loadServerConfig({ MAPPOSTER_POOL_ACQUIRE_TIMEOUT_MS: 'forever' } as NodeJS.ProcessEnv)).toThrow(
      /MAPPOSTER_POOL_ACQUIRE_TIMEOUT_MS/,
    );
  });
});
