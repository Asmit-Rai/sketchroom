import { type KeyboardEvent, type MouseEvent, useEffect, useState } from 'react';
import rough from 'roughjs';
import {
  type Box,
  moveBy,
  type NewElement,
  type Point,
  resizeTo,
  type SceneElement,
  useScene,
} from './store';

type Tool = 'select' | 'rect' | 'diamond' | 'ellipse' | 'arrow' | 'line' | 'polyline' | 'text';

const tools: { tool: Tool; label: string }[] = [
  { tool: 'select', label: 'Select' },
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
        <text
          x={el.x}
          y={el.y}
          fontSize={el.h}
          fontFamily="Caveat, cursive"
          dominantBaseline="hanging"
        >
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
function dragged(tool: Exclude<Tool, 'select' | 'text'>, points: Point[]): NewElement {
  if (tool === 'polyline') return { type: tool, ...bounds(points), points };
  const ends: Point[] = [points[0], points[points.length - 1]];
  if (tool === 'line' || tool === 'arrow') return { type: tool, ...bounds(ends), points: ends };
  return { type: tool, ...bounds(ends) };
}

// how far a drag through these points has moved
function offset(points: Point[]): Point {
  const [x0, y0] = points[0];
  const [x1, y1] = points[points.length - 1];
  return [x1 - x0, y1 - y0];
}

// the four corners of a box, each with its handle name
function corners(el: SceneElement): [string, Point][] {
  return [
    ['nw', [el.x, el.y]],
    ['ne', [el.x + el.w, el.y]],
    ['sw', [el.x, el.y + el.h]],
    ['se', [el.x + el.w, el.y + el.h]],
  ];
}

// the new box when a corner handle is dragged by (dx, dy): the opposite corner stays put
function resizedBox(el: SceneElement, handle: string, [dx, dy]: Point): Box {
  const fixedX = handle.includes('w') ? el.x + el.w : el.x;
  const fixedY = handle.includes('n') ? el.y + el.h : el.y;
  const x = (handle.includes('w') ? el.x : el.x + el.w) + dx;
  const y = (handle.includes('n') ? el.y : el.y + el.h) + dy;
  return { x: Math.min(fixedX, x), y: Math.min(fixedY, y), w: Math.abs(x - fixedX), h: Math.abs(y - fixedY) };
}

function boardPoint(e: MouseEvent<SVGSVGElement>): Point {
  const rect = e.currentTarget.getBoundingClientRect();
  return [e.clientX - rect.left, e.clientY - rect.top];
}

export default function Board() {
  const elements = useScene((state) => state.elements);
  const [tool, setTool] = useState<Tool>('select');
  const [selected, setSelected] = useState<string | null>(null);
  // the corner handle being dragged, if any
  const [handle, setHandle] = useState<string | null>(null);
  // the pointer points of the drag in progress: the mouse-down point, then every move
  const [drag, setDrag] = useState<Point[] | null>(null);
  // where the text tool was clicked, while its input is open
  const [typing, setTyping] = useState<Point | null>(null);
  const draft = drag && tool !== 'select' && tool !== 'text' && dragged(tool, drag);
  // while the select tool drags, the selected shape is drawn moved or resized until the mouse is released
  const shown = elements.map((el) => {
    if (tool !== 'select' || !drag || el.id !== selected) return el;
    return handle ? resizeTo(el, resizedBox(el, handle, offset(drag))) : moveBy(el, ...offset(drag));
  });
  const selection = shown.find((el) => el.id === selected);

  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (selected && (e.key === 'Delete' || e.key === 'Backspace')) {
        useScene.getState().deleteElement(selected);
        setSelected(null);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected]);

  // the topmost shape whose box (plus a few pixels, for flat lines) holds the point
  function hit([x, y]: Point) {
    const pad = 5;
    return [...elements]
      .reverse()
      .find((el) => x >= el.x - pad && x <= el.x + el.w + pad && y >= el.y - pad && y <= el.y + el.h + pad);
  }

  function onMouseDown(e: MouseEvent<SVGSVGElement>) {
    // keeps the focus on the text input and stops text selection while dragging
    e.preventDefault();
    const point = boardPoint(e);
    if (tool === 'text') {
      setTyping(point);
    } else if (tool === 'select' && selected && e.target instanceof Element && e.target.hasAttribute('data-handle')) {
      setHandle(e.target.getAttribute('data-handle'));
      setDrag([point]);
    } else if (tool === 'select') {
      const target = hit(point);
      setSelected(target ? target.id : null);
      setDrag(target ? [point] : null);
    } else {
      setDrag([point]);
    }
  }

  function onMouseMove(e: MouseEvent<SVGSVGElement>) {
    if (drag) setDrag([...drag, boardPoint(e)]);
  }

  function onMouseUp() {
    if (!drag || tool === 'text') return;
    if (tool === 'select') {
      // the whole drag is one move or one resize, so it is one undo step
      const [dx, dy] = offset(drag);
      const el = elements.find((item) => item.id === selected);
      if (el && (dx || dy)) {
        if (handle) useScene.getState().resizeElement(el.id, resizedBox(el, handle, [dx, dy]));
        else useScene.getState().moveElement(el.id, dx, dy);
      }
      setDrag(null);
      setHandle(null);
      return;
    }
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
      <div role="toolbar" className="button-row">
        {tools.map(({ tool: t, label }) => (
          <button
            key={t}
            type="button"
            aria-pressed={tool === t}
            onClick={() => {
              setTool(t);
              setTyping(null);
              setSelected(null);
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
          {shown.map((el) => (
            <Shape key={el.id} el={el} />
          ))}
          {draft && <Shape el={{ ...draft, id: 'draft', seed: 1 }} />}
          {selection &&
            corners(selection).map(([name, [x, y]]) => (
              <rect
                key={name}
                data-handle={name}
                x={x - 4}
                y={y - 4}
                width={8}
                height={8}
                fill="white"
                stroke="royalblue"
              />
            ))}
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
