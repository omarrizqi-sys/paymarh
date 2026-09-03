# Validation et avertissements

- **Module :** 1 — Fiches
- **Étape :** 1.1.b
- **Date :** 2026-08-29

---

## 1. Une réponse peut être un succès avec des avertissements

```json
{
  "data": { "id": "...", "rib": "1234..." },
  "warnings": [{ "code": "LONGUEUR_INATTENDUE", "champ": "rib", "message": "..." }]
}
```

Les avertissements n’empêchent pas l’enregistrement. Les erreurs bloquantes renvoient 4xx sans écrire.

---

## 2. Bloquant

| Cas                                                                | Code typique                   |
| ------------------------------------------------------------------ | ------------------------------ |
| Caractère non conforme (chiffre dans un nom, lettre dans un RIB)   | `CARACTERE_NON_CONFORME`       |
| Champ obligatoire absent                                           | `CHAMP_OBLIGATOIRE`            |
| `moisDebutMontage` > `moisDebutProduction`                         | `MONTAGE_APRES_PRODUCTION`     |
| `dateInactivite` ≤ `moisDebutProduction`                           | `INACTIVITE_NON_POSTERIEURE`   |
| Cessation avant création                                           | `CESSATION_AVANT_CREATION`     |
| Fin d’exonération avant début                                      | `EXONERATION_FIN_AVANT_DEBUT`  |
| Doublon `codeDossier` / `identifiantFiscal` / `ice` dans le compte | `VALEUR_INDISPONIBLE`          |
| Deux établissements principaux                                     | contrainte base + refus métier |
| `moisEffet` fourni par l’appelant                                  | `CHAMP_INTERDIT`               |
| Jeton de suppression obsolète                                      | `CONFIRMATION_OBSOLETE`        |

---

## 3. Avertissement seulement

- RIB ≠ 24 caractères
- IBAN ≠ 28 ou sans préfixe `MA`
- BIC ≠ 8 et ≠ 11
- ICE ≠ 15
- Retour `EN_PRODUCTION` → `EN_MONTAGE`
- Aucun compte avec usage salaires
- Raison sociale déjà utilisée dans le compte
- Code postal marocain ≠ 5 chiffres (levé si `pays` ≠ `MA`)

---

## 4. Étanchéité des messages d’unicité

Sur un doublon d’identifiant, le message est **toujours** :

> Cette valeur n'est pas disponible.

Code : `VALEUR_INDISPONIBLE`.

Il ne nomme **jamais** la société en cause, ni son code dossier, ni sa raison sociale. Dans un cabinet, un gestionnaire n’a pas forcément accès aux autres sociétés du même compte : lui apprendre qu’un IF y existe déjà serait une fuite.

Même logique pour les 404 : une société hors périmètre est « introuvable », jamais « interdite ».

---

## 5. Données vides plutôt que fausses

Adresse et ville du siège sont **obligatoires** à la création. Aucune valeur de remplacement (« À compléter », etc.) n’est autorisée : en paie, un champ vide vaut mieux qu’une donnée inventée.
