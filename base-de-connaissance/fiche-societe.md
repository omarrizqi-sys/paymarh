---
title: "Créer et paramétrer une fiche société dans PaymaRH"
slug: "fiche-societe"
description: "Comment créer une société dans PaymaRH, renseigner ses identifiants légaux, déclarer ses établissements, paramétrer la durée du travail et les informations bancaires."
keywords:
  - fiche société
  - paie Maroc
  - ICE
  - identifiant fiscal
  - établissement
  - durée hebdomadaire
  - jours fériés Maroc
  - repos hebdomadaire
category: "Fiches"
module: "Module 1 — Fiches"
status: "brouillon"
order: 1
date: "2026-08-29"
author: "PaymaRH"
cover: ""
---

# Créer et paramétrer une fiche société

## À quoi ça sert

La fiche société est le point de départ de tout dossier de paie dans PaymaRH. Elle contient l'identité légale de l'entreprise, ses lieux d'exploitation, ses règles de temps de travail et ses coordonnées bancaires.

Elle joue aussi un second rôle, moins visible mais important : elle **sert de modèle aux fiches salariés**. Plusieurs paramètres — durée hebdomadaire, horaires, jour de repos, jours fériés travaillés, télétravail — descendent automatiquement sur les salariés qui choisissent de suivre le paramétrage de leur établissement. Vous ne saisissez donc l'information qu'une fois.

Une fiche société bien remplie évite de reprendre chaque salarié un par un.

## Comprendre la structure : société et établissement

PaymaRH distingue deux niveaux, et cette distinction gouverne toute la fiche.

La **société** est la personne morale. Elle porte ce qui est unique : la raison sociale, la forme juridique, l'identifiant fiscal, le registre de commerce, l'employeur signataire, les coordonnées bancaires.

L'**établissement** est le lieu d'exploitation. Il porte ce qui peut varier d'un site à l'autre : l'adresse, l'ICE, la taxe professionnelle, la durée du travail, les horaires, les jours fériés travaillés, le télétravail.

Un établissement principal est créé automatiquement avec la société. Vous pouvez en ajouter autant que nécessaire. Un établissement secondaire ne redemande jamais la raison sociale ni l'identifiant fiscal : ces informations appartiennent à la société.

## Pas-à-pas

### 1. Renseigner l'état du dossier

Trois états sont possibles.

**En montage** : vous ressaisissez l'historique pour reconstituer les cumuls. Aucun bulletin définitif ne peut être produit.

**En production** : PaymaRH produit les bulletins.

**Inactive** : la société existe toujours et reste consultable et modifiable, mais aucun bulletin postérieur à la date d'inactivité ne peut être produit.

Deux mois sont demandés :

- le **mois de début de montage**, à partir duquel vous ressaisissez l'historique ;
- le **mois de début de production**, premier mois réellement traité par PaymaRH.

Si vous démarrez sans reprise d'historique, indiquez le même mois dans les deux champs. Le mois de montage ne peut jamais être postérieur au mois de production.

### 2. Identifier la société

Le **code dossier** est votre référence interne. Il est obligatoire et unique. Dans un cabinet, il sert à retrouver rapidement chaque société cliente.

La **raison sociale** et la **forme juridique** sont obligatoires.

Les identifiants légaux — identifiant fiscal, registre de commerce et son tribunal — sont facultatifs à la création, mais nécessaires avant de produire des déclarations. Ils sont enregistrés tels que vous les saisissez : les zéros de tête sont conservés.

Le **régime de base** est le régime général, non agricole. Attention : une fois qu'un salarié existe, ce champ ne peut plus être modifié. Vérifiez-le avant de saisir votre premier salarié.

### 3. Déclarer les établissements

L'établissement principal est déjà créé. Complétez son nom, son adresse, sa ville, son ICE et sa taxe professionnelle.

Le nom de l'établissement est obligatoire : c'est lui qui apparaît dans les listes déroulantes quand vous affecterez vos salariés. La ville est proposée par défaut.

L'ICE et la taxe professionnelle sont propres à chaque établissement. Ne recopiez pas ceux du siège sur un site secondaire.

Si votre siège déménage, vous pouvez désigner un autre établissement comme principal. L'ancien devient un établissement ordinaire.

### 4. Paramétrer le temps de travail

La **durée hebdomadaire** est fixée à 44 heures par défaut.

Le **repos hebdomadaire** est un seul jour, dimanche par défaut. C'est le jour qui déclenche les majorations renforcées.

Une confusion fréquente mérite d'être levée : si votre entreprise ferme aussi le samedi, ne le déclarez pas en repos hebdomadaire. Indiquez simplement 0 heure au samedi dans la grille horaire. Un jour non travaillé n'a pas le même statut légal que le repos hebdomadaire.

La **grille horaire** répartit les heures sur la semaine, en distinguant heures normales et heures majorées. Le total mensuel se déduit de l'hebdomadaire avec le coefficient 52/12, arrondi à l'unité supérieure. Vous pouvez le modifier, ou saisir directement les heures mensuelles.

### 5. Cocher les jours fériés travaillés

La liste présente les onze fêtes civiles à date fixe et les sept journées religieuses. Cochez uniquement ceux que votre établissement travaille.

Les fêtes religieuses suivent le calendrier lunaire. Vous n'avez pas de date à saisir : PaymaRH s'en charge.

### 6. Saisir les informations bancaires

Pour chaque compte, indiquez la banque, le RIB, éventuellement l'IBAN et le BIC.

Précisez l'**usage** de chaque compte : salaires, cotisations sociales, impôt sur le revenu. Un même compte peut porter les trois. Beaucoup d'entreprises préfèrent séparer le paiement des salaires de celui des cotisations.

Si vous avez plusieurs établissements, indiquez lesquels utilisent ce compte.

Un compte fermé se met en **clôturé** plutôt que supprimé : il reste consultable pour les bulletins déjà produits.

### 7. Paramétrer les matricules

Le **préfixe** s'ajoute devant les matricules générés automatiquement. La **longueur** détermine le remplissage par zéros : avec une longueur de 5, le premier matricule sera 00001.

Cette longueur ne s'applique qu'à la génération automatique. Si vous saisissez un matricule à la main, vous êtes libre de son format — ce qui permet de reprendre les matricules d'un ancien logiciel.

Un matricule n'est jamais réutilisé, même après la suppression d'un salarié.

## Cas d'erreur

**« Cette valeur n'est pas disponible »** en saisissant un code dossier, un identifiant fiscal ou un ICE. Cette valeur existe déjà ailleurs. Pour des raisons de confidentialité, PaymaRH n'indique pas où. Vérifiez votre saisie ; si elle est correcte, rapprochez-vous de l'administrateur de votre compte.

**Le mois de montage est refusé.** Il ne peut pas être postérieur au mois de début de production. Si vous ne reprenez pas d'historique, indiquez le même mois dans les deux champs.

**Le régime de base ne peut plus être modifié.** Des salariés existent déjà. Contactez l'assistance PaymaRH.

**Un chiffre est refusé dans un champ de nom.** Les champs alphabétiques n'acceptent que des lettres, avec les tirets et apostrophes.

**Le RIB est signalé comme trop court.** Il s'agit d'un simple avertissement : vous pouvez enregistrer et compléter plus tard.

**L'établissement principal ne peut pas être supprimé.** Désignez d'abord un autre établissement comme principal, puis vérifiez qu'aucun salarié n'est rattaché à celui que vous voulez supprimer.

**La société ne peut pas être supprimée.** Des bulletins ont été produits. Vous pouvez la passer en inactive : elle reste consultable, mais ne produit plus de bulletins.

## Questions liées

- Comment créer un établissement secondaire
- Comment fonctionne l'héritage du paramétrage société vers les fiches salariés
- Comprendre la différence entre société inactive et société supprimée
- Comment reprendre l'historique d'un dossier en cours d'année
- Paramétrer les jours fériés et les dates des fêtes religieuses
- Comprendre le repos hebdomadaire et les majorations d'heures
