import { readFileSync } from 'node:fs';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import App from '../src/App';
import { useScene } from '../src/store';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('handwriting font', () => {
  it('main.tsx imports the bundled @fontsource/caveat font', () => {
    expect(readFileSync('src/main.tsx', 'utf8')).toMatch(/^import '@fontsource\/caveat';$/m);
  });

  it('the font package points only at its own bundled files', () => {
    const css = readFileSync('node_modules/@fontsource/caveat/index.css', 'utf8');
    expect(css).toMatch(/font-family: 'Caveat'/);
    expect(css).toMatch(/url\(\.\/files\//);
    expect(css).not.toMatch(/https?:|url\(\/\//);
  });

  it('text on the board is drawn in Caveat', () => {
    useScene.setState({
      ...useScene.getInitialState(),
      elements: [{ id: 't', type: 'text', x: 10, y: 20, w: 60, h: 24, text: 'Hi', seed: 1 }],
    });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(createElement(App)));
    const text = container.querySelector('svg[data-testid="board"] text');
    expect(text?.getAttribute('font-family')).toMatch(/^Caveat\b/);
    act(() => root.unmount());
    container.remove();
  });

  it('index.html loads nothing from another host', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).not.toMatch(/https?:/);
    expect(html).not.toMatch(/(src|href)=["']\/\//);
  });
});
