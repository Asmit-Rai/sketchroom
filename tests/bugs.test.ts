import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('bug log', () => {
  it('workflow/BUGS.md has the header row from SPEC.md 2.4', () => {
    const lines = readFileSync('workflow/BUGS.md', 'utf8')
      .split('\n')
      .map((line) => line.trim());
    expect(lines).toContain(
      '| Run | Agent | What happened (quote it) | What should have happened | Fix | Rerun result |',
    );
  });
});
