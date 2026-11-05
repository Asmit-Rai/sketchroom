import { existsSync, readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';
import { parseScene, SCENE_KEY } from '../src/persist';
import { useScene } from '../src/store';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const FILE = 'docs/sketchroom-project.json';

// the file's text, after checking it is there
function fileText(): string {
  expect(existsSync(FILE), `${FILE} exists`).toBe(true);
  return readFileSync(FILE, 'utf8');
}

describe('the project drawing file', () => {
  it('is a Sketchroom board with a unique id and a whole-number seed of 1 or more on every element', () => {
    const elements = parseScene(fileText());
    expect(elements, 'parseScene reads it as a board').not.toBeNull();
    expect(elements!.length).toBeGreaterThan(0);
    const ids = elements!.map((el) => el.id);
    for (const id of ids) expect(id.length, 'id is not empty').toBeGreaterThan(0);
    expect(new Set(ids).size, 'ids are unique').toBe(ids.length);
    for (const el of elements!) {
      expect(Number.isInteger(el.seed), `${el.id} seed is a whole number`).toBe(true);
      expect(el.seed, `${el.id} seed`).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('Import JSON of the project file in the app', () => {
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

  it('puts one shape per element on the board, hides the empty hint, and autosaves them all', async () => {
    const text = fileText();
    const elements: { id: string; type: string }[] = JSON.parse(text).elements;
    expect(container.querySelector('[data-testid="empty-hint"]'), 'empty hint before').not.toBeNull();

    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [new File([text], 'sketchroom-project.json', { type: 'application/json' })],
    });
    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const board = container.querySelector('svg[data-testid="board"]')!;
    expect(board.querySelectorAll('g[data-type]')).toHaveLength(elements.length);
    for (const { id, type } of elements) {
      expect(board.querySelectorAll(`g[data-id="${id}"][data-type="${type}"]`), id).toHaveLength(1);
    }
    expect(container.querySelector('[data-testid="empty-hint"]'), 'empty hint after').toBeNull();

    // autosave writes 300 ms after the last change
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    const saved = localStorage.getItem(SCENE_KEY);
    expect(saved, 'saved board').not.toBeNull();
    expect(JSON.parse(saved!).elements).toHaveLength(elements.length);
  });
});
