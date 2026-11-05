import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseScene } from '../src/persist';

const PLANNED = ['Agent', 'Drawing API'];

describe('the planned parts of the project drawing', () => {
  const elements = parseScene(readFileSync('docs/sketchroom-project.json', 'utf8'));

  it('says "planned" in the Agent and Drawing API labels and in no other text', () => {
    expect(elements).not.toBeNull();
    const texts = elements!.filter((el) => el.type === 'text');
    const labels = PLANNED.map((part) => {
      const label = texts.find((el) => el.text === part || el.text!.startsWith(`${part} `));
      expect(label, `${part} label`).toBeDefined();
      return label!;
    });
    for (const label of labels) expect(label.text, label.id).toContain('planned');
    const saying = texts.filter((el) => el.text!.includes('planned')).map((el) => el.id);
    expect(saying.sort()).toEqual(labels.map((el) => el.id).sort());
  });
});
