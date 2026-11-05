import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseScene } from '../src/persist';
import type { SceneElement } from '../src/store';

const PARTS = ['Person', 'App.tsx', 'Board.tsx', 'store.ts', 'persist.ts', 'localStorage', 'Agent', 'Drawing API'];
const BOX_TYPES = ['rect', 'diamond', 'ellipse'];
const LABEL_H = 24;

function inside(inner: SceneElement, outer: SceneElement) {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  );
}

function overlap(a: SceneElement, b: SceneElement) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

describe('the project drawing boxes', () => {
  const elements = parseScene(readFileSync('docs/sketchroom-project.json', 'utf8'));

  it('parseScene reads the file as a board', () => {
    expect(elements).not.toBeNull();
  });

  it('has the title text and one box per part, each with its label inside it', () => {
    const texts = elements!.filter((el) => el.type === 'text');
    expect(texts.some((el) => el.text === 'Sketchroom'), 'title text').toBe(true);
    const boxes = elements!.filter((el) => BOX_TYPES.includes(el.type));
    expect(boxes).toHaveLength(PARTS.length);
    const used = new Set<string>();
    for (const part of PARTS) {
      const labels = texts.filter((el) => el.text === part || el.text!.startsWith(`${part} `));
      expect(labels, `one label for ${part}`).toHaveLength(1);
      const [label] = labels;
      // the size Board.tsx gives a typed text
      expect(label.h, `${part} label height`).toBe(LABEL_H);
      expect(label.w, `${part} label width`).toBe(label.text!.length * LABEL_H * 0.5);
      const holders = boxes.filter((box) => inside(label, box));
      expect(holders, `one box holds the ${part} label`).toHaveLength(1);
      used.add(holders[0].id);
    }
    expect(used.size, 'each box holds a different part').toBe(PARTS.length);
  });

  it('fits every element inside x 0 to 1200 and y 0 to 600', () => {
    for (const el of elements!) {
      expect(el.x >= 0 && el.y >= 0 && el.x + el.w <= 1200 && el.y + el.h <= 600, el.id).toBe(true);
      for (const [px, py] of el.points ?? []) {
        expect(px >= 0 && px <= 1200 && py >= 0 && py <= 600, `${el.id} point ${px},${py}`).toBe(true);
      }
    }
  });

  it('has no two boxes overlapping', () => {
    const boxes = elements!.filter((el) => BOX_TYPES.includes(el.type));
    for (const [i, a] of boxes.entries()) {
      for (const b of boxes.slice(i + 1)) expect(overlap(a, b), `${a.id} and ${b.id}`).toBe(false);
    }
  });
});
