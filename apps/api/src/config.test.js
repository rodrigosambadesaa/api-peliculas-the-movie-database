const { loadConfig, DEVELOPMENT_JWT_SECRET } = require('./config');

describe('runtime configuration', () => {
  it('rejects weak JWT secrets in production', () => {
    expect(() =>
      loadConfig({
        NODE_ENV: 'production',
        JWT_SECRET: 'too-short',
        WEB_ORIGIN: 'https://cinewave.example',
      }),
    ).toThrow(/JWT_SECRET/);
  });

  it('normalizes allowed origins and proxy hop count', () => {
    const loaded = loadConfig({
      NODE_ENV: 'production',
      JWT_SECRET: 'x'.repeat(32),
      WEB_ORIGIN: 'https://cinewave.example/, http://localhost:5173',
      TRUST_PROXY: '1',
      COOKIE_SECURE: 'true',
    });

    expect(loaded.webOrigins).toEqual([
      'https://cinewave.example',
      'http://localhost:5173',
    ]);
    expect(loaded.trustProxy).toBe(1);
    expect(loaded.cookieSecure).toBe(true);
  });

  it('keeps the local development secret outside production', () => {
    const loaded = loadConfig({ NODE_ENV: 'development' });
    expect(loaded.jwtSecret).toBe(DEVELOPMENT_JWT_SECRET);
  });

  it('rejects malformed ports and boolean values', () => {
    expect(() => loadConfig({ PORT: '70000' })).toThrow(/PORT/);
    expect(() => loadConfig({ COOKIE_SECURE: 'yes' })).toThrow(/boolean/);
  });
});
