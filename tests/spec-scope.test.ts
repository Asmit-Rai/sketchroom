import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// the text of SPEC.md section 7, up to the next heading of the same level
function outOfScope(): string {
  const spec = readFileSync('SPEC.md', 'utf8');
  const start = spec.indexOf('## 7. Out of scope');
  expect(start, 'section 7 heading').toBeGreaterThanOrEqual(0);
  const rest = spec.slice(start + 1);
  const end = rest.search(/\n## /);
  return end === -1 ? rest : rest.slice(0, end);
}

describe('SPEC.md section 7, out of scope', () => {
  it('no longer lists dark mode', () => {
    expect(outOfScope()).not.toMatch(/dark\s+mode/i);
  });

  it('still lists the other out-of-scope items', () => {
    const section = outOfScope();
    for (const item of ['Multiplayer', 'accounts', 'cloud sync', 'templates', 'SVG export', 'eraser']) {
      expect(section, item).toContain(item);
    }
  });
});
