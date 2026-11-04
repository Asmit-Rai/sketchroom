import { type KeyboardEvent, type MouseEvent, useState } from 'react';
import rough from 'roughjs';
import { type NewElement, type Point, type SceneElement, useScene } from './store';

type Tool = 'rect' | 'diamond' | 'ellipse' | 'arrow' | 'line' | 'polyline' | 'text';

const tools: { tool: Tool; label: string }[] = [
  { tool: 'rect', label: 'Rectangle' },
  { tool: 'diamond', label: 'Diamond' },
  { tool: 'ellipse', label: 'Ellipse' },
  { tool: 'arrow', label: 'Arrow' },
  { tool: 'line', label: 'Line' },
  { tool: 'polyline', label: 'Freehand' },
  { tool: 'text', label: 'Text' },
];

const FONT_SIZE = 24;

const generator = rough.generator();

// the two short strokes of an arrow head, drawn back from the last point
function arrowHead(points: Point[]): Point[] {
  const [x1, y1] = points[points.length - 2];
  const [x2, y2] = points[points.length - 1];
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 15;
  return [
    [x2 - size * Math.cos(angle - Math.PI / 6), y2 - size * Math.sin(angle - Math.PI / 6)],
    [x2, y2],
    [x2 - size * Math.cos(angle + Math.PI / 6), y2 - size * Math.sin(angle + Math.PI / 6)],
  ];
}

function drawables(el: SceneElement) {
  const options = { seed: el.seed, stroke: 'black', strokeWidth: 2 };
  const cx = el.x + el.w / 2;
  const cy = el.y + el.h / 2;
  const points = el.points ?? [];
  switch (el.type) {
    case 'rect':
      return [generator.rectangle(el.x, el.y, el.w, el.h, options)];
    case 'ellipse':
      return [generator.ellipse(cx, cy, el.w, el.h, options)];
    case 'diamond':
      return [
        generator.polygon(
          [[cx, el.y], [el.x + el.w, cy], [cx, el.y + el.h], [el.x, cy]],
          options,
        ),
      ];
    case 'line':
    case 'polyline':
      return [generator.linearPath(points, options)];
    case 'arrow':
      return [generator.linearPath(points, options), generator.linearPath(arrowHead(points), options)];
    default:
      return [];
  }
}

function Shape({ el }: { el: SceneElement }) {
  return (
    <g data-id={el.id} data-type={el.type}>
      {el.type === 'text' ? (
        <text x={el.x} y={el.y} fontSize={el.h} dominantBaseline="hanging">
          {el.text}
        </text>
      ) : (
        drawables(el)
          .flatMap((drawable) => generator.toPaths(drawable))
          .map((path, i) => (
            <path
              key={i}
              d={path.d}
              stroke={path.stroke}
              strokeWidth={path.strokeWidth}
              fill={path.fill ?? 'none'}
            />
          ))
      )}
    </g>
  );
}

function bounds(points: Point[]) {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

// the shape a drag through these points draws: freehand keeps every point,
// the other tools use only the start and the end
function dragged(tool: Exclude<Tool, 'text'>, points: Point[]): NewElement {
  if (tool === 'polyline') return { type: tool, ...bounds(points), points };
  const ends: Point[] = [points[0], points[points.length - 1]];
  if (tool === 'line' || tool === 'arrow') return { type: tool, ...bounds(ends), points: ends };
  return { type: tool, ...bounds(ends) };
}

function boardPoint(e: MouseEvent<SVGSVGElement>): Point {
  const rect = e.currentTarget.getBoundingClientRect();
  return [e.clientX - rect.left, e.clientY - rect.top];
}

export default function Board() {
  const elements = useScene((state) => state.elements);
  const [tool, setTool] = useState<Tool>('rect');
  // the pointer points of the drag in progress: the mouse-down point, then every move
  const [drag, setDrag] = useState<Point[] | null>(null);
  // where the text tool was clicked, while its input is open
  const [typing, setTyping] = useState<Point | null>(null);
  const draft = drag && tool !== 'text' && dragged(tool, drag);

  function onMouseDown(e: MouseEvent<SVGSVGElement>) {
    // keeps the focus on the text input and stops text selection while dragging
    e.preventDefault();
    if (tool === 'text') setTyping(boardPoint(e));
    else setDrag([boardPoint(e)]);
  }

  function onMouseMove(e: MouseEvent<SVGSVGElement>) {
    if (drag) setDrag([...drag, boardPoint(e)]);
  }

  function onMouseUp() {
    if (!drag || tool === 'text') return;
    const element = dragged(tool, drag);
    if (element.w > 0 || element.h > 0) useScene.getState().addElement(element);
    setDrag(null);
  }

  function onTextKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!typing) return;
    const text = e.currentTarget.value;
    if (e.key === 'Enter' && text) {
      const [x, y] = typing;
      useScene.getState().addElement({
        type: 'text', x, y, w: text.length * FONT_SIZE * 0.5, h: FONT_SIZE, text,
      });
    }
    if (e.key === 'Enter' || e.key === 'Escape') setTyping(null);
  }

  return (
    <>
      <div role="toolbar">
        {tools.map(({ tool: t, label }) => (
          <button
            key={t}
            type="button"
            aria-pressed={tool === t}
            onClick={() => {
              setTool(t);
              setTyping(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        <svg
          data-testid="board"
          width="100%"
          height="600"
          style={{ display: 'block', border: '1px solid #ccc' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        >
          {elements.map((el) => (
            <Shape key={el.id} el={el} />
          ))}
          {draft && <Shape el={{ ...draft, id: 'draft', seed: 1 }} />}
        </svg>
        {typing && (
          <input
            key={typing.join()}
            data-testid="text-input"
            aria-label="Text"
            autoFocus
            style={{ position: 'absolute', left: typing[0], top: typing[1], fontSize: FONT_SIZE }}
            onKeyDown={onTextKeyDown}
          />
        )}
      </div>
    </>
  );
}
