import type { SceneElement } from './store';

export const SCENE_KEY = 'sketchroom:scene:v1';

export function saveScene(elements: SceneElement[]) {
  localStorage.setItem(SCENE_KEY, JSON.stringify({ elements }));
}

// the saved elements, or null when nothing is saved
export function loadScene(): SceneElement[] | null {
  const raw = localStorage.getItem(SCENE_KEY);
  return raw === null ? null : JSON.parse(raw).elements;
}
