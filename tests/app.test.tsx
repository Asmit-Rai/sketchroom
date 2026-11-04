import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import App from '../src/App';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('App', () => {
  it('shows the Sketchroom heading and an empty SVG board', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(<App />));

    const headings = container.querySelectorAll('h1');
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe('Sketchroom');

    const boards = container.querySelectorAll('svg[data-testid="board"]');
    expect(boards).toHaveLength(1);
    expect(boards[0].children).toHaveLength(0);

    act(() => root.unmount());
    container.remove();
  });
});
