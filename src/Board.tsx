import { type MouseEvent, useState } from 'react';
import rough from 'roughjs';
import { type NewElement, type Point, type SceneElement, useScene } from './store';

type Tool = 'rect' | 'diamond' | 'ellipse' | 'arrow' | 'line';

const tools: { tool: Tool; label: string }[] = [
  { tool: 'rect', label: 'Rectangle' },
  { tool: 'diamond', label: 'Diamond' },
  { tool: 'ellipse', label: 'Ellipse' },
  { tool: 'arrow', label: 'Arrow' },
  { tool: 'line', label: 'Line' },
];

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

// the shape a drag from start to end draws with a drag tool
function dragged(tool: Tool, [x0, y0]: Point, [x1, y1]: Point): NewElement {
  const box = { x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) };
  if (tool === 'line' || tool === 'arrow') {
    return { type: tool, ...box, points: [[x0, y0], [x1, y1]] };
  }
  return { type: tool, ...box };
}

function boardPoint(e: MouseEvent<SVGSVGElement>): Point {
  const rect = e.currentTarget.getBoundingClientRect();
  return [e.clientX - rect.left, e.clientY - rect.top];
}

export default function Board() {
  const elements = useScene((state) => state.elements);
  const [tool, setTool] = useState<Tool>('rect');
  const [drag, setDrag] = useState<{ start: Point; end: Point } | null>(null);
  const draft = drag && dragged(tool, drag.start, drag.end);

  function onMouseDown(e: MouseEvent<SVGSVGElement>) {
    const point = boardPoint(e);
    setDrag({ start: point, end: point });
  }

  function onMouseMove(e: MouseEvent<SVGSVGElement>) {
    if (drag) setDrag({ ...drag, end: boardPoint(e) });
  }

  function onMouseUp(e: MouseEvent<SVGSVGElement>) {
    if (!drag) return;
    const element = dragged(tool, drag.start, boardPoint(e));
    if (element.w > 0 || element.h > 0) useScene.getState().addElement(element);
    setDrag(null);
  }

  return (
    <>
      <div role="toolbar">
        {tools.map(({ tool: t, label }) => (
          <button key={t} type="button" aria-pressed={tool === t} onClick={() => setTool(t)}>
            {label}
          </button>
        ))}
      </div>
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
    </>
  );
}
