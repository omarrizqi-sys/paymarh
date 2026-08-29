import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { TenantContext } from '@paymarh/shared-types';
import { peutFaire } from './peut-faire.js';
import { calculerJetonConfirmation, jetonsIdentiques } from '../../modules/companies/jeton-confirmation.js';
import { avertissementsIdentifiants } from '../../modules/companies/validation-fiche.js';

describe('peutFaire — correspondance provisoire', () => {
  const admin: TenantContext = {
    userId: 'u1',
    role: 'ACCOUNT_ADMIN',
    accountId: 'a1',
    companyId: null,
  };
  const manager: TenantContext = {
    userId: 'u2',
    role: 'MANAGER',
    accountId: 'a1',
    companyId: null,
  };
  const employee: TenantContext = {
    userId: 'u3',
    role: 'EMPLOYEE',
    accountId: 'a1',
    companyId: null,
  };
  const platform: TenantContext = {
    userId: 'u4',
    role: 'PLATFORM_ADMIN',
    accountId: null,
    companyId: null,
  };

  it('accorde referentiel.lire a tout utilisateur authentifie', () => {
    expect(peutFaire(employee, 'referentiel.lire')).toBe(true);
    expect(peutFaire(platform, 'referentiel.lire')).toBe(true);
  });

  it('autorise le manager a creer/modifier mais pas supprimer', () => {
    expect(peutFaire(manager, 'societe.creer')).toBe(true);
    expect(peutFaire(manager, 'societe.modifier')).toBe(true);
    expect(peutFaire(manager, 'societe.supprimer')).toBe(false);
    expect(peutFaire(manager, 'societe.changer-etat')).toBe(false);
  });

  it('limite le PLATFORM_ADMIN au chemin admin / referentiel', () => {
    expect(peutFaire(platform, 'societe.lire')).toBe(false);
    expect(peutFaire(platform, 'societe.forcer-regime-de-base')).toBe(true);
    expect(peutFaire(platform, 'referentiel.gerer')).toBe(true);
  });

  it('donne toutes les operations compte a ACCOUNT_ADMIN', () => {
    expect(peutFaire(admin, 'societe.supprimer')).toBe(true);
    expect(peutFaire(admin, 'etablissement.designer-principal')).toBe(true);
  });
});

describe('jeton de confirmation d impact', () => {
  it('change si l inventaire change', () => {
    const a = calculerJetonConfirmation({ etablissements: 2, comptes: 1 });
    const b = calculerJetonConfirmation({ etablissements: 3, comptes: 1 });
    expect(a).not.toBe(b);
    expect(jetonsIdentiques(a, a)).toBe(true);
    expect(jetonsIdentiques(a, b)).toBe(false);
  });
});

describe('avertissements longueur', () => {
  it('signale un RIB trop court sans bloquer', () => {
    const warnings = avertissementsIdentifiants({ rib: '12345678901234567890' });
    expect(
      warnings.some((w: { code: string; champ?: string }) => w.code === 'LONGUEUR_INATTENDUE' && w.champ === 'rib')
    ).toBe(true);
  });
});

describe('garde-fou : aucun test de role hors peutFaire', () => {
  it('ne trouve aucun if (role === ...) dans les modules metier', () => {
    const racines = [
      join(import.meta.dirname, '..', '..', 'modules'),
      join(import.meta.dirname),
    ];
    const motifs = [
      /context\.role\s*===/,
      /utilisateur\.role\s*===/,
      /\.role\s*===\s*'ACCOUNT_ADMIN'/,
      /\.role\s*===\s*'MANAGER'/,
      /\.role\s*===\s*'EMPLOYEE'/,
      /\.role\s*===\s*'PLATFORM_ADMIN'/,
    ];
    const contrevenants: string[] = [];

    for (const racine of racines) {
      for (const fichier of listerTs(racine)) {
        if (fichier.includes('role-permissions.provisoire')) continue;
        if (fichier.endsWith('.spec.ts')) continue;
        const contenu = readFileSync(fichier, 'utf8');
        // Autorise tenant-scope crossAccountScope qui est le chemin elargi explicite
        if (fichier.includes(`${join('tenancy', 'tenant-scope')}`)) continue;
        for (const motif of motifs) {
          if (motif.test(contenu)) {
            contrevenants.push(fichier);
          }
        }
      }
    }

    expect(contrevenants).toEqual([]);
  });
});

function listerTs(dossier: string): string[] {
  const out: string[] = [];
  for (const entree of readdirSync(dossier)) {
    const chemin = join(dossier, entree);
    const info = statSync(chemin);
    if (info.isDirectory()) {
      if (entree === 'node_modules' || entree === 'dist') continue;
      out.push(...listerTs(chemin));
    } else if (entree.endsWith('.ts')) {
      out.push(chemin);
    }
  }
  return out;
}
