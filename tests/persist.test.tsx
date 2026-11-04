import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { useScene } from '../src/store';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const KEY = 'sketchroom:scene:v1';
const rect = { type: 'rect' as const, x: 10, y: 20, w: 100, h: 50 };

let root: Root | null = null;
let container: HTMLElement;

function renderApp() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root!.render(<App />));
}

function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function saved() {
  const raw = localStorage.getItem(KEY);
  return raw === null ? null : JSON.parse(raw);
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  useScene.setState(useScene.getInitialState(), true);
});

afterEach(() => {
  if (root) act(() => root!.unmount());
  root = null;
  container?.remove();
  vi.useRealTimers();
});

describe('autosave', () => {
  it('writes the scene to sketchroom:scene:v1 300 ms after a change, not before', () => {
    renderApp();
    act(() => {
      useScene.getState().addElement(rect);
    });
    wait(299);
    expect(localStorage.getItem(KEY)).toBeNull();
    wait(1);
    expect(saved()).toEqual({ elements: useScene.getState().elements });
  });

  it('waits for 300 ms after the last change', () => {
    renderApp();
    act(() => {
      useScene.getState().addElement(rect);
    });
    wait(200);
    act(() => {
      useScene.getState().addElement({ ...rect, type: 'ellipse' });
    });
    wait(200);
    expect(localStorage.getItem(KEY)).toBeNull();
    wait(100);
    expect(saved().elements.map((el: { type: string }) => el.type)).toEqual(['rect', 'ellipse']);
  });

  it('saves undo too', () => {
    renderApp();
    act(() => {
      useScene.getState().addElement(rect);
    });
    wait(300);
    act(() => useScene.getState().undo());
    wait(300);
    expect(saved()).toEqual({ elements: [] });
  });

  it('leaves document.cookie empty', () => {
    renderApp();
    act(() => {
      useScene.getState().addElement(rect);
    });
    wait(300);
    expect(saved()).not.toBeNull();
    expect(document.cookie).toBe('');
  });
});

describe('restore on load', () => {
  const stored = [
    { id: 'a', type: 'rect', x: 10, y: 20, w: 100, h: 50, seed: 7 },
    { id: 'b', type: 'line', x: 0, y: 0, w: 30, h: 40, points: [[0, 0], [30, 40]], seed: 8 },
    { id: 'c', type: 'text', x: 5, y: 5, w: 60, h: 24, text: 'Hi', seed: 9 },
  ];

  it('reads sketchroom:scene:v1 and shows the saved shapes', () => {
    localStorage.setItem(KEY, JSON.stringify({ elements: stored }));
    renderApp();
    expect(useScene.getState().elements).toEqual(stored);
    const shown = [...container.querySelectorAll('svg[data-testid="board"] [data-id]')];
    expect(shown.map((g) => g.getAttribute('data-id'))).toEqual(['a', 'b', 'c']);
    expect(container.querySelector('[data-testid="empty-hint"]')).toBeNull();
  });

  it('the restored board is not an undo step', () => {
    localStorage.setItem(KEY, JSON.stringify({ elements: stored }));
    renderApp();
    act(() => useScene.getState().undo());
    expect(useScene.getState().elements).toEqual(stored);
  });

  it('starts an empty board when nothing is saved', () => {
    renderApp();
    expect(useScene.getState().elements).toEqual([]);
    expect(container.querySelector('[data-testid="empty-hint"]')).not.toBeNull();
  });
});

describe('corrupt saved data', () => {
  const BACKUP = 'sketchroom:scene:backup';
  const good = { id: 'a', type: 'rect', x: 10, y: 20, w: 100, h: 50, seed: 7 };

  function notice() {
    return container.querySelector('[data-testid="notice"]');
  }

  it.each([
    ['bad JSON', '{"elements": [ {"id": "a",'],
    ['not an object', '"hello"'],
    ['null', 'null'],
    ['an array instead of the scene', JSON.stringify([good])],
    ['elements is not a list', JSON.stringify({ elements: 5 })],
    ['an unknown type', JSON.stringify({ elements: [{ ...good, type: 'star' }] })],
    ['a missing field', JSON.stringify({ elements: [{ ...good, seed: undefined }] })],
    ['a number stored as text', JSON.stringify({ elements: [{ ...good, x: '10' }] })],
    ['a line without points', JSON.stringify({ elements: [{ ...good, type: 'line' }] })],
    ['a bad point', JSON.stringify({ elements: [{ ...good, type: 'arrow', points: [[0, 0], [1]] }] })],
  ])('%s: the raw text goes to the backup key, an empty board starts, a notice shows', (_name, raw) => {
    localStorage.setItem(KEY, raw);
    useScene.getState().addElement(rect);
    expect(() => renderApp()).not.toThrow();
    expect(localStorage.getItem(BACKUP)).toBe(raw);
    expect(useScene.getState().elements).toEqual([]);
    expect(container.querySelectorAll('svg[data-testid="board"] [data-id]')).toHaveLength(0);
    expect(notice()?.textContent).toMatch(/could not be read/);
  });

  it('shows no notice and writes no backup for good saved data', () => {
    localStorage.setItem(KEY, JSON.stringify({ elements: [good] }));
    renderApp();
    expect(notice()).toBeNull();
    expect(localStorage.getItem(BACKUP)).toBeNull();
  });

  it('drawing still works after a corrupt load', () => {
    localStorage.setItem(KEY, 'garbage');
    renderApp();
    act(() => {
      useScene.getState().addElement(rect);
    });
    wait(300);
    expect(saved().elements).toHaveLength(1);
    expect(localStorage.getItem(BACKUP)).toBe('garbage');
  });
});
