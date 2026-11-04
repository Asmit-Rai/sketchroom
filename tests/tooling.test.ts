import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('tooling', () => {
  it('package.json sets engines.node to >=20', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.engines?.node).toBe('>=20');
  });

  it('.gitignore lists node_modules and dist', () => {
    const lines = readFileSync('.gitignore', 'utf8')
      .split('\n')
      .map((line) => line.trim());
    expect(lines).toContain('node_modules');
    expect(lines).toContain('dist');
  });
});
