import { beforeEach, describe, expect, it } from 'vitest';
import { type NewElement, useScene } from '../src/store';

const samples: NewElement[] = [
  { type: 'rect', x: 10, y: 20, w: 100, h: 50 },
  { type: 'diamond', x: 10, y: 20, w: 100, h: 50 },
  { type: 'ellipse', x: 10, y: 20, w: 100, h: 50 },
  { type: 'arrow', x: 10, y: 20, w: 100, h: 50, points: [[10, 20], [110, 70]] },
  { type: 'line', x: 10, y: 20, w: 100, h: 50, points: [[10, 70], [110, 20]] },
  { type: 'polyline', x: 10, y: 20, w: 100, h: 50, points: [[10, 20], [60, 70], [110, 20]] },
  { type: 'text', x: 10, y: 20, w: 100, h: 50, text: 'Hello' },
];

beforeEach(() => {
  useScene.setState(useScene.getInitialState(), true);
});

describe('store: add', () => {
  it('adds an element of each of the 7 types, each with an id and an integer seed', () => {
    for (const sample of samples) {
      useScene.getState().addElement(sample);
    }
    const elements = useScene.getState().elements;
    expect(elements.map((el) => el.type)).toEqual([
      'rect', 'diamond', 'ellipse', 'arrow', 'line', 'polyline', 'text',
    ]);
    elements.forEach((el, i) => {
      expect(el).toMatchObject(samples[i]);
      expect(typeof el.id).toBe('string');
      expect(el.id).not.toBe('');
      expect(Number.isInteger(el.seed)).toBe(true);
      // roughjs treats seed 0 as "random every time", so a stored seed must not be 0
      expect(el.seed).toBeGreaterThan(0);
    });
    expect(new Set(elements.map((el) => el.id)).size).toBe(7);
  });

  it('returns the id of the new element', () => {
    const id = useScene.getState().addElement(samples[0]);
    expect(useScene.getState().elements[0].id).toBe(id);
  });
});

describe('store: move', () => {
  it.each(samples)('moves a $type by dx, dy, and its points move too', (sample) => {
    const id = useScene.getState().addElement(sample);
    const before = useScene.getState().elements[0];
    useScene.getState().moveElement(id, 5, -10);
    const after = useScene.getState().elements[0];
    expect(after).toEqual({
      ...before,
      x: sample.x + 5,
      y: sample.y - 10,
      ...(sample.points && { points: sample.points.map(([px, py]) => [px + 5, py - 10]) }),
    });
  });

  it('moves only the element with that id', () => {
    const first = useScene.getState().addElement(samples[0]);
    useScene.getState().addElement(samples[2]);
    useScene.getState().moveElement(first, 1, 1);
    expect(useScene.getState().elements[1]).toMatchObject(samples[2]);
  });
});

describe('store: resize', () => {
  // every sample has the box (10, 20, 100, 50); the new box is (0, 0, 200, 25)
  const box = { x: 0, y: 0, w: 200, h: 25 };
  const scaledPoints: Record<string, [number, number][]> = {
    arrow: [[0, 0], [200, 25]],
    line: [[0, 25], [200, 0]],
    polyline: [[0, 0], [100, 25], [200, 0]],
  };

  it.each(samples)('resizes a $type to a new box, and its points scale', (sample) => {
    const id = useScene.getState().addElement(sample);
    const before = useScene.getState().elements[0];
    useScene.getState().resizeElement(id, box);
    const after = useScene.getState().elements[0];
    expect(after).toEqual({
      ...before,
      ...box,
      ...(sample.points && { points: scaledPoints[sample.type] }),
    });
  });

  it('resizes a vertical line (zero width) without NaN', () => {
    const id = useScene.getState().addElement({
      type: 'line', x: 10, y: 20, w: 0, h: 50, points: [[10, 20], [10, 70]],
    });
    useScene.getState().resizeElement(id, { x: 30, y: 0, w: 0, h: 100 });
    expect(useScene.getState().elements[0].points).toEqual([[30, 0], [30, 100]]);
  });

  it('resizes only the element with that id', () => {
    const first = useScene.getState().addElement(samples[0]);
    useScene.getState().addElement(samples[2]);
    useScene.getState().resizeElement(first, box);
    expect(useScene.getState().elements[1]).toMatchObject(samples[2]);
  });
});
