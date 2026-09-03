# ADR 0007 — Point de passage unique des permissions

- **Statut :** accepté
- **Date :** 2026-08-29
- **Portée :** API fiche société (1.1.b) et modules suivants

---

## Contexte

La gestion fine des droits (par opération, par société, familles, admin principal) arrivera avec le module d’authentification. En attendant, le module 0 n’offre que quatre rôles grossiers.

Si chaque service teste `role === 'MANAGER'`, le jour du vrai moteur de droits il faudra tout réécrire — et des `if` oubliés resteront des trous de sécurité.

---

## Décision

1. Une fonction unique `peutFaire(utilisateur, permission, contexte)` décide.
2. Les permissions sont **nommées par opération** (`societe.supprimer`, …).
3. La correspondance rôle → permissions vit dans **un seul fichier provisoire** clairement marqué.
4. Aucun autre endroit du code métier ne compare un rôle.
5. Un test Vitest échoue si un test de rôle réapparaît hors de ce fichier (et hors du chemin tenancy élargi déjà documenté).

---

## Conséquences

- Ajouter une opération = ajouter une permission + l’appeler via `assertPeutFaire`.
- Remplacer le provisoire au module auth = changer l’intérieur de `peutFaire`, pas les centaines d’appels.
- `PLATFORM_ADMIN` n’obtient aucun passe-droit sur le chemin normal : ses permissions listées sont intentionnellement minimales.

---

## Amendement (étape 2.1.b — fiche salarié)

1. **Garde NestJS unique** — `@RequiertPermission('...')` + `PermissionGuard` : seul point de passage pour les endpoints salarié/emploi. Le module 1 conserve provisoirement `peutFaire` / `assertPeutFaire`.
2. **Permissions nommées** — `salarie.lire`, `salarie.creer`, `salarie.modifier`, `salarie.supprimer`, `emploi.creer`, `emploi.modifier`, `emploi.supprimer`, `salarie.remuneration.lire`, `salarie.remuneration.ecrire`.
3. **Masquage par absence de champ** — sans `salarie.remuneration.lire`, les rubriques rémunération / paiement / primes / avantages / comptes bancaires sont **absentes** de la réponse (jamais à `null`).
4. **403 vs 404** — ressource d’un autre compte → **404** (message neutre) ; ressource du bon compte, permission manquante → **403**.
5. **Béquille de développement** — en-tête `x-paymarh-permissions-refusees` (liste de permissions à refuser, ignoré en production).

---

## Alternatives rejetées

| Alternative | Motif |
| --- | --- |
| Tests de rôle partout | Explosion de dette au module auth |
| Table de droits dès maintenant | Hors périmètre 1.1.b ; Auth.js pas installé |
| Guards Nest par rôle | Encourage le couplage au rôle plutôt qu’à l’opération |
