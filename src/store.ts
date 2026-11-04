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
export type Box = Pick<SceneElement, 'x' | 'y' | 'w' | 'h'>;

interface SceneState {
  elements: SceneElement[];
  past: SceneElement[][];
  future: SceneElement[][];
  addElement: (element: NewElement) => string;
  moveElement: (id: string, dx: number, dy: number) => void;
  resizeElement: (id: string, box: Box) => void;
  deleteElement: (id: string) => void;
  undo: () => void;
  redo: () => void;
}

// roughjs treats seed 0 as "random every time", so seeds start at 1
function newSeed(): number {
  return 1 + Math.floor(Math.random() * (2 ** 31 - 1));
}

function moveBy(el: SceneElement, dx: number, dy: number): SceneElement {
  const moved = { ...el, x: el.x + dx, y: el.y + dy };
  if (el.points) moved.points = el.points.map(([px, py]): Point => [px + dx, py + dy]);
  return moved;
}

function resizeTo(el: SceneElement, box: Box): SceneElement {
  const resized = { ...el, ...box };
  // a zero-size side has all its points on one coordinate, so any scale works there
  const sx = el.w ? box.w / el.w : 1;
  const sy = el.h ? box.h / el.h : 1;
  if (el.points) {
    resized.points = el.points.map(([px, py]): Point => [
      box.x + (px - el.x) * sx,
      box.y + (py - el.y) * sy,
    ]);
  }
  return resized;
}

// every change is one undo step: the old elements go on the past stack and redo is cleared
function change(state: SceneState, elements: SceneElement[]) {
  return { elements, past: [...state.past, state.elements], future: [] };
}

export const useScene = create<SceneState>()((set) => ({
  elements: [],
  past: [],
  future: [],
  addElement: (element) => {
    const id = crypto.randomUUID();
    set((state) => change(state, [...state.elements, { ...element, id, seed: newSeed() }]));
    return id;
  },
  moveElement: (id, dx, dy) =>
    set((state) =>
      change(state, state.elements.map((el) => (el.id === id ? moveBy(el, dx, dy) : el))),
    ),
  resizeElement: (id, box) =>
    set((state) =>
      change(state, state.elements.map((el) => (el.id === id ? resizeTo(el, box) : el))),
    ),
  deleteElement: (id) =>
    set((state) => change(state, state.elements.filter((el) => el.id !== id))),
  undo: () =>
    set((state) =>
      state.past.length === 0
        ? state
        : {
            elements: state.past[state.past.length - 1],
            past: state.past.slice(0, -1),
            future: [state.elements, ...state.future],
          },
    ),
  redo: () =>
    set((state) =>
      state.future.length === 0
        ? state
        : {
            elements: state.future[0],
            past: [...state.past, state.elements],
            future: state.future.slice(1),
          },
    ),
}));
