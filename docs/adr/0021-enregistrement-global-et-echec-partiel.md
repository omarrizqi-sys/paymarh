# ADR 0021 — Enregistrement global et échec partiel (fiche salarié)

- **Date :** 2026-09-04
- **Statut :** accepté
- **Contexte :** étape 2.1.c-1, temps 2.a

## Contexte

L'API fiche salarié (2.1.b) expose une écriture **par rubrique** avec verrouillage optimiste partagé (`version` commune, en-tête `If-Match`). L'écran, lui, présente **toutes les rubriques sur une page** et un bouton **Enregistrer** unique.

## Décision

### Enregistrement global

- Chaque rubrique montée **s'enregistre** dans un registre : id stable, libellé, `estModifiee()`, `envoyer(version)`.
- **Enregistrer** collecte les rubriques modifiées **dans l'ordre d'affichage** et envoie les PATCH **séquentiellement** (jamais en parallèle).
- Après chaque succès, la **nouvelle `version`** renvoyée par le serveur est propagée aux rubriques restantes.

### Échec partiel vs conflit

| Réponse serveur                                        | Comportement écran                                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 400 métier                                             | Continuer la séquence ; conserver la saisie ; afficher le message serveur **dans la rubrique**                                  |
| 409 `CONFLIT_VERSION` ou 428 `EN_TETE_IF_MATCH_REQUIS` | **Arrêter** la séquence ; **un seul bandeau au niveau fiche** ; bouton « Recharger les valeurs du serveur » (avec confirmation) |
| Alertes (`alertes[]`)                                  | Afficher sans bloquer ; l'enregistrement est réussi                                                                             |

### Pas de bouton « Réessayer » après conflit

Après un `CONFLIT_VERSION`, la version affichée à l'écran est **obsolete** : relancer la même séquence PATCH avec l'ancien numéro reproduirait le conflit ou écraserait silencieusement le travail d'un autre utilisateur.

L'écran propose donc **uniquement** « Recharger les valeurs du serveur » (avec confirmation avant d'écraser la saisie locale). L'utilisateur repart de l'état courant du serveur avant de modifier à nouveau.

**Pas de « Réessayer »** : ce bouton laisserait croire qu'un nouvel essai avec la saisie locale suffit, ce qui est faux tant que la fiche n'a pas été rechargée.

### Annuler et navigation

- **Annuler** recharge depuis le serveur après confirmation **nommant les rubriques modifiées**.
- Quitter la page avec des rubriques modifiées déclenche un avertissement (`beforeunload` + confirmation sur le lien retour actuel).

**Limite connue (2.1.c-2) :** Next.js 16.3.3 ne fournit pas de garde centralisée pour toute navigation interne (`router.push`, retour navigateur). Seuls la fermeture/rechargement d'onglet et le lien retour explicitement confirmé sont couverts au temps 2.a.

### Enveloppes de réponse volontairement divergentes

| Module                   | Enveloppe              | Client back-office                         |
| ------------------------ | ---------------------- | ------------------------------------------ |
| Module 1 — fiche société | `{ data, warnings }`   | `lib/api/client.ts`, `societes.ts`, …      |
| Module 2 — fiche salarié | `{ donnees, alertes }` | `lib/api/client-salarie.ts`, `salaries.ts` |

Cette divergence est **volontaire et laissée en l'état** :

- Les deux modules ont été livrés à des étapes différentes avec des conventions figées (2.1.b pour le salarié, 1.1.b pour la société).
- Unifier les enveloppes imposerait de migrer l'un des deux modules ou d'introduire une couche d'adaptation générique qui masquerait la forme réelle des réponses API.
- Le client salarié reste **séparé** : pas de client générique qui devine `{ data }` vs `{ donnees }`.

## Conséquences

- Les rubriques de démonstration (temps 2.a) sont jetables ; le registre et l'orchestrateur restent.
- La liste des salariés (temps 2.b) réutilise le squelette **sans** colonne sommaire.
- La protection navigation complète est reportée à 2.1.c-2 (voir limite ci-dessus).
