import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import Board from './Board';
import { loadScene, parseScene, saveScene, sceneText } from './persist';
import { useScene } from './store';

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

  function exportJson() {
    const text = sceneText(useScene.getState().elements);
    download(new Blob([text], { type: 'application/json' }), 'sketchroom.json');
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
          'The saved text was kept in sketchroom:scene:backup.',
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
        <button type="button" onClick={exportJson}>
          Export JSON
        </button>
        <button type="button" onClick={() => importInput.current?.click()}>
          Import JSON
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
