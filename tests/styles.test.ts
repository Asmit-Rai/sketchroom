import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// paths from the project folder, where npm test runs
const read = (path: string) => readFileSync(path, 'utf8');

// every rule as [selector, body], comments removed
function rules(css: string): [string, string][] {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1].trim(), m[2]]);
}

function bodiesFor(css: string, test: (selector: string) => boolean): string {
  return rules(css)
    .filter(([selector]) => test(selector))
    .map(([, body]) => body)
    .join('\n');
}

describe('the stylesheet', () => {
  it('is src/styles.css, imported from main.tsx', () => {
    expect(read('src/main.tsx')).toMatch(/import\s+['"]\.\/styles\.css['"]/);
    expect(read('src/styles.css').length).toBeGreaterThan(0);
  });

  it('loads no stylesheet or font from a remote URL', () => {
    const css = read('src/styles.css');
    expect(css).not.toMatch(/https?:|url\(\s*['"]?\/\//);
    expect(css).not.toMatch(/@import/);
    expect(read('index.html')).not.toMatch(/<link[^>]+https?:|<link[^>]+href=["']\/\//);
  });

  it('leaves the package.json dependencies and devDependencies as they were', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.dependencies).toEqual({
      '@fontsource/caveat': '^5.3.0',
      react: '^18.3.1',
      'react-dom': '^18.3.1',
      roughjs: '^4.6.6',
      zustand: '^5.0.16',
    });
    expect(pkg.devDependencies).toEqual({
      '@eslint/js': '^10.0.1',
      '@playwright/test': '^1.64.1',
      '@types/node': '^20.19.43',
      '@types/react': '^18.3.31',
      '@types/react-dom': '^18.3.7',
      '@vitejs/plugin-react': '^6.2.1',
      eslint: '^10.14.0',
      jsdom: '^27.4.0',
      typescript: '~6.0',
      'typescript-eslint': '^8.72.1',
      vite: '^8.3.5',
      vitest: '^4.1.12',
    });
  });

  it('gives every button rounded corners and the same height', () => {
    const css = read('src/styles.css');
    const button = bodiesFor(css, (s) => /(^|[\s,])button(\s*[,{]|$)/.test(s));
    expect(button).toMatch(/border-radius\s*:\s*[1-9]/);
    expect(button).toMatch(/(?:^|[\s;])height\s*:/);
  });

  it('lays out each row of buttons with even spacing', () => {
    const css = read('src/styles.css');
    const rows = bodiesFor(css, (s) => s.includes('.button-row'));
    expect(rows).toMatch(/display\s*:\s*flex/);
    expect(rows).toMatch(/gap\s*:/);
  });

  it('makes the pressed tool stand out', () => {
    const css = read('src/styles.css');
    expect(bodiesFor(css, (s) => s.includes('aria-pressed') && s.includes('true'))).toMatch(
      /background/,
    );
  });

  it('has a dark palette under data-theme="dark" and keeps the board white', () => {
    const css = read('src/styles.css');
    expect(bodiesFor(css, (s) => /\[data-theme=['"]?dark['"]?\]/.test(s))).toMatch(/--/);
    const board = bodiesFor(css, (s) => s.includes('data-testid') && s.includes('board'));
    expect(board).toMatch(/background(-color)?\s*:\s*(#fff\b|#ffffff\b|white\b)/i);
  });

  it('puts both rows of buttons in .button-row', () => {
    expect(read('src/App.tsx')).toMatch(/className="button-row"/);
    expect(read('src/Board.tsx')).toMatch(/className="button-row"/);
  });
});
