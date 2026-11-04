import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('README', () => {
  it('has the install, run, test, lint and typecheck commands', () => {
    const readme = readFileSync('README.md', 'utf8');
    for (const command of ['npm install', 'npm start', 'npm test', 'npm run lint', 'npm run typecheck']) {
      expect(readme, command).toContain(command);
    }
  });

  it('lists every dependency with its licence, and each licence is allowed', () => {
    const lines = readFileSync('README.md', 'utf8').split('\n');
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    const names = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)];
    const allowed = ['MIT', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', 'OFL-1.1'];
    for (const name of names) {
      const { license } = JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8'));
      expect(allowed, name).toContain(license);
      const listed = lines.some((line) => line.includes(`\`${name}\``) && line.includes(license));
      expect(listed, `${name} (${license}) in README`).toBe(true);
    }
  });
});
