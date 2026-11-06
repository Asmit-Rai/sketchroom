import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';
import { SCENE_KEY } from '../src/persist';
import { type SceneElement, useScene } from '../src/store';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;
let before: SceneElement[];

beforeEach(() => {
  localStorage.clear();
  useScene.setState(useScene.getInitialState(), true);
  useScene.getState().addElement({ type: 'rect', x: 10, y: 20, w: 100, h: 50 });
  useScene.getState().addElement({ type: 'arrow', x: 10, y: 100, w: 100, h: 50, points: [[10, 100], [110, 150]] });
  useScene.getState().addElement({ type: 'text', x: 200, y: 20, w: 60, h: 24, text: 'Hello' });
  before = useScene.getState().elements;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<App />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function clickButton(label: string) {
  const button = [...container.querySelectorAll('button')].find((b) => b.textContent === label);
  expect(button, `button ${label}`).toBeDefined();
  act(() => button!.click());
}

function press(init: KeyboardEventInit) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
  });
}

function shapesOnBoard() {
  return container.querySelectorAll('svg[data-testid="board"] g[data-type]').length;
}

function hint() {
  return container.querySelector('[data-testid="empty-hint"]');
}

describe('the Clear button', () => {
  it('sits straight after the Redo button', () => {
    const labels = [...container.querySelectorAll('button')].map((b) => b.textContent);
    expect(labels).toContain('Clear');
    expect(labels[labels.indexOf('Redo') + 1]).toBe('Clear');
  });

  it('removes every shape from the store and the board', () => {
    expect(shapesOnBoard()).toBe(3);
    clickButton('Clear');
    expect(useScene.getState().elements).toEqual([]);
    expect(shapesOnBoard()).toBe(0);
  });

  it('one Undo button click brings every shape back as it was, and Redo clears again', () => {
    clickButton('Clear');
    clickButton('Undo');
    expect(useScene.getState().elements).toEqual(before);
    expect(shapesOnBoard()).toBe(3);
    clickButton('Redo');
    expect(useScene.getState().elements).toEqual([]);
    expect(shapesOnBoard()).toBe(0);
  });

  it('one Ctrl+Z brings every shape back as it was', () => {
    clickButton('Clear');
    press({ key: 'z', ctrlKey: true });
    expect(useScene.getState().elements).toEqual(before);
    expect(shapesOnBoard()).toBe(3);
  });

  it('shows the empty hint and autosaves an empty board 300 ms later', async () => {
    expect(hint()).toBeNull();
    clickButton('Clear');
    expect(hint()).not.toBeNull();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    const saved = localStorage.getItem(SCENE_KEY);
    expect(saved, 'saved board').not.toBeNull();
    expect(JSON.parse(saved!).elements).toEqual([]);
  });
});
