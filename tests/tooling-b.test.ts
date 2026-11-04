import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import viteConfig from '../vite.config';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

describe('Part B tooling', () => {
  it('adds roughjs, zustand and @fontsource/caveat, and dev @playwright/test', () => {
    expect(Object.keys(pkg.dependencies)).toEqual(
      expect.arrayContaining(['roughjs', 'zustand', '@fontsource/caveat']),
    );
    expect(Object.keys(pkg.devDependencies)).toContain('@playwright/test');
  });

  it('has a test:e2e script that runs playwright test', () => {
    expect(pkg.scripts['test:e2e']).toBe('playwright test');
  });

  it('npm test stays Vitest only', () => {
    expect(pkg.scripts.test).toBe('vitest run');
  });

  it('playwright.config.ts uses Chromium only and starts npm start on 127.0.0.1:4321', () => {
    expect(existsSync('playwright.config.ts')).toBe(true);
    const config = readFileSync('playwright.config.ts', 'utf8');
    expect(config).toContain("testDir: 'e2e'");
    expect(config).toContain("command: 'npm start'");
    expect(config).toContain('http://127.0.0.1:4321');
    expect(config).toContain('chromium');
    expect(config).not.toMatch(/firefox|webkit/);
  });

  it('Vitest skips the e2e folder', () => {
    expect(viteConfig.test?.exclude).toContain('e2e/**');
  });

  it('tsconfig includes e2e and playwright.config.ts', () => {
    const tsconfig = JSON.parse(readFileSync('tsconfig.json', 'utf8'));
    expect(tsconfig.include).toEqual(expect.arrayContaining(['e2e', 'playwright.config.ts']));
  });

  it('.gitignore lists test-results and playwright-report', () => {
    const lines = readFileSync('.gitignore', 'utf8')
      .split('\n')
      .map((line) => line.trim());
    expect(lines).toContain('test-results');
    expect(lines).toContain('playwright-report');
  });

  it('package.json has no database package', () => {
    const databases = [
      'sqlite3', 'better-sqlite3', 'sql.js', 'pg', 'mysql', 'mysql2', 'mongodb', 'mongoose',
      'redis', 'ioredis', 'prisma', '@prisma/client', 'typeorm', 'sequelize', 'knex',
      'drizzle-orm', 'lowdb', 'nedb', 'level', 'pouchdb', 'dexie', 'idb', 'localforage',
    ];
    const names = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)];
    for (const name of databases) {
      expect(names, name).not.toContain(name);
    }
  });
});
