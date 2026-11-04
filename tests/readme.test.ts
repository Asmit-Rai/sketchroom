import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('README', () => {
  it('has the install, run, test, lint and typecheck commands', () => {
    const readme = readFileSync('README.md', 'utf8');
    for (const command of ['npm install', 'npm start', 'npm test', 'npm run lint', 'npm run typecheck']) {
      expect(readme, command).toContain(command);
    }
  });
});
