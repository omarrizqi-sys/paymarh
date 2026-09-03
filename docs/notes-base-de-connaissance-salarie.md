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

---

## Matricule laissé vide à la création

Lors de la création d'une fiche, si le matricule n'est pas renseigné, le logiciel en attribue un automatiquement selon les règles de numérotation de la société. Si vous saisissez un matricule vous-même (par exemple lors d'une reprise de dossier), il est conservé tel quel.

---

## Matricule refusé alors qu'il semble libre

Le logiciel peut refuser un matricule que vous venez de saisir, avec le message **« Cette valeur n'est pas disponible »**, alors qu'aucune fiche visible ne le porte.

Cela arrive lorsqu'une valeur a **déjà été attribuée** dans cette société, y compris à une fiche depuis supprimée. Un matricule identifie une personne dans les déclarations et les dossiers : il n'est jamais réattribué, même après suppression.

Le message est volontairement neutre : il ne dit pas si une fiche a existé, ni laquelle. Vérifiez votre saisie ; si elle est correcte, choisissez une autre valeur ou laissez le champ vide pour une attribution automatique.

La même valeur peut en revanche être utilisée dans **une autre société**, y compris du même compte.

Lors d'une **reprise de dossier**, seuls les matricules présents dans le dossier repris sont connus. Une valeur utilisée dans l'ancien logiciel puis retirée avant l'import n'est pas mémorisée : le logiciel ne peut pas la reconstituer.

---

## Alerte de réembauche

Lors de la création ou de la vérification d'une fiche, le logiciel peut signaler qu'un **salarié inactif** de la même société correspond déjà (même pièce d'identité, ou à défaut même nom, prénom et date de naissance). L'alerte permet d'ouvrir la fiche existante pour la consulter.

**Ce que l'alerte ne fait pas :** elle ne crée aucun emploi, ne réactive personne et n'enregistre aucune donnée. C'est à vous de décider si vous poursuivez la création ou si vous rouvrez le dossier existant pour y ajouter un nouvel emploi.

---

## Suppression d'une fiche salarié

Une fiche peut être supprimée tant qu'**aucun bulletin de paie** n'a été produit pour ce salarié (sur tous ses emplois). Dès qu'un bulletin existe, la suppression est refusée : la fiche reste en place. Cette règle protège l'historique de paie déjà calculé ou validé.

---

## Emplois et historique

Un salarié peut cumuler **plusieurs emplois** en parallèle (y compris dans des établissements différents). Chaque emploi a son propre contrat, sa rémunération et son affectation.

Quand vous modifiez une rubrique (contrat, rémunération, temps de travail), le logiciel enregistre la nouvelle valeur. Selon l'état de la paie du mois, il **corrige la ligne en cours** ou **conserve l'ancienne valeur dans l'historique** et ouvre une nouvelle ligne pour le mois de paie courant. Vous n'avez pas à choisir : le serveur décide seul. Vous ne saisissez jamais de « date d'effet ».

**Transformer un CDD en CDI** sur le même poste, c'est modifier le type de contrat **du même emploi** — le logiciel ne crée pas un second emploi.

**Date de sortie** : lorsque vous renseignez une date de sortie là où il n'y en avait pas, une **confirmation explicite** est demandée (comme pour une suppression sensible). Changer le poste sans toucher à la sortie ne demande rien. Modifier ou effacer une date de sortie déjà enregistrée ne redemande pas de confirmation.

La **suppression d'un emploi** n'est possible que si aucun bulletin n'a été produit **pour cet emploi** — même si un autre emploi du même salarié a des bulletins.

Sans droit de voir la rémunération, les montants et modes de paiement **n'apparaissent pas** — y compris dans l'historique des versions.

---

## Personnes à charge et lignes « inactives »

Quand une ligne de prêt, de saisie ou de personne à charge a déjà servi à calculer un bulletin, la supprimer entièrement fausserait l'historique de paie. Le logiciel la **clôt** alors : elle reste visible avec l'état « inactive » et une date de fin, pour que les bulletins passés restent explicables.

---

## Répartition du virement sur plusieurs comptes

Si le salarié est payé sur plusieurs comptes, la somme des pourcentages doit faire **exactement 100 %**. C'est la seule façon de garantir que la totalité du net à payer est répartie sans reste ni excédent.

Un seul compte suffit : aucun pourcentage n'est demandé (100 % implicite).

---

## Primes contractuelles sans montant

Une prime rattachée à l'emploi indique **quelle** prime s'applique et **quels mois** — pas combien. Le montant et le mode de calcul appartiennent au paramétrage des primes et aux éléments variables du mois.

---

## Statuts particuliers non modifiables

Certaines lignes de statut particulier sont **propagées depuis la société** : elles apparaissent sur la fiche mais ne peuvent ni être modifiées ni supprimées depuis le dossier salarié. Seule la société peut les retirer ou les ajuster.

Quand la société active une exonération qui se propage à l'effectif, ces lignes apparaissent **seules** sur les dossiers des salariés encore en poste (au moins un emploi ouvert). Les dossiers entièrement sortis n'en reçoivent pas. Si la société retire ensuite l'exonération, une ligne jamais utilisée pour un bulletin disparaît ; une ligne déjà prise en compte dans un bulletin reste visible, close, pour que les bulletins passés restent explicables.

---

## Champs laissés vides et valeurs héritées

Sur le temps de travail et le télétravail, **laisser un champ vide** signifie que le salarié suit le paramétrage de l'établissement (ou, à défaut, le niveau supérieur disponible). Ce n'est pas une information manquante : c'est un choix d'héritage.

À l'écran, la valeur propre vide reste vide. À côté (ou en grisé), le logiciel montre **la valeur effective** et **d'où elle vient** — par exemple « 44 h — établissement Casablanca ». Si vous saisissez une valeur dans le champ, c'est cette valeur qui s'applique, et l'origine indique alors le niveau salarié.

Si aucun niveau ne fournit de valeur, le logiciel n'en invente aucune.

**Jours fériés travaillés :** tant que l'option de suivi de l'établissement est active, la grille de l'établissement s'applique. Si vous désactivez ce suivi, le salarié porte **sa propre** liste de jours, même entièrement vide — ce n'est plus un héritage.

Il n'existe pas d'action « tout hériter » : chaque champ vide hérite indépendamment.
