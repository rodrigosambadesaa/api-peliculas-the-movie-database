import { describe, expect, it } from 'vitest';
import { formatRuntime, imageUrl, yearOf } from './api';

describe('utilidades de presentación', () => {
  it('construye URLs de imagen de TMDB', () => {
    expect(imageUrl('/poster.jpg')).toBe('https://image.tmdb.org/t/p/w500/poster.jpg');
    expect(imageUrl(null)).toBeNull();
  });

  it('formatea año y duración', () => {
    expect(yearOf('2014-11-07')).toBe('2014');
    expect(yearOf('')).toBe('—');
    expect(formatRuntime(169)).toBe('2 h 49 min');
  });
});
