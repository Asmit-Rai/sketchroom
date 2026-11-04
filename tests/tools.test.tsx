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

function board(): SVGSVGElement {
  return container.querySelector('svg[data-testid="board"]')!;
}

function clickButton(label: string) {
  const button = [...container.querySelectorAll('button')].find((b) => b.textContent === label);
  expect(button, `button ${label}`).toBeDefined();
  act(() => button!.click());
}

// jsdom gives the board a zero bounding box, so client coordinates are board coordinates
function mouse(type: string, x: number, y: number) {
  act(() => {
    board().dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 }));
  });
}

function drag(points: [number, number][]) {
  const [first, ...rest] = points;
  mouse('mousedown', ...first);
  for (const point of rest) mouse('mousemove', ...point);
  mouse('mouseup', ...points[points.length - 1]);
}

describe('drag tools', () => {
  it.each([
    ['Rectangle', 'rect'],
    ['Diamond', 'diamond'],
    ['Ellipse', 'ellipse'],
  ])('%s: a drag adds a %s with the dragged box', (label, type) => {
    clickButton(label);
    drag([[10, 20], [60, 40], [110, 70]]);
    expect(useScene.getState().elements).toHaveLength(1);
    expect(useScene.getState().elements[0]).toMatchObject({ type, x: 10, y: 20, w: 100, h: 50 });
    expect(board().querySelectorAll(`[data-type="${type}"] path`).length).toBeGreaterThan(0);
  });

  it.each([
    ['Line', 'line'],
    ['Arrow', 'arrow'],
  ])('%s: a drag adds a %s from the start point to the end point', (label, type) => {
    clickButton(label);
    drag([[110, 20], [60, 40], [10, 70]]);
    expect(useScene.getState().elements).toHaveLength(1);
    expect(useScene.getState().elements[0]).toMatchObject({
      type, x: 10, y: 20, w: 100, h: 50, points: [[110, 20], [10, 70]],
    });
  });

  it('a drag up and to the left gives the same box', () => {
    clickButton('Rectangle');
    drag([[110, 70], [10, 20]]);
    expect(useScene.getState().elements[0]).toMatchObject({ x: 10, y: 20, w: 100, h: 50 });
  });

  it('each drag adds one shape, so two drags add two', () => {
    clickButton('Ellipse');
    drag([[10, 10], [50, 50]]);
    drag([[100, 100], [150, 120]]);
    expect(useScene.getState().elements.map((el) => el.type)).toEqual(['ellipse', 'ellipse']);
  });

  it('a click without a drag adds nothing', () => {
    clickButton('Rectangle');
    mouse('mousedown', 30, 30);
    mouse('mouseup', 30, 30);
    expect(useScene.getState().elements).toHaveLength(0);
  });
});

describe('freehand tool', () => {
  it('a drag adds an open polyline of the pointer points', () => {
    clickButton('Freehand');
    drag([[10, 20], [30, 40], [60, 30], [110, 70]]);
    expect(useScene.getState().elements).toHaveLength(1);
    expect(useScene.getState().elements[0]).toMatchObject({
      type: 'polyline', x: 10, y: 20, w: 100, h: 50,
      points: [[10, 20], [30, 40], [60, 30], [110, 70]],
    });
    expect(board().querySelectorAll('[data-type="polyline"] path').length).toBeGreaterThan(0);
  });
});
