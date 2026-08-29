# Permissions — Fiche société

- **Module :** 1 — Fiches
- **Étape :** 1.1.b
- **Date :** 2026-08-29
- **ADR :** [0007-permissions-point-de-passage-unique.md](../../adr/0007-permissions-point-de-passage-unique.md)

---

## 1. Principe

Toute décision de droit passe par **une seule fonction** : `peutFaire(utilisateur, permission, contexte)`.

Aucun contrôleur ni service ne teste un rôle directement (`if (role === …)`). Un test Vitest échoue si un tel test de rôle réapparaît dans le code métier.

---

## 2. Liste des permissions

| Permission | Signification |
| --- | --- |
| `societe.lire` / `creer` / `modifier` / `supprimer` / `changer-etat` | Fiche société |
| `societe.forcer-regime-de-base` | Chemin admin uniquement |
| `etablissement.*` | Lire, créer, modifier, supprimer, désigner principal |
| `compte-bancaire.*` | Lire, créer, modifier, clôturer, supprimer |
| `referentiel.lire` | Banques, jours fériés, formes, types d’heures / exonération |
| `referentiel.gerer` | Maintenance des référentiels (réservé plateforme ; pas d’écriture dans cette étape) |

---

## 3. Correspondance provisoire avec les rôles du module 0

Fichier unique : `apps/api/src/common/permissions/role-permissions.provisoire.ts`.

| Rôle | Droits |
| --- | --- |
| `ACCOUNT_ADMIN` | Toutes les opérations sur les sociétés **de son compte** (sauf forcer-régime et gérer référentiel) |
| `MANAGER` | lire / créer / modifier (société, établissement, compte). **Pas** supprimer, **pas** changer d’état |
| `EMPLOYEE` | Aucune (sauf `referentiel.lire`, accordé à tout utilisateur authentifié) |
| `PLATFORM_ADMIN` | `referentiel.gerer` + `societe.forcer-regime-de-base` seulement. **Aucun accès** aux données des comptes sur le chemin normal |

L’isolation multi-tenant (`accountScope`) reste la barrière entre comptes. `peutFaire` décide seulement si l’opération est autorisée pour le rôle.

---

## 4. Ce qu’il faudra changer au module d’authentification

1. Remplacer `role-permissions.provisoire.ts` par une **table de droits** (par opération et par société).
2. Faire lire `peutFaire` cette table au lieu du `switch` sur le rôle.
3. Ajouter familles de droits, administrateur principal, modification en masse.
4. Remplacer l’en-tête `x-paymarh-user-id` par la session Auth.js.

**Ce qui ne changera pas :** les noms de permissions, les appels `assertPeutFaire` dans les services, et le fait qu’aucun autre endroit ne teste les rôles.
