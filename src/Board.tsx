import rough from 'roughjs';
import { type Point, type SceneElement, useScene } from './store';

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

export default function Board() {
  const elements = useScene((state) => state.elements);
  return (
    <svg data-testid="board">
      {elements.map((el) => (
        <Shape key={el.id} el={el} />
      ))}
    </svg>
  );
}
