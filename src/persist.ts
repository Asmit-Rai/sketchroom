import type { SceneElement } from './store';

export const SCENE_KEY = 'sketchroom:scene:v1';

export function saveScene(elements: SceneElement[]) {
  localStorage.setItem(SCENE_KEY, JSON.stringify({ elements }));
}
