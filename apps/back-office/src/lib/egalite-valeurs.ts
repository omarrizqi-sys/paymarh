/**
 * Comparaison structurelle de valeurs, insensible a l ordre des cles d objet.
 */
export function valeursStructurellementEgales(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return Object.is(a, b);
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    return a.every((element, index) => valeursStructurellementEgales(element, b[index]));
  }
  if (Array.isArray(b)) {
    return false;
  }
  const recordA = a as Record<string, unknown>;
  const recordB = b as Record<string, unknown>;
  const clesA = Object.keys(recordA).sort();
  const clesB = Object.keys(recordB).sort();
  if (clesA.length !== clesB.length) {
    return false;
  }
  return clesA.every((cle, index) => {
    if (cle !== clesB[index]) {
      return false;
    }
    return valeursStructurellementEgales(recordA[cle], recordB[cle]);
  });
}
