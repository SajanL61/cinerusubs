import { describe, expect, it } from 'vitest';
import { assertCineruDatabaseName, DATABASE_NAME } from '../src/lib/db';

describe('MongoDB isolation', () => {
  it('allows only the dedicated CineruSubs database', () => {
    expect(DATABASE_NAME).toBe('cinerusubs');
    expect(() => assertCineruDatabaseName('cinerusubs')).not.toThrow();
    expect(() => assertCineruDatabaseName(undefined)).toThrow('expected database');
    expect(() => assertCineruDatabaseName('test')).toThrow('expected database');
  });

  it('explicitly rejects SmartReact regardless of case', () => {
    expect(() => assertCineruDatabaseName('SmartReact')).toThrow('protected SmartReact database');
    expect(() => assertCineruDatabaseName('smartreact')).toThrow('protected SmartReact database');
  });
});
