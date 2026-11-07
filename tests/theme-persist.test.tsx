import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';
import { useScene } from '../src/store';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const THEME_KEY = 'sketchroom:theme:v1';

let root: Root | null;
let container: HTMLElement;

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  useScene.setState(useScene.getInitialState(), true);
  root = null;
});

afterEach(() => {
  if (root) act(() => root!.unmount());
  container?.remove();
});

function render() {
  if (root) act(() => root!.unmount());
  container?.remove();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root!.render(<App />));
}

function darkButton() {
  const button = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Dark mode');
  expect(button, 'Dark mode button').toBeDefined();
  return button!;
}

function theme() {
  return document.documentElement.getAttribute('data-theme');
}

describe('the saved theme', () => {
  it('is saved as "dark" or "light" on each click', () => {
    render();
    act(() => darkButton().click());
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    act(() => darkButton().click());
    expect(localStorage.getItem(THEME_KEY)).toBe('light');
  });

  it('a fresh render with "dark" saved starts in dark mode with the button pressed', () => {
    localStorage.setItem(THEME_KEY, 'dark');
    render();
    expect(theme()).toBe('dark');
    expect(darkButton().getAttribute('aria-pressed')).toBe('true');
  });

  it('a choice made in one render is there in the next', () => {
    render();
    act(() => darkButton().click());
    document.documentElement.removeAttribute('data-theme');
    render();
    expect(theme()).toBe('dark');
    expect(darkButton().getAttribute('aria-pressed')).toBe('true');
  });

  it('starts light when nothing is saved', () => {
    render();
    expect(theme()).toBe('light');
    expect(darkButton().getAttribute('aria-pressed')).toBe('false');
  });

  it('starts light, without crashing, when an unknown value is saved', () => {
    localStorage.setItem(THEME_KEY, 'purple');
    render();
    expect(theme()).toBe('light');
    expect(darkButton().getAttribute('aria-pressed')).toBe('false');
  });
});
