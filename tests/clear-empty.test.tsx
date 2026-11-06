import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';
import { useScene } from '../src/store';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

beforeEach(() => {
  localStorage.clear();
  useScene.setState(useScene.getInitialState(), true);
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

describe('Clear on an empty board', () => {
  it('changes nothing and adds no undo step, so Undo still undoes the change before it', () => {
    let id = '';
    act(() => {
      id = useScene.getState().addElement({ type: 'rect', x: 10, y: 20, w: 100, h: 50 });
    });
    const drawn = useScene.getState().elements;
    act(() => useScene.getState().deleteElement(id));
    const { elements, past, future } = useScene.getState();
    expect(elements).toEqual([]);

    clickButton('Clear');
    expect(useScene.getState().elements).toBe(elements);
    expect(useScene.getState().past).toBe(past);
    expect(useScene.getState().future).toBe(future);

    clickButton('Undo');
    expect(useScene.getState().elements).toEqual(drawn);
  });
});
