import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { type SceneElement, useScene } from '../src/store';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const elements: SceneElement[] = [
  { id: 'r', type: 'rect', x: 10, y: 20, w: 100, h: 50, seed: 11 },
  { id: 'd', type: 'diamond', x: 130, y: 20, w: 100, h: 50, seed: 12 },
  { id: 'e', type: 'ellipse', x: 250.5, y: 20.25, w: 100, h: 50, seed: 13 },
  { id: 'a', type: 'arrow', x: 10, y: 100, w: 100, h: 50, points: [[10, 100], [110, 150]], seed: 14 },
  { id: 'l', type: 'line', x: 130, y: 100, w: 100, h: 50, points: [[130, 150], [230, 100]], seed: 15 },
  {
    id: 'p', type: 'polyline', x: 250, y: 100, w: 100, h: 50,
    points: [[250, 100], [300, 150], [350, 100]], seed: 16,
  },
  { id: 't', type: 'text', x: 10, y: 200, w: 60, h: 24, text: 'Hello "board" <b>', seed: 17 },
];

let root: Root;
let container: HTMLElement;
let blobs: Blob[];

// jsdom has no object URLs and no downloads, so the download link is caught here
beforeAll(() => {
  URL.createObjectURL = (blob: Blob) => {
    blobs.push(blob);
    return `blob:test/${blobs.length}`;
  };
  URL.revokeObjectURL = () => {};
});

beforeEach(() => {
  blobs = [];
  localStorage.clear();
  useScene.setState({ ...useScene.getInitialState(), elements }, true);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<App />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

function clickButton(label: string) {
  const button = [...container.querySelectorAll('button')].find((b) => b.textContent === label);
  expect(button, `button ${label}`).toBeDefined();
  act(() => button!.click());
}

function fileInput(): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  expect(input, 'file input').not.toBeNull();
  return input!;
}

async function importFile(text: string) {
  const input = fileInput();
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: [new File([text], 'board.json', { type: 'application/json' })],
  });
  await act(async () => {
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function exportJson(): Promise<{ text: string; name: string }> {
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  clickButton('Export JSON');
  expect(click).toHaveBeenCalledTimes(1);
  const link = click.mock.contexts[0] as HTMLAnchorElement;
  expect(blobs).toHaveLength(1);
  expect(link.href).toBe('blob:test/1');
  return { text: await blobs[0].text(), name: link.download };
}

describe('export and import JSON', () => {
  it('Export JSON downloads a .json file with the elements', async () => {
    const { text, name } = await exportJson();
    expect(name).toMatch(/\.json$/);
    expect(JSON.parse(text).elements).toStrictEqual(elements);
  });

  it('export then import gives identical elements', async () => {
    const { text } = await exportJson();
    act(() => useScene.setState({ ...useScene.getInitialState() }, true));
    expect(useScene.getState().elements).toEqual([]);

    await importFile(text);
    expect(useScene.getState().elements).toStrictEqual(elements);
    expect(container.querySelectorAll('svg[data-testid="board"] [data-id]')).toHaveLength(7);
  });

  it('Import JSON opens the file picker', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    clickButton('Import JSON');
    expect(click).toHaveBeenCalledTimes(1);
    expect(click.mock.contexts[0]).toBe(fileInput());
  });

  it('an import is one undo step', async () => {
    const { text } = await exportJson();
    act(() => useScene.setState({ ...useScene.getInitialState() }, true));
    act(() => {
      useScene.getState().addElement({ type: 'rect', x: 1, y: 2, w: 3, h: 4 });
    });
    const before = structuredClone(useScene.getState().elements);
    await importFile(text);
    act(() => useScene.getState().undo());
    expect(useScene.getState().elements).toStrictEqual(before);
  });

  it('a file that is not a board shows a notice and leaves the board as it was', async () => {
    await importFile('{"elements": "nope"}');
    expect(useScene.getState().elements).toStrictEqual(elements);
    expect(container.querySelector('[data-testid="notice"]')?.textContent).toMatch(
      /not a Sketchroom board/,
    );
  });
});
