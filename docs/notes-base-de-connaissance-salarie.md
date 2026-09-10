# Notes — base de connaissance fiche salarié

> Accumulation en vue de l'article utilisateur. Point de vue utilisateur uniquement.
>
> **Article publié en brouillon :** `base-de-connaissance/fiche-salarie.md` (2026-09-03)
> Couvre les règles de gestion — pas l'interface. Voir ci-dessous ce qui reste pour l'article écrans.

---

## Repris dans l'article (fiche-salarie.md)

| Sujet des notes                                                                                   | Section de l'article                              |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Structure identité / emplois, pas d'objet contrat, CDD → CDI                                      | Comprendre la structure                           |
| Plusieurs emplois en parallèle                                                                    | Comprendre la structure + Deux emplois simultanés |
| Matricule vide, saisie libre, refus « non disponible », reprise                                   | Le matricule                                      |
| État actif/inactif déduit, date de sortie déduite                                                 | L'état du salarié                                 |
| Champs vides = héritage, valeur effective et origine, jours fériés, pas de « tout hériter »       | L'héritage du paramétrage                         |
| Correction vs historique, pas de date d'effet saisie, première version au mois de début d'emploi  | L'historisation des modifications                 |
| Suppression fiche / emploi / lignes, lignes inactives, personne à charge comptée au mois en cours | Les suppressions et les lignes inactives          |
| Alertes vs blocages (principe + exemples)                                                         | Alertes et blocages                               |
| Droits rémunération : absent, pas masqué                                                          | Droits sur la rémunération                        |
| Statuts propagés société, apparition seule, retrait                                               | Statuts particuliers propagés                     |
| Primes contractuelles sans montant                                                                | Comprendre la structure (mention brève)           |
| Répartition virement 100 %                                                                        | Cas d'erreur                                      |
| Confirmation date de sortie (règle métier uniquement)                                             | Les suppressions (renvoi article écrans)          |

---

## En attente de l'article écrans (2.1.c)

Ces sujets dépendent de l'interface ou du déroulé utilisateur ; ils ne figurent pas dans l'article règles de gestion.

### Personnes à charge — suppression immédiate vs modification différée

- **Modifier ou ajouter** une personne à charge ne part qu'au clic **Enregistrer** (comme les rubriques d'identité). La saisie reste locale jusqu'à validation globale.
- **Supprimer** une ligne déjà enregistrée part **immédiatement** après confirmation : elle n'attend pas Enregistrer. Le numéro de version de la fiche est mis à jour tout de suite.
- Si la ligne a déjà servi à un bulletin, elle ne disparaît pas : elle devient **inactive** avec un mois de fin, grisée à l'écran, pour que les bulletins passés restent explicables.
- Les autres modifications non enregistrées de la même rubrique restent à enregistrer après une suppression immédiate.

### Prêts — modification différée, suppression immédiate

- **Modifier ou ajouter** un prêt ne part qu'au clic **Enregistrer**, ligne par ligne (modifications puis ajouts, ordre d'affichage).
- **Supprimer** une ligne enregistrée part **immédiatement** après confirmation (aperçu serveur + jeton), comme les personnes à charge.
- Le **solde restant** est calculé par le serveur et affiché tel quel ; sur une ligne modifiée localement non encore enregistrée, la cellule solde est **vide**.
- Une alerte non bloquante (mensualité × échéances ≠ montant total) s'affiche sous le champ mensualité après enregistrement ; la ligne est bien enregistrée.

### Saisies sur salaire — deux formes, modification différée

- **Type de saisie** : liste alimentée par le référentiel (`Pension alimentaire`, `Saisie à tiers détenteur`). Le formulaire n'affiche que les champs du type choisi ; l'écran n'envoie jamais un champ de l'autre forme.
- **Pension alimentaire** : montant mensuel obligatoire, mois de fin facultatif (vide = pension sans terme).
- **Saisie à tiers détenteur** : montant total obligatoire.
- Au changement de type alors qu'un montant de l'autre forme est saisi, un **avertissement d'écran** prévient de l'abandon à l'enregistrement ; les valeurs restent en local tant que la ligne n'est pas enregistrée (revenir au type précédent les fait réapparaître).
- **Supprimer** une ligne enregistrée : confirmation immédiate comme les autres tableaux historisés.

### Navigation et interaction

- **Créer un salarié** — depuis la liste, le bouton n'apparaît que si l'on a le droit de créer. Il ouvre l'écran « Nouveau salarié », pas une fiche vide.
- L'écran reprend les **quatre blocs d'identité** de la fiche, dans le même ordre : Identité, Identifiants et immatriculations, Coordonnées, Dates clés. On n'y saisit ni emploi, ni personne à charge, ni prêt : on crée, on arrive sur la fiche, on complète ensuite.
- **Matricule** : le champ est visible et facultatif. Une phrase sous le champ indique de le laisser vide pour une attribution automatique. Si l'on reprend un plan de matricules d'un logiciel précédent, on le saisit ici.
- **Date de sortie** et **état actif/inactif** : absents. Ce n'est pas grisé : il n'y a rien à saisir, le serveur les déduira plus tard.
- **Créer le salarié** (libellé volontairement distinct d'« Enregistrer ») : un seul envoi. En cas de succès, on arrive sur la fiche du salarié, y compris si le serveur a signalé une alerte (homonyme, réembauche, format de contact…). L'alerte s'affiche alors à sa place habituelle, sous le champ concerné ou en tête du bloc Identité.
- Si le serveur **refuse** la création, rien n'est créé. La saisie reste à l'écran. Un refus rattaché à un champ s'affiche sous ce champ ; un refus sans champ s'affiche en tête du bloc Identité.
- **Annuler** vide le formulaire. On ne change pas d'écran, rien n'est envoyé.
- Un lien **Retour à la liste** ramène à la liste des salariés.

- **Modification simultanée d'une fiche** — rechargement obligatoire si la fiche a changé entre-temps (If-Match).
- **Confirmation des opérations sensibles** — déroulé aperçu → jeton → confirmation ; jeton périmé si le dossier a changé entre l'aperçu et la confirmation.
- **Alerte de réembauche** — ouverture de la fiche existante depuis l'alerte ; ce que l'utilisateur voit et décide.
- **Date de sortie** — écran de confirmation lors de la première saisie d'une date de sortie (pas lors d'une modification ou d'une effacement ultérieur).

### Comptes bancaires — PUT groupé, répartition, suppression différée (temps 2.b)

- **Un seul enregistrement** remplace toute la liste des comptes ; pas d'appels ligne par ligne.
- **Répartition du virement** : avec un seul compte, le serveur force la part à vide (totalité du virement) ; avec plusieurs comptes, la somme des parts doit être 100 %.
- **Alertes par position** : une alerte peut cibler la 2e ligne du tableau envoyé (`indexLigne`), pas un identifiant.
- **Suppression différée** : retirer une ligne déjà enregistrée ne part qu'au prochain Enregistrer ; Annuler de la fiche la restaure.
- **Droits** : sans `salarie.remuneration.lire`, la rubrique est absente ; sans `ecrire`, lecture seule.

### Affichage et libellés

- Libellés exacts des boutons, rubriques et messages à l'écran.
- Présentation de la valeur héritée (champ vide + valeur effective en grisé).
- Affichage des alertes vs blocages (bandeau, liste, couleurs).
- Masquage rémunération côté interface (adaptation des écrans).

### Bulletin et mois en cours (complément)

- **États d'un bulletin de paie** — non calculable, calculable, calculé, validé, édité (détail pour le gestionnaire).
- **Mois en cours** — cascade complète (bulletins calculés, édités, emplois actifs, calendrier Maroc).
- Conséquences visibles à l'écran quand on modifie une rubrique selon l'état du bulletin du mois.

### Saisie et formulaires

- Création d'un salarié — écran dédié (voir notes ci-dessous).
- Création d'une fiche pas à pas.
- Création et modification d'un emploi pas à pas.
- Saisie des personnes à charge, prêts, saisies, comptes bancaires.
- Répartition du virement — interaction formulaire (un compte vs plusieurs).
- Primes contractuelles — sélection du code et des mois.

### Cas d'erreur écran par écran

- Messages exacts et marche à suivre pour chaque écran (complément de la section Cas d'erreur de l'article règles).

---

## Notes brutes (archive)

Les sections ci-dessous reprennent le contenu initial des cinq prompts de développement, conservé pour référence.

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
