---
title: 'Comprendre la fiche salarié dans PaymaRH'
slug: 'fiche-salarie'
description: 'Structure identité et emplois, matricule, état actif ou inactif, héritage du paramétrage établissement, historisation des modifications et règles de suppression dans PaymaRH.'
keywords:
  - fiche salarié
  - paie Maroc
  - matricule
  - emploi
  - contrat
  - personne à charge
  - héritage paramétrage
  - historisation
  - statut particulier
category: 'Fiches'
module: 'Module 2 — Fiches'
status: 'brouillon'
order: 2
date: '2026-09-03'
author: 'PaymaRH'
cover: ''
---

# Comprendre la fiche salarié

## À quoi ça sert

La fiche salarié est le dossier d'une personne au sein d'une société dans PaymaRH. Elle regroupe son identité, ses coordonnées, ses personnes à charge, ses comptes bancaires et ses retenues — autant d'informations qui suivent la personne quels que soient ses postes.

Elle porte aussi un ou plusieurs **emplois**. Chaque emploi correspond à une relation de travail distincte : un contrat, une rémunération, une affectation à un établissement. C'est sur cette base que seront produits les bulletins de paie, une fois le traitement du mois livré.

Comprendre cette structure — ce qui appartient à la personne, ce qui appartient à l'emploi, et comment PaymaRH enregistre les changements dans le temps — évite les fausses manipulations et les signalements de bugs.

## Comprendre la structure : identité et emplois

PaymaRH ne possède pas d'objet « contrat » séparé. Le type de contrat, les dates, le poste, la période d'essai et la sortie font partie de l'**emploi**, versionnés dans le temps. Transformer un CDD en CDI sur le même poste, c'est modifier le type de contrat **du même emploi** — le logiciel ne crée pas un second emploi.

### Ce qui appartient à la personne

- **Identité** : nom, prénom, sexe, date de naissance, nationalité, situation familiale.
- **Coordonnées** : adresse, contacts, personne à prévenir.
- **Identifiants légaux** : matricule, pièce d'identité, numéro CNSS, numéro CIMR. Le matricule, la pièce et le CNSS sont uniques au sein de la société.
- **Dates d'entrée et d'ancienneté** au niveau du dossier.
- **Personnes à charge**, **comptes bancaires**, **prêts** et **saisies sur salaire**.

Certaines valeurs affichées ne sont jamais saisies : le **type de pièce d'identité** se déduit de la nationalité ; le **nombre de personnes à charge** se déduit des lignes cochées « à charge ».

### Ce qui appartient à l'emploi

- **Contrat** : libellé de poste, dates de début et de fin, type de contrat, période d'essai, statut cadre, date et motif de sortie.
- **Rémunération** : mode de détermination du salaire, montant, mode de paiement, paramètres de télétravail.
- **Affectation et temps de travail** : établissement, durée contractuelle, repos hebdomadaire, jours fériés travaillés, télétravail.
- **Primes contractuelles**, **avantages en nature** et **statuts particuliers** rattachés à cet emploi.

Une prime contractuelle indique **quelle** prime s'applique et **quels mois** — pas combien. Le montant et le mode de calcul appartiendront au paramétrage des primes et aux éléments variables du mois, traités dans un module ultérieur.

Un salarié peut cumuler **plusieurs emplois** en parallèle, y compris dans des établissements différents. Chaque emploi a son propre contrat, sa rémunération et son affectation.

## Deux emplois simultanés

Lorsqu'une même personne occupe deux postes en même temps, PaymaRH conserve **une seule fiche** et **deux emplois distincts**. Le matricule, l'identité, les personnes à charge et les comptes bancaires restent communs.

**Ce que cela produit :**

- Deux contrats indépendants, chacun avec sa rémunération, son établissement et son paramétrage de temps de travail.
- Un seul **mois en cours** pour l'ensemble du dossier, déduit automatiquement de l'état des bulletins et des emplois. Les modifications portent sur ce mois, quel que soit l'emploi concerné.
- Une alerte possible si la somme des durées contractuelles de tous les emplois actifs dépasse le seuil légal — lorsque le référentiel national le fournit.

**Ce que cela ne produit pas :**

- Pas de seconde fiche salarié, pas de second matricule.
- Pas de fusion des deux relations en un seul contrat.
- Pas de blocage empêchant le chevauchement des périodes : deux emplois peuvent coexister aux dates qui se recoupent.

La production des bulletins pour chaque emploi sera traitée avec le module de traitement du mois.

## Le matricule

### Attribution automatique

Lors de la création d'une fiche, si le matricule n'est pas renseigné, PaymaRH en attribue un automatiquement selon les règles de numérotation de la société (préfixe et longueur définis sur la fiche société).

### Saisie libre

Si vous saisissez un matricule vous-même — par exemple lors d'une reprise de dossier — il est conservé tel quel. La longueur paramétrée sur la société ne s'applique qu'à la génération automatique.

### Pourquoi une valeur peut être refusée

PaymaRH peut refuser un matricule que vous venez de saisir, avec le message **« Cette valeur n'est pas disponible »**, alors qu'aucune fiche visible ne le porte.

Cela arrive lorsqu'une valeur a **déjà été attribuée** dans cette société, y compris à une fiche depuis supprimée. Un matricule identifie une personne dans les déclarations et les dossiers : il n'est jamais réattribué, même après suppression.

Le message est volontairement neutre : il ne dit pas si une fiche a existé, ni laquelle. Vérifiez votre saisie ; si elle est correcte, choisissez une autre valeur ou laissez le champ vide pour une attribution automatique.

La même valeur peut en revanche être utilisée dans **une autre société**, y compris du même compte.

Lors d'une **reprise de dossier**, seuls les matricules présents dans le dossier repris sont connus. Une valeur utilisée dans l'ancien logiciel puis retirée avant l'import n'est pas mémorisée : PaymaRH ne peut pas la reconstituer.

## L'état du salarié

Un salarié est **actif** ou **inactif**. Cet état n'est jamais saisi : il se déduit de la présence d'au moins un emploi **ouvert** — c'est-à-dire sans date de sortie.

La **date de sortie du salarié**, affichée au niveau du dossier, se déduit à son tour de la clôture du **dernier emploi ouvert**. Tant qu'un emploi reste ouvert, le salarié est actif, même si un autre emploi est déjà clos.

## L'héritage du paramétrage

Sur le temps de travail et le télétravail, **laisser un champ vide** signifie que le salarié suit le paramétrage de l'établissement (ou, à défaut, le niveau supérieur disponible). Ce n'est pas une information manquante : c'est un choix d'héritage.

La cascade est la suivante : valeur propre du salarié, puis établissement, puis valeur nationale lorsqu'elle existe (par exemple la durée légale du travail pour la durée hebdomadaire).

Le logiciel expose, pour chaque champ héritable, **la valeur effective** et **son origine** — par exemple « 44 h — établissement Casablanca ». Le champ propre reste vide tant que vous n'y saisissez rien ; c'est la valeur effective qui compte pour le calcul futur.

Si vous saisissez une valeur dans le champ, c'est cette valeur qui s'applique, et l'origine indique alors le niveau salarié.

Si aucun niveau ne fournit de valeur, PaymaRH n'en invente aucune.

Il n'existe pas d'action « tout hériter » : chaque champ vide hérite indépendamment.

### Exception : les jours fériés travaillés

Tant que l'option de suivi de l'établissement est active, la grille de l'établissement s'applique. Si vous désactivez ce suivi, le salarié porte **sa propre** liste de jours, même entièrement vide — ce n'est plus un héritage.

## L'historisation des modifications

Certaines rubriques de la fiche — contrat, rémunération, affectation, personnes à charge, prêts, saisies — sont **historisées**. PaymaRH conserve les valeurs passées pour permettre, plus tard, le recalcul fidèle des bulletins déjà produits.

Vous ne saisissez jamais de « date d'effet ». Le logiciel déduit seul le mois concerné à partir du **mois en cours** du salarié.

### Correction ou nouvelle ligne d'historique

Lorsque vous modifiez une rubrique historisée, le serveur décide seul :

- **Sans bulletin produit** pour le mois en cours → la modification **corrige la valeur en cours**. Aucune ligne d'historique supplémentaire n'apparaît.
- **Avec bulletin produit** pour le mois en cours → la modification **ouvre une nouvelle ligne d'historique** au mois en cours. L'ancienne valeur reste accessible pour les mois antérieurs.

Si vous modifiez plusieurs fois la même rubrique au cours d'un même mois où un bulletin existe déjà, seule la dernière valeur de ce mois est conservée.

### Modifier une donnée d'un mois déjà payé

Le mois en cours n'est pas le mois calendaire : il se calcule à partir de l'état des bulletins et des emplois. Lorsque les mois antérieurs sont déjà payés et clos, le mois en cours avance.

Une modification que vous enregistrez aujourd'hui porte donc sur le **mois en cours**, pas sur un mois déjà édité. Les bulletins passés retrouveront, lors d'un recalcul futur, les valeurs en vigueur à leur époque — grâce à l'historique.

Le détail du calcul du mois en cours et des états du bulletin sera traité avec le module de traitement du mois.

### Première version d'un emploi

Pour un emploi nouvellement créé, la première version de chaque bloc historisé (contrat, rémunération, affectation) est datée du **mois de la date de début** de cet emploi — et non du mois en cours du dossier.

## Les suppressions et les lignes inactives

### Fiche salarié

Une fiche peut être supprimée tant qu'**aucun bulletin de paie** n'a été produit pour ce salarié, sur tous ses emplois confondus. Dès qu'un bulletin existe, la suppression est refusée : la fiche reste en place. Cette règle protège l'historique de paie déjà calculé ou validé.

### Emploi

La suppression d'un emploi n'est possible que si aucun bulletin n'a été produit **pour cet emploi** — même si un autre emploi du même salarié a des bulletins.

### Personnes à charge, prêts et saisies

Quand une ligne a déjà servi à calculer un bulletin, la supprimer entièrement fausserait l'historique de paie. PaymaRH la **clôt** alors : elle reste visible avec l'état « inactive » et une date de fin.

**Point déroutant mais correct :** une personne à charge supprimée alors qu'un bulletin existe s'affiche inactive, mais **reste comptée** dans le nombre de personnes à charge du mois en cours. C'est voulu : le bulletin de ce mois a été produit avec cette personne à charge, et le recalcul doit retrouver la même situation. À partir du mois suivant, elle ne sera plus prise en compte.

Même logique pour les prêts et les saisies : une ligne close au mois en cours n'est plus opérationnelle pour les saisies futures, mais reste lisible pour le bulletin du mois en cours.

Sans bulletin antérieur, la ligne disparaît purement et simplement.

Certaines suppressions sensibles — notamment l'apparition d'une date de sortie là où il n'y en avait pas — demandent une confirmation explicite après un aperçu des conséquences. Le déroulé de cette confirmation sera décrit dans l'article consacré aux écrans.

## Alertes et blocages

PaymaRH distingue deux niveaux de réaction.

**Un blocage** refuse l'enregistrement. Rien n'est modifié. Exemples : matricule ou numéro CNSS déjà pris, date de fin antérieure à la date de début, somme des pourcentages de virement différente de 100 % lorsque plusieurs comptes sont renseignés, chevauchement de deux statuts particuliers sur le même emploi, tentative de modifier ou supprimer un statut propagé par la société, suppression d'une fiche ou d'un emploi alors qu'un bulletin existe.

**Une alerte** laisse passer l'enregistrement, mais signale une incohérence ou un risque. Exemples : homonymie avec un salarié actif, correspondance avec un salarié inactif (réembauche possible), date de sortie ou fin d'essai hors intervalle de l'emploi, salaire inférieur au SMIG, durée contractuelle totale excessive entre plusieurs emplois actifs, mensualité de prêt incohérente avec le montant et les échéances.

Certaines alertes — SMIG, durée légale, âge maximal d'un enfant à charge — ne s'affichent que lorsque le référentiel national est disponible. En leur absence, PaymaRH ne signale rien plutôt que d'émettre un avertissement faux.

Pourquoi certaines incohérences ne sont que signalées : une date de fin d'essai légèrement décalée ou un contact mal formé ne bloquent pas la saisie du dossier. C'est au gestionnaire de paie de juger s'il corrige ou s'il poursuit.

## Droits sur la rémunération

Un utilisateur peut avoir accès à la fiche d'un salarié sans voir les éléments de **rémunération** : montants, mode de paiement, primes, avantages en nature, coordonnées bancaires.

Dans ce cas, ces informations **n'apparaissent tout simplement pas** — ni masquées, ni remplacées par des valeurs vides. L'historique des versions obéit à la même règle : sans droit de lecture sur la rémunération, les montants et modes de paiement ne sont pas visibles.

Un utilisateur autorisé à consulter mais pas à modifier la rémunération ne peut pas non plus enregistrer de changement sur ces rubriques.

## Statuts particuliers propagés par la société

Certaines lignes de statut particulier sont **propagées depuis la société** — par exemple une exonération active au niveau de l'entreprise. Elles apparaissent sur la fiche de l'emploi mais ne peuvent ni être modifiées ni supprimées depuis le dossier salarié. Seule la société peut les retirer ou les ajuster.

Quand la société active une exonération qui se propage à l'effectif, ces lignes apparaissent **seules** sur les dossiers des salariés encore en poste — au moins un emploi ouvert. Les dossiers entièrement sortis n'en reçoivent pas.

Si la société retire ensuite l'exonération :

- une ligne jamais utilisée pour un bulletin **disparaît** ;
- une ligne déjà prise en compte dans un bulletin **reste visible**, close, pour que les bulletins passés restent explicables.

## Cas d'erreur

**« Cette valeur n'est pas disponible »** en saisissant un matricule, un numéro de pièce ou un numéro CNSS. Cette valeur a déjà été consommée dans la société, y compris par une fiche supprimée. Vérifiez votre saisie ; si elle est correcte, choisissez une autre valeur ou laissez le matricule vide pour une attribution automatique.

**La fiche ne peut pas être supprimée.** Un bulletin de paie a déjà été produit pour ce salarié. La fiche reste consultable ; seule la suppression est impossible.

**L'emploi ne peut pas être supprimé.** Un bulletin existe pour cet emploi, même si un autre emploi du même salarié n'a pas encore de bulletin.

**La somme des pourcentages de virement est refusée.** Lorsque le salarié est payé sur plusieurs comptes, la somme des parts doit faire exactement 100 %. Un seul compte suffit : aucun pourcentage n'est demandé (100 % implicite).

**Impossible de modifier ce statut particulier.** La ligne a été propagée par la société. Retirez ou ajustez l'exonération depuis la fiche société.

## Questions liées

- Comment créer et paramétrer une fiche société dans PaymaRH
- Comment fonctionne l'héritage du paramétrage société vers les fiches salariés
- Comprendre la différence entre alerte et blocage lors de la saisie
- Que faire en cas de réembauche d'un salarié inactif
- Comprendre le mois en cours et les états du bulletin de paie
