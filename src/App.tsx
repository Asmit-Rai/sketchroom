import { useEffect } from 'react';
import Board from './Board';
import { saveScene } from './persist';
import { useScene } from './store';

export default function App() {
  const empty = useScene((state) => state.elements.length === 0);
  const { undo, redo } = useScene.getState();

  // autosave: 300 ms after the last change to the elements
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useScene.subscribe((state, previous) => {
      if (state.elements === previous.elements) return;
      clearTimeout(timer);
      timer = setTimeout(() => saveScene(state.elements), 300);
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
      {empty && <p data-testid="empty-hint">Pick a tool, then drag on the board to draw.</p>}
      <Board />
    </main>
  );
}
