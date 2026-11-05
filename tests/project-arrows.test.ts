import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseScene } from '../src/persist';
import type { Point, SceneElement } from '../src/store';

const FLOWS: [string, string][] = [
  ['Person', 'Board.tsx'],
  ['Board.tsx', 'store.ts'],
  ['store.ts', 'persist.ts'],
  ['persist.ts', 'localStorage'],
  ['App.tsx', 'store.ts'],
  ['Agent', 'Drawing API'],
  ['Drawing API', 'Board.tsx'],
];
const BOX_TYPES = ['rect', 'diamond', 'ellipse'];
const NEAR = 20;

// how far a point is from a box (0 when it is on or inside it)
function distance([px, py]: Point, box: SceneElement) {
  const dx = Math.max(box.x - px, 0, px - (box.x + box.w));
  const dy = Math.max(box.y - py, 0, py - (box.y + box.h));
  return Math.hypot(dx, dy);
}

describe('the project drawing arrows', () => {
  const elements = parseScene(readFileSync('docs/sketchroom-project.json', 'utf8'));
  const arrows = (elements ?? []).filter((el) => el.type === 'arrow');

  // the box that holds the label of a part
  function boxOf(part: string) {
    const label = elements!.find(
      (el) => el.type === 'text' && (el.text === part || el.text!.startsWith(`${part} `)),
    );
    expect(label, `${part} label`).toBeDefined();
    const box = elements!.find(
      (el) =>
        BOX_TYPES.includes(el.type) &&
        label!.x >= el.x &&
        label!.y >= el.y &&
        label!.x + label!.w <= el.x + el.w &&
        label!.y + label!.h <= el.y + el.h,
    );
    expect(box, `${part} box`).toBeDefined();
    return box!;
  }

  it('parseScene reads the file as a board', () => {
    expect(elements).not.toBeNull();
  });

  it('has one arrow for each flow, from near its first box to near its second', () => {
    expect(arrows).toHaveLength(FLOWS.length);
    const used = new Set<string>();
    for (const [from, to] of FLOWS) {
      const a = boxOf(from);
      const b = boxOf(to);
      const found = arrows.find((arrow) => {
        const points = arrow.points!;
        return distance(points[0], a) <= NEAR && distance(points[points.length - 1], b) <= NEAR;
      });
      expect(found, `arrow ${from} to ${to}`).toBeDefined();
      used.add(found!.id);
    }
    expect(used.size, 'each flow has its own arrow').toBe(FLOWS.length);
  });

  it('gives every arrow the bounds of its points, inside x 0 to 1200 and y 0 to 600', () => {
    for (const arrow of arrows) {
      const xs = arrow.points!.map(([x]) => x);
      const ys = arrow.points!.map(([, y]) => y);
      expect([arrow.x, arrow.y, arrow.w, arrow.h], arrow.id).toEqual([
        Math.min(...xs),
        Math.min(...ys),
        Math.max(...xs) - Math.min(...xs),
        Math.max(...ys) - Math.min(...ys),
      ]);
      for (const [px, py] of arrow.points!) {
        expect(px >= 0 && px <= 1200 && py >= 0 && py <= 600, `${arrow.id} point ${px},${py}`).toBe(true);
      }
    }
  });
});
