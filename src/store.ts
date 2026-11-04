import { create } from 'zustand';

export type ElementType = 'rect' | 'diamond' | 'ellipse' | 'arrow' | 'line' | 'polyline' | 'text';
export type Point = [number, number];

export interface SceneElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  points?: Point[];
  text?: string;
  seed: number;
}

export type NewElement = Omit<SceneElement, 'id' | 'seed'>;

interface SceneState {
  elements: SceneElement[];
  addElement: (element: NewElement) => string;
}

// roughjs treats seed 0 as "random every time", so seeds start at 1
function newSeed(): number {
  return 1 + Math.floor(Math.random() * (2 ** 31 - 1));
}

export const useScene = create<SceneState>()((set) => ({
  elements: [],
  addElement: (element) => {
    const id = crypto.randomUUID();
    set((state) => ({ elements: [...state.elements, { ...element, id, seed: newSeed() }] }));
    return id;
  },
}));
