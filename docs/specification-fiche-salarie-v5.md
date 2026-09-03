# PaymaRH — Spécification de la fiche salarié (v5, figée)

> Version Markdown de `PaymaRH_Fiche_salarie_v5.xlsx`, traduction technique du prompt Cursor 2.1.a.
> **Ce document fait foi en cas de divergence avec toute autre source.**

---

## Périmètre de l'étape 2.1.a (modèle de données uniquement)

### À faire

1. Schéma Prisma complet de la fiche salarié
2. Migration
3. Seed des référentiels (`docs/referentiels-fiche-salarie.md`)
4. Tests unitaires et d'intégration
5. Documentation (ce fichier, ADR 0011, amendement ADR 0008)

### Hors périmètre

- Aucun endpoint, contrôleur, service NestJS
- Aucun écran, composant front
- Aucun contrôle de saisie, validation métier, alerte
- Aucun calcul, méthode de calcul, résolution d'héritage
- Aucune table de primes, natures, services, départements, grilles horaires
- Aucun référentiel national (SMIG, durée légale, barèmes)
- Ne pas toucher à `payroll-engine/`
- Ne pas modifier les modèles existants du module 1 sans accord

---

## Principes d'architecture

1. **API d'abord** — ici, couche données seulement
2. **Moteur de paie pur et isolé** — `payroll-engine/` reste vide
3. **Double isolation multi-tenant** — `Account → Company → Salarié`
4. **Super-admin hors hiérarchie** — non concerné
5. **Décimal exact** — montants et durées en `Decimal` Prisma ; `parseFloat`, `Number.parseFloat`, `Math.round` interdits
6. **Livrables = monde à part** — non concerné
7. **Étanchéité de l'information** — aucune contrainte ne traverse la frontière d'une société
8. **Tout côté serveur** — non concerné ici

Conventions : technique en anglais, termes métier réglementaires en français (`salarie`, `emploi`, `cotisation`, `etablissement`). `Company` reste en anglais.

---

## Règles de stockage impératives

### Champs déduits — AUCUNE colonne en base

| Valeur                             | Se déduit de                                   |
| ---------------------------------- | ---------------------------------------------- |
| Type de pièce d'identité           | Nationalité                                    |
| Date de sortie du salarié          | Clôture du dernier emploi ouvert               |
| État du salarié (actif / inactif)  | Existence d'un emploi ouvert                   |
| Solde restant d'un prêt            | Montant total, mensualité, échéances prélevées |
| Durée du travail dans l'autre base | Durée stockée et base de saisie                |
| Période d'essai — durée            | Date de début emploi et date fin d'essai       |
| Nombre de personnes à charge       | Lignes cochées « à charge »                    |

### Types

- Montants, durées en heures, pourcentages : `Decimal`
- Mois de paie et mois d'effet : `String` `AAAA-MM` (ADR 0006)
- Identifiants légaux : `String` (matricule, pièce, CNSS, CIMR, RIB, IBAN, BIC, code postal)
- Dates civiles : `DateTime` date seule

### Nullabilité et héritage

Un champ héritable est **toujours nullable** en base. `null` = hérité du niveau supérieur.

Champs héritables : `dureeContractuelle`, `repartitionHoraireRef`, `reposHebdomadaire`, `teletravailAutorise`, `teletravailIndemniteVersee`, `teletravailMontant`.

**Exception** : `suivreJoursFeriesEtablissement` (booléen non nullable, défaut `true`).

### Aucune valeur de remplacement

Pas de « À compléter », « N/A », « inconnu ».

---

## Structure d'ensemble

```
Company (existant)
  └── Salarie
        ├── PersonneACharge          (N, historisé)
        ├── CompteBancaireSalarie    (N)
        ├── Pret                     (N, historisé)
        ├── SaisieSurSalaire         (N, historisé)
        └── Emploi                   (N)
              ├── EmploiContratVersion
              ├── EmploiRemunerationVersion
              ├── EmploiAffectationVersion
              ├── PrimeContractuelle
              ├── AvantageEnNature
              ├── StatutParticulierLigne
              └── EmploiJourFerieTravaille
```

Pas d'objet « contrat » séparé : le type de contrat est un champ de l'emploi versionné.

Deux emplois peuvent coexister pour le même salarié, sans limite de nombre.

---

## Historisation (ADR 0011)

Cinq blocs : `CONTRAT`, `REMUNERATION`, `AFFECTATION_TEMPS_DE_TRAVAIL`, `PERSONNES_A_CHARGE`, `RETENUES`.

- Blocs scalaires → tables de versions (`moisEffet`)
- Lignes répétables → `moisEffetDebut` / `moisEffetFin`

Règle du `moisEffet` : déduit du mois en cours (ADR 0008), sauf **première version** d'un bloc porté par un emploi → mois de la date de début de l'emploi.

---

## Entités principales

### Salarie

Identité, coordonnées, identifiants légaux, dates d'entrée et d'ancienneté. Rattaché à `Company`.

Unicité par société : `matricule` (toujours), `numeroPiece` et `numeroCnss` (si non null).

### Emploi

`id`, `salarieId`, `numeroOrdre` (unique par salarié, jamais réutilisé).

### Versions emploi

- **EmploiContratVersion** — poste, dates, type contrat, essai, cadre, sortie
- **EmploiRemunerationVersion** — mode salaire, montant, paiement, télétravail héritable
- **EmploiAffectationVersion** — établissement, durée héritable, repos, fériés, télétravail

### Tables répétables salarié

- **PersonneACharge** — `situationHandicap` : seule donnée de santé (ENFANT uniquement)
- **CompteBancaireSalarie** — distinct du `CompteBancaire` société
- **Pret**, **SaisieSurSalaire** — bloc RETENUES

### Tables répétables emploi

- **PrimeContractuelle** — non historisée
- **AvantageEnNature** — historisée par validité temporelle
- **StatutParticulierLigne** — avec `origine` (`SAISIE_MANUELLE`, `PROPAGE_SOCIETE`)
- **EmploiJourFerieTravaille** — historisé

### Exception TAHFIZ

Exonération sociétale, pas statut saisi. Seul le champ `origine` est implémenté ici.

---

## Matricule

Fonction pure `calculerProchainMatricule` : retient le plus grand matricule commençant par le préfixe société (y compris supprimés/sortis passés en paramètre). Longueur paramétrée pour génération auto uniquement.

---

## Référentiels seedés

| Table              | Entrées                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| Pays               | 195 (Maroc en tête, Palestine libellé exact, pas de Sahara occidental) |
| TypeContrat        | 7                                                                      |
| MotifSortie        | 13                                                                     |
| StatutParticulier  | 1 (IDMAJ)                                                              |
| SituationFamiliale | 4                                                                      |
| LienParente        | 2                                                                      |

Réutilisés sans recréation : `Banque`, `JourFerie`.

---

## Enums

`Sexe`, `StatutCadre`, `ModeDeterminationSalaire`, `ModePaiement`, `BaseSaisieDuree`, `JourSemaine` (existant), `OrigineStatut`, `BlocHistorise`.

---

## Prochaines étapes

- **2.1.b** — API et services
- **2.1.c** — Écrans et contrôles de saisie
