# ADR 0029 — Traduction globale des refus de forme

- **Date :** 2026-09-10
- **Statut :** accepté
- **Contexte :** étape 2.1.c, temps 3, prompt 3-1-API

## Contexte

L’API avait deux langages de refus.

Un refus **métier** (matricule déjà pris, etc.) sortait déjà sous la forme :

```json
{
  "code": "VALEUR_INDISPONIBLE",
  "message": "Cette valeur n’est pas disponible.",
  "champ": "matricule"
}
```

Un refus de **forme** (champ manquant, mal typé, hors liste) était produit tel quel par le `ValidationPipe` global :

```json
{
  "message": ["dateNaissance must be a valid ISO 8601 date string", "..."],
  "error": "Bad Request",
  "statusCode": 400
}
```

Ni `code`, ni `champ` ; un tableau de phrases anglaises de class-validator. Le client HTTP du back-office n’accepte un `message` que s’il est une chaîne : face au tableau, il fabriquait le code générique `ERREUR`. Un refus légitime s’affichait alors comme une panne de l’application.

## Décision

La traduction est **globale**. Toute route de l’API passe par le même `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform` conservés). L’`exceptionFactory` convertit les `ValidationError` en un seul objet `{ code, message, champ }`, avec un message français tiré des codes déjà existants :

| Cas                                                      | Code                     | Message                                                 |
| -------------------------------------------------------- | ------------------------ | ------------------------------------------------------- |
| Champ absent, vide, ou espaces seuls                     | `CHAMP_OBLIGATOIRE`      | Ce champ est obligatoire.                               |
| Champ hors liste (`forbidNonWhitelisted`)                | `CHAMP_INTERDIT`         | Ce champ ne peut pas être fourni par le client.         |
| Valeur présente mais non conforme (type, format, bornes) | `CARACTERE_NON_CONFORME` | Ce champ contient un caractère non conforme à son type. |

Aucune phrase anglaise de class-validator ne sort de l’API, ni dans `message`, ni dans un champ annexe.

`CHAMP_INTERDIT` convenait déjà aux saisies sur salaire (champ que le client n’a pas le droit d’envoyer). Un champ inconnu est le même cas : le client ne peut pas le fournir. On réutilise le code, on n’en invente pas un second.

Les bornes numériques (`@Min` / `@Max`, ex. longueur de matricule) n’ont pas de code dédié. Elles tombent aujourd’hui dans `CARACTERE_NON_CONFORME`. Un code `VALEUR_HORS_BORNES` serait plus juste ; il n’est pas créé ici.

### Règle du champ unique désigné

Le `ValidationPipe` peut rapporter plusieurs erreurs à la fois. L’écran ne sait lire qu’un refus à la fois.

**Règle retenue :** on désigne le premier nœud en erreur dans l’ordre renvoyé par class-validator, en parcourant en profondeur (enfants d’un objet imbriqué avant les contraintes du parent, puis nœud suivant). Sur un DTO plat, cet ordre est celui de **déclaration des propriétés**. Parmi les contraintes d’un même champ : hors liste, puis absence/vide, puis le reste.

On ne rend jamais une liste.

## Conséquences

- `main.ts` et tous les `creerAppHttp` des tests HTTP partagent `creerPipeValidationGlobale()`.
- Le back-office n’a rien de nouveau à apprendre : il lisait déjà `{ code, message, champ }`. Un filet de sécurité reste dans `extraireErreur` pour l’ancienne forme tableau, afin de ne jamais afficher l’anglais ni le message de panne si un mock ou un relais la reproduisait.
