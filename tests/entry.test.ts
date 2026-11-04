import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('page entry', () => {
  it('index.html has the title, the root div and the main.tsx module script', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toContain('<title>Sketchroom</title>');
    expect(html).toContain('id="root"');
    expect(html).toContain('/src/main.tsx');
  });

  it('npm start serves on 127.0.0.1 port 4321 with a strict port', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.scripts.start).toContain('127.0.0.1');
    expect(pkg.scripts.start).toContain('4321');
    expect(pkg.scripts.start).toContain('--strictPort');
  });

  it('index.html and the files under src/ have no remote URLs', () => {
    const srcFiles = readdirSync('src', { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => join(entry.parentPath, entry.name));
    for (const file of ['index.html', ...srcFiles]) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/https?:\/\//);
    }
  });
});
