import Board from './Board';
import { useScene } from './store';

export default function App() {
  const empty = useScene((state) => state.elements.length === 0);
  return (
    <main>
      <h1>Sketchroom</h1>
      {empty && <p data-testid="empty-hint">Pick a tool, then drag on the board to draw.</p>}
      <Board />
    </main>
  );
}
