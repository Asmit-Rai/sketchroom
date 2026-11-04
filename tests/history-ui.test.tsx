import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';
import { useScene } from '../src/store';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

beforeEach(() => {
  useScene.setState(useScene.getInitialState(), true);
  useScene.getState().addElement({ type: 'rect', x: 10, y: 20, w: 100, h: 50 });
  useScene.getState().addElement({ type: 'ellipse', x: 200, y: 20, w: 100, h: 50 });
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
  return container.querySelectorAll('svg[data-testid="board"] [data-id]').length;
}

describe('undo and redo in the page', () => {
  it('the Undo and Redo buttons undo and redo the last change', () => {
    clickButton('Undo');
    expect(useScene.getState().elements.map((el) => el.type)).toEqual(['rect']);
    expect(shapesOnBoard()).toBe(1);
    clickButton('Redo');
    expect(useScene.getState().elements.map((el) => el.type)).toEqual(['rect', 'ellipse']);
    expect(shapesOnBoard()).toBe(2);
  });

  it('Ctrl+Z undoes and Ctrl+Shift+Z redoes', () => {
    press({ key: 'z', ctrlKey: true });
    expect(useScene.getState().elements.map((el) => el.type)).toEqual(['rect']);
    press({ key: 'z', ctrlKey: true });
    expect(useScene.getState().elements).toHaveLength(0);
    press({ key: 'Z', ctrlKey: true, shiftKey: true });
    expect(useScene.getState().elements.map((el) => el.type)).toEqual(['rect']);
    press({ key: 'Z', ctrlKey: true, shiftKey: true });
    expect(useScene.getState().elements.map((el) => el.type)).toEqual(['rect', 'ellipse']);
  });

  it('Cmd+Z and Cmd+Shift+Z work the same on a Mac', () => {
    press({ key: 'z', metaKey: true });
    expect(useScene.getState().elements).toHaveLength(1);
    press({ key: 'Z', metaKey: true, shiftKey: true });
    expect(useScene.getState().elements).toHaveLength(2);
  });

  it('Z without Ctrl changes nothing', () => {
    press({ key: 'z' });
    expect(useScene.getState().elements).toHaveLength(2);
  });
});
