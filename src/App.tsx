import { useEffect, useState } from 'react';
import Board from './Board';
import { loadScene, saveScene } from './persist';
import { useScene } from './store';

export default function App() {
  const empty = useScene((state) => state.elements.length === 0);
  const { undo, redo } = useScene.getState();
  const [notice, setNotice] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

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
