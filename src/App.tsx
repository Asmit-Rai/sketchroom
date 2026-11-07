import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import Board from './Board';
import { loadScene, parseScene, saveScene, sceneText } from './persist';
import { useScene } from './store';

const THEME_KEY = 'sketchroom:theme:v1';

type Theme = 'light' | 'dark';

// the saved theme, or light when nothing or an unknown value is saved
function savedTheme(): Theme {
  return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const empty = useScene((state) => state.elements.length === 0);
  const { undo, redo } = useScene.getState();
  const [notice, setNotice] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<Theme>(savedTheme);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // storage full: the theme still changes, it is only not remembered
    }
  }

  // the theme lives on the html element, so the whole page can follow it
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // one undo step; an empty board stays as it is, so Undo still undoes the change before it
  function clear() {
    if (useScene.getState().elements.length > 0) useScene.getState().replaceElements([]);
  }

  function exportJson() {
    const text = sceneText(useScene.getState().elements);
    download(new Blob([text], { type: 'application/json' }), 'sketchroom.json');
  }

  // draws the board's SVG onto an off-screen canvas, only to encode it as a PNG file
  function exportPng() {
    const svg = document.querySelector<SVGSVGElement>('svg[data-testid="board"]');
    if (!svg) return;
    const { width, height } = svg.getBoundingClientRect();
    const copy = svg.cloneNode(true) as SVGSVGElement;
    copy.setAttribute('width', String(width));
    copy.setAttribute('height', String(height));
    const svgText = new XMLSerializer().serializeToString(copy);
    const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.fillStyle = 'white';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0);
      canvas.toBlob((png) => {
        if (png) download(png, 'sketchroom.png');
      }, 'image/png');
    };
    image.src = url;
  }

  async function importJson(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const elements = parseScene(await file.text());
    // lets the same file be picked again
    input.value = '';
    if (elements) {
      useScene.getState().replaceElements(elements);
      setNotice(null);
    } else {
      setNotice('That file is not a Sketchroom board, so nothing was imported.');
    }
  }

  // restore the saved board once, before autosave starts listening
  useEffect(() => {
    const saved = loadScene();
    if (!saved) return;
    useScene.getState().loadElements(saved.elements);
    if (saved.corrupt) {
      setNotice(
        'The saved board could not be read, so an empty board was started. ' +
          (saved.backedUp
            ? 'The saved text was kept in sketchroom:scene:backup.'
            : 'The browser storage is full, so the saved text could not be kept as a backup.'),
      );
    }
  }, []);

  // autosave: 300 ms after the last change to the elements
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useScene.subscribe((state, previous) => {
      if (state.elements === previous.elements) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          saveScene(state.elements);
          setWarning(null);
        } catch {
          setWarning('Your latest changes could not be saved: the browser storage is full.');
        }
      }, 300);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  return (
    <main>
      <h1>Sketchroom</h1>
      <div>
        <button type="button" onClick={undo}>
          Undo
        </button>
        <button type="button" onClick={redo}>
          Redo
        </button>
        <button type="button" onClick={clear}>
          Clear
        </button>
        <button type="button" onClick={exportJson}>
          Export JSON
        </button>
        <button type="button" onClick={() => importInput.current?.click()}>
          Import JSON
        </button>
        <button type="button" onClick={exportPng}>
          Export PNG
        </button>
        <button
          type="button"
          aria-pressed={theme === 'dark'}
          onClick={toggleTheme}
        >
          Dark mode
        </button>
        <input
          ref={importInput}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={importJson}
        />
      </div>
      {notice && (
        <p role="alert" data-testid="notice">
          {notice}
        </p>
      )}
      {warning && (
        <p role="alert" data-testid="warning">
          {warning}
        </p>
      )}
      {empty && <p data-testid="empty-hint">Pick a tool, then drag on the board to draw.</p>}
      <Board />
    </main>
  );
}
