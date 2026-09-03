# Notes — base de connaissance fiche salarié

> Accumulation en vue de l'article utilisateur. Point de vue utilisateur uniquement.

---

## États d'un bulletin de paie

Chaque mois de paie d'un salarié se trouve dans l'une de ces situations :

- **Non calculable** — les informations nécessaires ne sont pas encore complètes ; aucun bulletin n'existe pour ce mois.
- **Calculable** — le dossier permet un calcul, mais aucun bulletin n'a encore été produit.
- **Calculé** — un bulletin a été généré et peut encore être modifié ou recalculé.
- **Validé** — le bulletin est figé pour ce mois ; il sert de référence officielle.
- **Édité** — le bulletin a été imprimé ou transmis ; le mois est clos côté paie.

Seuls les trois derniers correspondent à un bulletin réellement présent dans le dossier.

---

## Mois en cours

Le **mois en cours** d'un salarié est le mois de paie sur lequel portent les prochaines modifications (nouvelle version de contrat, changement d'affectation, etc.). Il se déduit automatiquement de l'état des bulletins et des emplois ; on ne le saisit pas à la main.

---

## Modification simultanée d'une fiche

Si deux personnes ouvrent la même fiche et enregistrent l'une après l'autre, la seconde personne est informée que la fiche a changé entre-temps. Elle doit **recharger** la fiche et réappliquer sa modification. Ainsi, une saisie n'écrase jamais silencieusement le travail de l'autre.

---

## Droits sur la rémunération

Un utilisateur peut avoir accès à la fiche d'un salarié sans voir les éléments de **rémunération** (montants, mode de paiement, primes, avantages en nature, coordonnées bancaires). Dans ce cas, ces informations **n'apparaissent tout simplement pas** à l'écran — ni masquées, ni remplacées par des valeurs vides. L'interface s'adapte aux droits de chaque utilisateur.

Un utilisateur autorisé à consulter mais pas à modifier la rémunération ne peut pas non plus enregistrer de changement sur ces rubriques.

---

## Confirmation des opérations sensibles

Certaines actions (notamment les suppressions à impact large) demandent une **confirmation explicite** après un aperçu des conséquences. Si le dossier a changé entre l'aperçu et la confirmation, l'opération est suspendue : il faut relancer l'aperçu.
