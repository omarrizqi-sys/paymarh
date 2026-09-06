import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const RACINE_APPS = join(import.meta.dirname, '..', '..', '..');

/**
 * Elision francaise avec apostrophe droite : l'API, n'est, d'un…
 * L apostrophe typographique (’) n est pas visee. Les guillemets autour d un
 * identifiant technique ('x-paymarh-user-id') non plus.
 */
const ELISION_ASCII = /\b(?:l|d|n|j|m|t|s|c|qu)'[A-Za-zÀ-ÿ]/i;
const MOT_FRANCAIS = /[A-Za-zÀ-ÿ]{4,}/;

describe('garde-fou : aucune apostrophe droite dans un texte francais affiche', () => {
  it('ne trouve aucune elision ASCII dans une chaine source hors tests', () => {
    const racines = [join(import.meta.dirname, '..'), join(RACINE_APPS, 'back-office', 'src')];
    const contrevenants: string[] = [];

    for (const racine of racines) {
      for (const fichier of listerTs(racine)) {
        if (fichier.includes(`${join('generated', 'prisma')}`)) continue;
        if (/\.spec\.(ts|tsx)$/.test(fichier)) continue;
        const contenu = readFileSync(fichier, 'utf8');
        for (const chaine of extraireChaines(contenu)) {
          if (ELISION_ASCII.test(chaine) && MOT_FRANCAIS.test(chaine)) {
            contrevenants.push(`${relative(RACINE_APPS, fichier)}: ${chaine}`);
          }
        }
      }
    }

    expect(contrevenants).toEqual([]);
  });
});

function extraireChaines(source: string): string[] {
  const chaines: string[] = [];
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (c === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i += 1;
      continue;
    }
    if (c === '/' && source[i + 1] === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'") {
      const q = c;
      i += 1;
      let acc = '';
      while (i < source.length) {
        if (source[i] === '\\') {
          acc += source[i + 1] ?? '';
          i += 2;
          continue;
        }
        if (source[i] === q) {
          i += 1;
          break;
        }
        acc += source[i];
        i += 1;
      }
      chaines.push(acc);
      continue;
    }
    if (c === '`') {
      i += 1;
      let acc = '';
      while (i < source.length) {
        if (source[i] === '\\') {
          acc += source[i + 1] ?? '';
          i += 2;
          continue;
        }
        if (source[i] === '$' && source[i + 1] === '{') {
          i = sauterInterpolation(source, i + 2);
          continue;
        }
        if (source[i] === '`') {
          i += 1;
          break;
        }
        acc += source[i];
        i += 1;
      }
      chaines.push(acc);
      continue;
    }
    i += 1;
  }
  return chaines;
}

function sauterInterpolation(source: string, debut: number): number {
  let i = debut;
  let profondeur = 1;
  while (i < source.length && profondeur > 0) {
    const c = source[i];
    if (c === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i += 1;
      continue;
    }
    if (c === '/' && source[i + 1] === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      i += 1;
      while (i < source.length) {
        if (source[i] === '\\') {
          i += 2;
          continue;
        }
        if (q === '`' && source[i] === '$' && source[i + 1] === '{') {
          i = sauterInterpolation(source, i + 2);
          continue;
        }
        if (source[i] === q) {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }
    if (c === '{') profondeur += 1;
    if (c === '}') {
      profondeur -= 1;
      if (profondeur === 0) return i + 1;
    }
    i += 1;
  }
  return i;
}

function listerTs(dossier: string): string[] {
  const out: string[] = [];
  for (const entree of readdirSync(dossier)) {
    const chemin = join(dossier, entree);
    const info = statSync(chemin);
    if (info.isDirectory()) {
      if (entree === 'node_modules' || entree === 'dist') continue;
      out.push(...listerTs(chemin));
    } else if (entree.endsWith('.ts') || entree.endsWith('.tsx')) {
      out.push(chemin);
    }
  }
  return out;
}
