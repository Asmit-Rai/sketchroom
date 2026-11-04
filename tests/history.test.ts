import { beforeEach, describe, expect, it } from 'vitest';
import { type SceneElement, useScene } from '../src/store';

const rect = { type: 'rect' as const, x: 10, y: 20, w: 100, h: 50 };
const line = { type: 'line' as const, x: 0, y: 0, w: 30, h: 40, points: [[0, 0], [30, 40]] as [number, number][] };

function elements(): SceneElement[] {
  return structuredClone(useScene.getState().elements);
}

beforeEach(() => {
  useScene.setState(useScene.getInitialState(), true);
});

describe('undo and redo', () => {
  it('makes each change (add, move, resize, delete) one undo step', () => {
    const { addElement, moveElement, resizeElement, deleteElement, undo } = useScene.getState();
    const id = addElement(rect);
    const afterAdd = elements();
    moveElement(id, 5, 5);
    const afterMove = elements();
    resizeElement(id, { x: 0, y: 0, w: 10, h: 10 });
    const afterResize = elements();
    deleteElement(id);

    undo();
    expect(elements()).toStrictEqual(afterResize);
    undo();
    expect(elements()).toStrictEqual(afterMove);
    undo();
    expect(elements()).toStrictEqual(afterAdd);
    undo();
    expect(elements()).toStrictEqual([]);
  });

  it('150 changes undo and redo back to exactly equal states', () => {
    const states: SceneElement[][] = [elements()];
    const ids: string[] = [];
    for (let i = 0; i < 150; i += 1) {
      const s = useScene.getState();
      const last = ids[ids.length - 1];
      if (i % 5 === 0 || ids.length === 0) ids.push(s.addElement(i % 2 ? rect : line));
      else if (i % 5 === 1) s.moveElement(last, i, -i);
      else if (i % 5 === 2) s.resizeElement(last, { x: i, y: i * 2, w: 10 + i, h: 5 + i });
      else if (i % 5 === 3) s.addElement({ type: 'text', x: i, y: i, w: 40, h: 24, text: `t${i}` });
      else s.deleteElement(ids.shift()!);
      states.push(elements());
    }
    expect(useScene.getState().elements.length).toBeGreaterThan(0);

    for (let k = 149; k >= 0; k -= 1) {
      useScene.getState().undo();
      expect(elements(), `after undo back to state ${k}`).toStrictEqual(states[k]);
    }
    for (let k = 1; k <= 150; k += 1) {
      useScene.getState().redo();
      expect(elements(), `after redo to state ${k}`).toStrictEqual(states[k]);
    }
  });

  it('a new change clears redo', () => {
    const { addElement, undo, redo } = useScene.getState();
    addElement(rect);
    addElement(line);
    undo();
    addElement({ type: 'ellipse', x: 1, y: 2, w: 3, h: 4 });
    const now = elements();
    redo();
    expect(elements()).toStrictEqual(now);
    expect(elements().map((el) => el.type)).toEqual(['rect', 'ellipse']);
  });

  it('undo and redo with no history change nothing', () => {
    const { undo, redo } = useScene.getState();
    undo();
    redo();
    expect(elements()).toStrictEqual([]);
  });
});
