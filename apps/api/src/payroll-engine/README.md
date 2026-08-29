# Moteur de paie — le contrat

> **État au module 0 : ce moteur est VIDE.** Seul son contrat existe (`contract.ts`). Aucune fonction de calcul ne doit être ajoutée ici sans un module métier spécifié.

Lisez ce document **en entier** avant d'écrire la moindre ligne dans ce dossier. Les règles qui suivent ne sont pas des préférences de style : elles conditionnent la défendabilité juridique des bulletins produits.

---

## La règle unique

Le moteur de paie est une **fonction pure**.

```
                 ┌─────────────────────┐
EntreeCalculPaie │                     │ ResultatCalculPaie
────────────────►│   MOTEUR DE PAIE    │────────────────────►
                 │                     │
                 └─────────────────────┘
                    aucune autre entrée
                    aucune autre sortie
```

Concrètement, le moteur :

- reçoit **toutes** ses données en paramètre ;
- rend un résultat ;
- **n'accède jamais** à la base de données ;
- n'appelle aucun service, ne fait aucune requête réseau ;
- ne lit ni l'horloge système, ni les variables d'environnement, ni un fichier ;
- n'écrit rien, ne journalise rien, ne modifie aucun état.

Deux appels avec exactement la même entrée rendent exactement le même résultat. **Toujours.**

---

## Pourquoi cette isolation

### 1. Un bulletin doit être rejouable

Un bulletin de paie peut être contesté, contrôlé ou régularisé des années après son émission. On doit pouvoir recalculer mars 2026 en 2029 et obtenir **le même résultat au centime près**.

Si le moteur allait chercher lui-même ses données en base, le résultat dépendrait de l'état de la base **au moment du calcul**. Or entre-temps le salaire aura changé, une rubrique aura été corrigée, un barème aura été mis à jour. Le recalcul donnerait un autre chiffre — et on serait incapable d'expliquer lequel des deux est le bon.

En rendant le moteur pur, le calcul devient une fonction de ses entrées. Ces entrées peuvent alors être **archivées avec le résultat** : on garde la photo exacte de ce qui a servi à produire le bulletin.

### 2. Le calcul devient testable

Une fonction pure se teste sans base de données, sans serveur, sans données de démonstration. On lui donne une entrée, on vérifie la sortie.

C'est ce qui permettra d'écrire des centaines de cas de test sur les cotisations CNSS, l'AMO, l'IR, les indemnités — chacun s'exécutant en quelques millisecondes. Sur un domaine où l'exactitude prime, cette facilité de test n'est pas un confort : c'est la condition pour oser modifier le calcul.

### 3. Les barèmes changent, les calculs passés ne doivent pas

La réglementation marocaine évolue : taux de cotisation, tranches d'IR, plafonds. Ces paramètres feront partie de l'**entrée** du moteur, pas de son code. Recalculer un bulletin de 2026 avec les barèmes de 2026 restera donc possible même en 2030.

---

## Le partage des rôles

| Responsabilité                | Qui           | Où                        |
| ----------------------------- | ------------- | ------------------------- |
| Lire les données en base      | les modules   | `src/modules/…`           |
| Rassembler l'entrée du calcul | les modules   | `src/modules/…`           |
| **Calculer**                  | **le moteur** | **`src/payroll-engine/`** |
| Écrire le résultat en base    | les modules   | `src/modules/…`           |
| Produire le PDF               | les livrables | `src/deliverables/`       |

Le moteur ne connaît ni l'API, ni la base, ni le multi-tenant. Il ne sait même pas qu'il tourne dans un serveur.

---

## Le contrat, aujourd'hui

Trois types dans `contract.ts`, volontairement minimaux :

| Type                 | Rôle                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------- |
| `PeriodePaie`        | L'année et le mois traités. Le Maroc raisonne en mois civil : ni semaine, ni quinzaine |
| `EntreeCalculPaie`   | Tout ce dont le moteur a besoin. Ce qui n'y figure pas n'existe pas pour lui           |
| `ResultatCalculPaie` | Ce que le moteur rend                                                                  |
| `MoteurDePaie`       | La signature : `(entree: EntreeCalculPaie) => ResultatCalculPaie`                      |

Notez ce qui **n'apparaît pas** dans la signature : aucun client de base, aucun service, **aucune `Promise`**. Le calcul est synchrone. S'il devenait asynchrone, ce serait le signe qu'il attend quelque chose de l'extérieur — donc qu'il n'est plus pur.

Les champs métier (salaire de base, rubriques, absences, barème d'IR, cotisations) seront ajoutés **module par module**. Ce qui est figé dès maintenant, c'est la **forme** : des données en entrée, un résultat en sortie, rien d'autre.

---

## Tous les montants sont des `Decimal`

Dans `ResultatCalculPaie`, les montants sont typés `Decimal` (de `decimal.js`), jamais `number`.

En virgule flottante, `0.1 + 0.2` vaut `0.30000000000000004`. Répercuté sur des cotisations, cumulé sur douze mois et des centaines de salariés, l'écart devient un écart déclaratif vis-à-vis de la CNSS ou de la DGI.

Les arrondis sont toujours **explicites** : nombre de décimales et mode d'arrondi précisés à chaque fois. Jamais d'arrondi implicite.

---

## Ce qui est interdit dans ce dossier

```ts
// INTERDIT — accès à la base
import { PrismaService } from '../common/prisma/prisma.service.js';

// INTERDIT — dépendance au framework
import { Injectable } from '@nestjs/common';

// INTERDIT — lecture de l'horloge : le résultat cesse d'être reproductible
const maintenant = new Date();

// INTERDIT — lecture de l'environnement
const taux = process.env.TAUX_CNSS;

// INTERDIT — asynchrone : le moteur attendrait quelque chose de l'extérieur
async function calculer() {
  /* … */
}

// INTERDIT — virgule flottante sur un montant
const cotisation = brut * 0.0448;
```

Si vous avez besoin d'une de ces choses, **le besoin est réel mais la place est mauvaise** : il appartient au module appelant, qui rassemblera la donnée et la passera en entrée.

---

## Pour ajouter une règle de calcul, plus tard

1. Étendre `EntreeCalculPaie` avec les données nécessaires — le moteur ne va rien chercher lui-même.
2. Étendre `ResultatCalculPaie` avec ce qui est produit.
3. Écrire la fonction de calcul, pure, dans un fichier dédié de ce dossier.
4. Écrire les tests **avant ou en même temps** : une règle de paie non testée est une règle non livrable.
5. Faire appeler le moteur par le module métier concerné, qui se charge de la lecture et de l'écriture en base.
6. Ajouter un brouillon d'article dans `/base-de-connaissance` si la règle est visible par l'utilisateur.
