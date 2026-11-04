import type { SceneElement } from './store';

export const SCENE_KEY = 'sketchroom:scene:v1';
export const BACKUP_KEY = 'sketchroom:scene:backup';

const TYPES = ['rect', 'diamond', 'ellipse', 'arrow', 'line', 'polyline', 'text'];
const LINE_TYPES = ['arrow', 'line', 'polyline'];

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPoint(value: unknown): boolean {
  return Array.isArray(value) && value.length === 2 && value.every(isNumber);
}

function isElement(value: unknown): value is SceneElement {
  if (typeof value !== 'object' || value === null) return false;
  const el = value as Record<string, unknown>;
  const points = Array.isArray(el.points) && el.points.length >= 2 && el.points.every(isPoint);
  return (
    typeof el.id === 'string' &&
    typeof el.type === 'string' &&
    TYPES.includes(el.type) &&
    [el.x, el.y, el.w, el.h, el.seed].every(isNumber) &&
    (LINE_TYPES.includes(el.type) ? points : el.points === undefined) &&
    (el.text === undefined || typeof el.text === 'string')
  );
}

// the elements of a saved scene, or null when the text is not a valid scene
export function parseScene(text: string): SceneElement[] | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null || !('elements' in value)) return null;
  const { elements } = value;
  return Array.isArray(elements) && elements.every(isElement) ? elements : null;
}

// the saved and exported form of a board
export function sceneText(elements: SceneElement[]): string {
  return JSON.stringify({ elements });
}

export function saveScene(elements: SceneElement[]) {
  localStorage.setItem(SCENE_KEY, sceneText(elements));
}

// null when nothing is saved; corrupt saved text is copied to the backup key and gives an empty board
export function loadScene(): { elements: SceneElement[]; corrupt: boolean } | null {
  const raw = localStorage.getItem(SCENE_KEY);
  if (raw === null) return null;
  const elements = parseScene(raw);
  if (elements) return { elements, corrupt: false };
  localStorage.setItem(BACKUP_KEY, raw);
  return { elements: [], corrupt: true };
}
