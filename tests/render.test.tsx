import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';
import { type SceneElement, useScene } from '../src/store';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const elements: SceneElement[] = [
  { id: 'r', type: 'rect', x: 10, y: 20, w: 100, h: 50, seed: 11 },
  { id: 'd', type: 'diamond', x: 130, y: 20, w: 100, h: 50, seed: 12 },
  { id: 'e', type: 'ellipse', x: 250, y: 20, w: 100, h: 50, seed: 13 },
  { id: 'a', type: 'arrow', x: 10, y: 100, w: 100, h: 50, points: [[10, 100], [110, 150]], seed: 14 },
  { id: 'l', type: 'line', x: 130, y: 100, w: 100, h: 50, points: [[130, 150], [230, 100]], seed: 15 },
  {
    id: 'p', type: 'polyline', x: 250, y: 100, w: 100, h: 50,
    points: [[250, 100], [300, 150], [350, 100]], seed: 16,
  },
  { id: 't', type: 'text', x: 10, y: 200, w: 60, h: 24, text: 'Hello', seed: 17 },
];
const shapes = elements.filter((el) => el.type !== 'text');

const mounted: { root: Root; container: HTMLElement }[] = [];

function renderApp(): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(<App />));
  mounted.push({ root, container });
  return container;
}

function pathsOf(container: HTMLElement, id: string): (string | null)[] {
  return [...container.querySelectorAll(`svg[data-testid="board"] [data-id="${id}"] path`)].map(
    (path) => path.getAttribute('d'),
  );
}

beforeEach(() => {
  useScene.setState({ ...useScene.getInitialState(), elements }, true);
});

afterEach(() => {
  for (const { root, container } of mounted.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

describe('board rendering', () => {
  it.each(shapes)('draws a $type as SVG paths', (el) => {
    const paths = pathsOf(renderApp(), el.id);
    expect(paths.length).toBeGreaterThan(0);
    for (const d of paths) {
      expect(d).toMatch(/^M/);
    }
  });

  it('draws text as SVG text', () => {
    const text = renderApp().querySelector('svg[data-testid="board"] [data-id="t"] text');
    expect(text?.textContent).toBe('Hello');
  });

  it.each(shapes)('draws the same $type with the same path twice', (el) => {
    const first = pathsOf(renderApp(), el.id);
    const second = pathsOf(renderApp(), el.id);
    expect(first.length).toBeGreaterThan(0);
    expect(second).toEqual(first);
  });

  it.each(shapes)('uses the seed: the same $type with another seed gets another path', (el) => {
    const container = renderApp();
    const first = pathsOf(container, el.id);
    act(() => useScene.setState({ elements: [{ ...el, seed: el.seed + 1000 }] }));
    const second = pathsOf(container, el.id);
    expect(second.length).toBeGreaterThan(0);
    expect(second).not.toEqual(first);
  });

  it('uses no canvas anywhere', () => {
    renderApp();
    expect(document.querySelectorAll('svg[data-testid="board"] [data-id]')).toHaveLength(7);
    expect(document.querySelectorAll('canvas')).toHaveLength(0);
  });
});
