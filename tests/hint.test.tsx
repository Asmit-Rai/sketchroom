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
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<App />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function hint() {
  return container.querySelector('[data-testid="empty-hint"]');
}

describe('empty-state hint', () => {
  it('shows on an empty board, outside the SVG', () => {
    expect(hint()).not.toBeNull();
    expect(hint()?.textContent).not.toBe('');
    expect(hint()?.closest('svg')).toBeNull();
    expect(container.querySelector('svg[data-testid="board"]')?.children).toHaveLength(0);
  });

  it('is gone after the first shape', () => {
    expect(hint()).not.toBeNull();
    act(() => {
      useScene.getState().addElement({ type: 'rect', x: 10, y: 20, w: 100, h: 50 });
    });
    expect(hint()).toBeNull();
  });
});
