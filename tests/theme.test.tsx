import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';
import { SCENE_KEY } from '../src/persist';
import { useScene } from '../src/store';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
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

function labels() {
  return [...container.querySelectorAll('button')].map((b) => b.textContent);
}

function darkButton() {
  const button = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Dark mode');
  expect(button, 'Dark mode button').toBeDefined();
  return button!;
}

describe('the Dark mode button', () => {
  it('sits at the end of the history and file row, and every other button keeps its name and order', () => {
    const undo = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Undo');
    const row = [...undo!.parentElement!.querySelectorAll('button')].map((b) => b.textContent);
    expect(row).toEqual([
      'Undo',
      'Redo',
      'Clear',
      'Export JSON',
      'Import JSON',
      'Export PNG',
      'Dark mode',
    ]);
    expect(labels().filter((label) => label !== 'Dark mode')).toEqual([
      'Undo',
      'Redo',
      'Clear',
      'Export JSON',
      'Import JSON',
      'Export PNG',
      'Select',
      'Rectangle',
      'Diamond',
      'Ellipse',
      'Arrow',
      'Line',
      'Freehand',
      'Text',
    ]);
  });

  it('one click turns dark mode on, a second click turns it off', () => {
    const button = darkButton();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    act(() => button.click());
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    act(() => button.click());
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('changes no shape, adds no undo step and leaves the saved board as it was', async () => {
    act(() => {
      useScene.getState().addElement({ type: 'rect', x: 10, y: 20, w: 100, h: 50 });
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    const saved = localStorage.getItem(SCENE_KEY);
    expect(saved, 'saved board').not.toBeNull();
    const { elements, past, future } = useScene.getState();

    act(() => darkButton().click());
    act(() => darkButton().click());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    expect(useScene.getState().elements).toBe(elements);
    expect(useScene.getState().past).toBe(past);
    expect(useScene.getState().future).toBe(future);
    expect(localStorage.getItem(SCENE_KEY)).toBe(saved);
  });
});
