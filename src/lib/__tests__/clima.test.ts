import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetClimaCache, estaChovendo } from '../clima';

describe('estaChovendo', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    __resetClimaCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retorna true quando o código WMO indica chuva', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ current_weather: { weathercode: 61 } }),
    });
    expect(await estaChovendo()).toBe(true);
  });

  it('retorna false quando o código WMO não indica chuva', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ current_weather: { weathercode: 0 } }),
    });
    expect(await estaChovendo()).toBe(false);
  });

  it('retorna false sem quebrar quando a API falha (sem rede ou fora do ar)', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('sem rede'));
    expect(await estaChovendo()).toBe(false);
  });
});
