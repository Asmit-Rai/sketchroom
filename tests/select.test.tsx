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
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<App />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function board(): SVGSVGElement {
  return container.querySelector('svg[data-testid="board"]')!;
}

function clickButton(label: string) {
  const button = [...container.querySelectorAll('button')].find((b) => b.textContent === label);
  expect(button, `button ${label}`).toBeDefined();
  act(() => button!.click());
}

// jsdom gives the board a zero bounding box, so client coordinates are board coordinates
function mouse(type: string, x: number, y: number, target: Element = board()) {
  act(() => {
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 }));
  });
}

function drag(points: [number, number][], target: Element = board()) {
  const [first, ...rest] = points;
  mouse('mousedown', ...first, target);
  for (const point of rest) mouse('mousemove', ...point);
  mouse('mouseup', ...points[points.length - 1]);
}

function handles() {
  return [...board().querySelectorAll('[data-handle]')];
}

function rect() {
  return useScene.getState().elements[0];
}

describe('select tool', () => {
  it('a click on a shape selects it and shows 4 corner handles', () => {
    clickButton('Select');
    expect(handles()).toHaveLength(0);
    drag([[50, 40]]);
    expect(handles().map((h) => h.getAttribute('data-handle')).sort()).toEqual(['ne', 'nw', 'se', 'sw']);
  });

  it('a click on an empty part of the board clears the selection', () => {
    clickButton('Select');
    drag([[50, 40]]);
    expect(handles()).toHaveLength(4);
    drag([[400, 400]]);
    expect(handles()).toHaveLength(0);
  });

  it('a drag moves the shape', () => {
    clickButton('Select');
    drag([[50, 40], [60, 45], [80, 60]]);
    expect(rect()).toMatchObject({ x: 40, y: 40, w: 100, h: 50 });
  });

  it('one whole drag is one undo step', () => {
    clickButton('Select');
    drag([[50, 40], [60, 45], [70, 50], [80, 60]]);
    useScene.getState().undo();
    expect(rect()).toMatchObject({ x: 10, y: 20, w: 100, h: 50 });
    useScene.getState().undo();
    expect(useScene.getState().elements).toHaveLength(0);
  });

  it('a click without moving adds no undo step', () => {
    clickButton('Select');
    drag([[50, 40]]);
    expect(useScene.getState().past).toHaveLength(1);
  });
});

describe('resize with a corner handle', () => {
  function handle(name: string): Element {
    const found = board().querySelector(`[data-handle="${name}"]`);
    expect(found, `handle ${name}`).not.toBeNull();
    return found!;
  }

  beforeEach(() => {
    clickButton('Select');
    drag([[50, 40]]);
  });

  it('dragging the bottom-right handle resizes from the top-left corner', () => {
    drag([[110, 70], [130, 90], [160, 100]], handle('se'));
    expect(rect()).toMatchObject({ x: 10, y: 20, w: 150, h: 80 });
  });

  it('dragging the top-left handle resizes from the bottom-right corner', () => {
    drag([[10, 20], [0, 0]], handle('nw'));
    expect(rect()).toMatchObject({ x: 0, y: 0, w: 110, h: 70 });
  });

  it('dragging the top-right handle keeps the bottom-left corner', () => {
    drag([[110, 20], [130, 10]], handle('ne'));
    expect(rect()).toMatchObject({ x: 10, y: 10, w: 120, h: 60 });
  });

  it('dragging the bottom-left handle keeps the top-right corner', () => {
    drag([[10, 70], [30, 90]], handle('sw'));
    expect(rect()).toMatchObject({ x: 30, y: 20, w: 80, h: 70 });
  });

  it('the handles follow the new box, and one resize is one undo step', () => {
    drag([[110, 70], [130, 90], [160, 100]], handle('se'));
    expect(handle('se').getAttribute('x')).toBe(String(160 - 4));
    expect(handle('se').getAttribute('y')).toBe(String(100 - 4));
    expect(handle('nw').getAttribute('x')).toBe(String(10 - 4));
    expect(handle('nw').getAttribute('y')).toBe(String(20 - 4));
    useScene.getState().undo();
    expect(rect()).toMatchObject({ x: 10, y: 20, w: 100, h: 50 });
  });
});

describe('delete the selected shape', () => {
  function press(key: string) {
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    });
  }

  it.each(['Delete', 'Backspace'])('%s deletes the selected shape', (key) => {
    useScene.getState().addElement({ type: 'ellipse', x: 300, y: 300, w: 50, h: 50 });
    clickButton('Select');
    drag([[50, 40]]);
    press(key);
    expect(useScene.getState().elements.map((el) => el.type)).toEqual(['ellipse']);
    expect(handles()).toHaveLength(0);
  });

  it('does nothing when no shape is selected', () => {
    clickButton('Select');
    press('Delete');
    press('Backspace');
    expect(useScene.getState().elements).toHaveLength(1);
  });

  it('the delete is one undo step', () => {
    clickButton('Select');
    drag([[50, 40]]);
    press('Delete');
    useScene.getState().undo();
    expect(rect()).toMatchObject({ x: 10, y: 20, w: 100, h: 50 });
  });
});
