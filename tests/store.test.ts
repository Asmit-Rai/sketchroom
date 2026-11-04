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
