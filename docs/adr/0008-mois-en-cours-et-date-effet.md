# ADR 0008 — `moisEnCours` et date d’effet non saisie

- **Statut :** accepté
- **Date :** 2026-08-29
- **Portée :** historisation fiche société / établissement
- **Complète :** [0006-historisation-par-mois-effet.md](./0006-historisation-par-mois-effet.md)

---

## Contexte

L’ADR 0006 a fixé l’historisation par `moisEffet` en texte `AAAA-MM`, sans saisie utilisateur. Il manquait le **champ source** de cette déduction.

---

## Décision

1. Ajouter `Company.moisEnCours` (`AAAA-MM`, obligatoire).
2. À la création de la société, l’initialiser à `moisDebutMontage`.
3. Toute écriture dans une table d’historique utilise `moisEnCours` comme `moisEffet`.
4. Si l’appelant fournit `moisEffet` dans un DTO → refus (`CHAMP_INTERDIT`).
5. **Aucun endpoint** ne fait avancer `moisEnCours` dans cette étape : ce sera le module 2 (traitement du mois).
6. La date d'effet reste déduite du mois en cours du dossier, sauf pour la **première version** d'un bloc historisé porté par un emploi, qui prend le mois de la date de début de cet emploi. Les versions suivantes suivent la règle générale. Les blocs portés par le salarié suivent la règle générale sans exception.

---

## Pourquoi l’utilisateur ne saisit pas la date d’effet

- Évite les effets « dans le futur » ou mal datés qui corrompent les recalculs.
- Aligne l’écriture sur le **présent opérationnel** du dossier (le mois de paie en cours), pas sur le calendrier du jour de saisie.
- Simplifie l’écran : un paramètre modifié « maintenant » s’applique au mois en cours, point.

---

## Conséquences

- Tant que le module 2 n’existe pas, `moisEnCours` reste figé après création (sauf seed de démo).
- Les lectures `?mois=AAAA-MM` continuent de résoudre la bonne ligne historique (y compris les mois passés).

---

## Alternatives rejetées

| Alternative | Motif |
| --- | --- |
| Champ date d’effet saisi | Contredit la décision V1 de la spec |
| Utiliser la date système | Décale les dossiers en retard de saisie |
| Endpoint PATCH moisEnCours dès 1.1.b | Empiète sur le module traitement du mois |
