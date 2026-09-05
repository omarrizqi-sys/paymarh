import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('garde-fou : aucun alias server-only dans la configuration Next', () => {
  it("ne trouve aucune occurrence de 'server-only' dans next.config.ts", () => {
    const fichier = join(import.meta.dirname, '..', 'next.config.ts');
    const contenu = readFileSync(fichier, 'utf8');
    const contrevenants: string[] = [];

    if (contenu.includes('server-only')) {
      contrevenants.push('next.config.ts');
    }

    expect(contrevenants).toEqual([]);
  });
});
