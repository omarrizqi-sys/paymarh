# ADR 0005 — Nommage français des modèles métier

- **Statut :** accepté
- **Date :** 2026-08-29
- **Portée :** module 1 et suivants (modèles métier réglementaires)

---

## Contexte

Le module 0 a introduit le socle multi-tenant en anglais technique : `Account`, `Company`, `User`, `AuditLog`. C’est cohérent avec NestJS, Prisma et les conventions d’API HTTP.

Dès le module 1 apparaissent des concepts issus du droit social et fiscal marocain : établissement, exonération, jour férié, type d’heure, et plus tard bulletin, cotisation CNSS, IR, etc.

Deux tentations opposées se présentent :

1. Tout angliser (`Establishment`, `Holiday`, `PayrollSlip`) pour « homogénéiser » le schéma Prisma.
2. Tout franciser, y compris `Company` → `Societe`, en cassant le module 0 déjà poussé sur `main`.

Le porteur du projet n’a pas de formation technique mais lit le métier : le modèle doit rester parlable pour un expert-comptable, pas seulement pour un développeur.

---

## Décision

**Anglais pour le socle technique et l’infrastructure. Français (sans accent dans les identifiants) pour les modèles et champs métier réglementaires.**

Conséquences concrètes au module 1 :

| Conservé (anglais) | Nouveau (français métier) |
| --- | --- |
| `Company`, `Account`, `User` | `Etablissement`, `CompteBancaire`, `JourFerie` |
| `createdAt`, `accountId` | `TypeHeure`, `TypeExoneration`, `FormeJuridique`, `Banque` |
| Index, UUID, migrations | `raisonSociale`, `codeDossier`, `moisEffet`, `jourReposHebdomadaire` |

`Company` **n’est pas renommé**. C’est un héritage assumé du module 0. Le renommer casserait l’API de démonstration, les types partagés (`@paymarh/shared-types`), les tests d’isolation multi-tenant et l’historique Git, pour un gain purement cosmétique.

Les commentaires, la documentation et les articles de la base de connaissance restent en **français accentué**. Seuls les identifiants de code perdent les accents (`etablissement`, pas `établissement`) pour éviter les pièges d’encodage entre systèmes.

---

## Pourquoi

1. **Lien avec la réglementation.** `cotisationCNSS` désigne un objet juridique précis, avec ses taux et plafonds. `socialContribution` n’en désigne aucun. Traduire, c’est perdre le fil du texte de loi.
2. **Règle déjà écrite.** `docs/CONVENTIONS.md` impose ce mixte depuis le module 0. Cet ADR fige son application aux *noms de modèles* Prisma, pas seulement aux champs TypeScript.
3. **Stabilité du socle.** Le module 0 est validé et poussé. On n’y touche pas sans nécessité métier.
4. **Relecture humaine.** PaymaRH est piloté par IA : un schéma que le porteur peut relire en français métier réduit le risque qu’une erreur passe inaperçue.

---

## Conséquences

- Les modules suivants (salarié, bulletin, déclarations) suivront le français réglementaire pour tout nouveau modèle.
- Les développeurs et l’IA doivent résister au réflexe de traduction (`employee` → interdit ; écrire `salarie`).
- Une légère hétérogénéité `Company` / `Etablissement` est **acceptée** et documentée ici : ce n’est pas une dette à « corriger plus tard », c’est la règle du produit.

---

## Alternatives rejetées

| Alternative | Motif de rejet |
| --- | --- |
| Tout anglais | Perte du lien réglementaire ; relecture métier impossible. |
| Renommer `Company` en `Societe` | Casse le module 0 pour un gain esthétique. |
| Doublons (`Company` + alias `Societe`) | Deux noms pour une table ; confusion garantie. |
| Français avec accents dans les identifiants | Risques d’encodage Git / OS / ORM. |
