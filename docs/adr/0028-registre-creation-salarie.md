# ADR 0028 — Registre de création du salarié et contrat séparé

- **Date :** 2026-09-09
- **Statut :** accepté
- **Contexte :** étape 2.1.c, temps 3, prompt 3-1

## Contexte

La fiche salarié enregistre **une rubrique par appel HTTP**, via `RubriqueEnregistrable` et l'orchestrateur séquentiel (ADR 0021). La création, elle, est un **seul** `POST /salaries`. Les quatre blocs d'identité (Identité, Identifiants, Coordonnées, Dates clés) sont réutilisés tels quels : ils doivent livrer leurs valeurs **sans les envoyer**.

Étendre `RubriqueEnregistrable` d'une méthode `valeurs()` aurait exposé cette capacité aux tableaux répétables, qui ne participent jamais à une création.

## Décision

### Contrat distinct `RubriqueCreable`

Quatre implémenteurs seulement, les blocs d'identité :

- `id`, `libelle`
- `valeurs()` — saisie courante du bloc
- `reinitialiser()`

`RubriqueEnregistrable` n'est pas modifié. Les tableaux n'implémentent pas `RubriqueCreable`.

### Un registre propre, un seul appel

Le registre de création collecte les quatre `valeurs()`, assemble un corps unique, et émet **un** `POST /salaries`. Il ne réutilise pas l'orchestrateur de la fiche : il n'y a ni séquence, ni numéro de version, ni `If-Match`.

Un champ facultatif vide après trim est **omis** du corps (pas envoyé comme chaîne vide). C'est la règle du DTO : `@IsOptional` n'ignore que `null`/`undefined` ; une chaîne vide ferait échouer `@IsUUID` / `@IsDateString`, et le serveur ne normalise le vide que pour le matricule et les identifiants légaux.

### Alertes de succès

Une création peut réussir en portant des alertes (homonyme, réembauche, format de contact…). Le salarié existe : l'écran **navigue vers la fiche**. Les alertes voyagent dans un dépôt mémoire consommé une fois par la fiche, **pas dans l'URL**. La fiche affiche chaque alerte sous le champ désigné, ou en tête du bloc Identité si elle n'a pas de champ.

Le `POST` ne rend pas `operations`. La page fiche fait son GET habituel pour les obtenir ; le dépôt ne transporte que les alertes, afin d'éviter un GET supplémentaire dédié aux alertes et toute donnée personnelle en paramètre d'URL.

## Conséquences

- L'écran de création n'émet jamais de PATCH, ni un second POST.
- Annuler vide le formulaire, sans appel serveur ni changement d'écran.
- Pas de conflit de version, pas de bouton Supprimer, pas de garde de navigation (prompt 3-3).
