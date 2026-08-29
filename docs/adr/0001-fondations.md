# ADR 0001 — Fondations techniques de PaymaRH

- **Statut :** accepté
- **Date :** 2026-08-29
- **Portée :** module 0 (fondations)

---

## Contexte

PaymaRH démarre de zéro. C'est un logiciel de **paie marocaine pour le secteur privé**, distribué en **SaaS multi-société**, destiné à la fois à des entreprises (leurs propres salariés) et à des cabinets (plusieurs sociétés clientes).

Deux contraintes façonnent toutes les décisions ci-dessous :

1. **La paie est un domaine à faible tolérance à l'erreur.** Un montant faux n'est pas un bogue d'affichage : c'est un écart déclaratif vis-à-vis de la CNSS ou de la DGI, et une donnée personnelle sensible. La reproductibilité et l'isolation priment sur la vitesse de développement.
2. **Le porteur du projet n'a pas de background technique** et pilotera le développement via l'IA. Le code doit donc être prévisible, structuré et explicite. Un mécanisme qui « marche si on pense à l'appeler » est un mécanisme défaillant : il faut des mécanismes qu'on ne puisse pas oublier.

Ce document fige les choix pris avant la première ligne de code métier. Les décisions ultérieures feront l'objet d'ADR numérotés distincts.

---

## Décisions

### 1. Monorepo (pnpm workspaces)

**Décision.** Un seul dépôt contenant l'API, le back-office, les types partagés et les configurations, gérés par pnpm workspaces.

**Pourquoi.** Le produit accueillera à terme plusieurs interfaces (back-office, portail salarié, mobile) qui partagent les mêmes contrats de données. Dans des dépôts séparés, chaque changement de contrat demanderait de publier un paquet, de le mettre à jour côté client, et de gérer une période de désynchronisation. Dans un monorepo, un changement de type casse immédiatement la compilation de tout ce qui en dépend — ce qui est exactement le retour qu'on veut.

**Conséquences.** Une seule installation, une seule commande de test, une seule configuration de lint. En contrepartie, le dépôt grossira ; il faudra rester discipliné sur le découpage en espaces de travail.

### 2. TypeScript partout, en mode strict

**Décision.** TypeScript pour l'API, le front et les scripts. Mode `strict`, plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns`. Aucun `any`.

**Pourquoi.** En paie, la majorité des erreurs coûteuses sont des erreurs de forme de données : un champ manquant, un `null` non traité, un identifiant à la mauvaise place. Le typage strict transforme ces erreurs d'exécution en erreurs de compilation, détectées avant tout déploiement. Avoir un seul langage sur les deux côtés permet aussi de partager les types plutôt que de les redécrire.

**Version retenue : TypeScript 6.0.x.** Ce n'est pas la dernière publiée (TypeScript 7.0 existe), et c'est délibéré : `typescript-eslint` déclare une compatibilité `>= 4.8.4 < 6.1.0`, tandis que NestJS 12 exige `>= 6.0.0`. TypeScript 6.0 est le seul point où toute la chaîne d'outillage est simultanément supportée. On y restera jusqu'à ce que l'écosystème de lint rattrape TypeScript 7.

**Conséquences.** Plus de code à écrire au départ (gardes de type, traitement des `null`), beaucoup moins de débogage ensuite.

### 3. NestJS pour l'API, avec le moteur de paie isolé

**Décision.** NestJS pour l'API REST. Le moteur de paie vit dans `apps/api/src/payroll-engine/`, conçu comme une **fonction pure** : toutes ses données arrivent en paramètre, il ne touche ni la base, ni le réseau, ni l'horloge.

**Pourquoi NestJS.** Il impose une structure (modules, contrôleurs, services) au lieu de la laisser à l'improvisation. Pour un projet piloté par IA, cette contrainte est un avantage : la place de chaque chose est déterminée par le framework, pas par le jugement du moment. Son système d'injection de dépendances rend aussi le code testable sans infrastructure.

**Pourquoi le moteur isolé.** Un bulletin doit être **rejouable**. On doit pouvoir recalculer mars 2026 dans deux ans, pour un contrôle ou un contentieux, et obtenir le même résultat au centime près. Un moteur qui irait chercher ses données en base produirait un résultat dépendant de l'état de la base au moment du calcul — donc non reproductible et indéfendable. En le rendant pur, le calcul devient une fonction de ses entrées, et ses entrées peuvent être archivées avec le résultat.

**Conséquences.** Les modules métier devront rassembler explicitement toutes les données avant d'appeler le moteur. C'est plus verbeux, et c'est le prix de la reproductibilité. Au module 0, le moteur est **vide** : seul son contrat existe.

### 4. Next.js avec Turbopack pour le back-office

**Décision.** Next.js (App Router) + React + Tailwind CSS + shadcn/ui, avec **Turbopack** activé en développement et pour le build.

**Pourquoi.** Next.js est le choix par défaut de l'écosystème React, donc le mieux documenté — ce qui compte pour un projet assisté par IA. Turbopack réduit fortement le temps de rechargement, et c'est le compilateur vers lequel Next.js converge : l'activer maintenant évite une migration plus tard. shadcn/ui copie ses composants dans le projet au lieu de les imposer comme dépendance, ce qui laisse le contrôle total du rendu.

**Conséquences.** Le back-office reste un **client** : il n'a aucune dépendance de calcul, et n'en aura jamais (principe 1 de l'architecture).

### 5. PostgreSQL et Prisma

**Décision.** PostgreSQL (via Docker en local) comme base, Prisma comme ORM, avec un schéma unique.

**Pourquoi PostgreSQL.** Son type `NUMERIC` est un décimal exact, indispensable pour les montants (voir décision 8). Il est robuste, gratuit, et disponible chez tous les hébergeurs.

**Pourquoi Prisma.** Le schéma est un fichier unique et lisible, qui sert à la fois de source des migrations et de générateur des types TypeScript. Le modèle de données et les types du code ne peuvent donc pas diverger.

**Conséquences.** Prisma 7 introduit deux changements qu'il faut connaître : l'URL de connexion vit dans `prisma.config.ts` (plus dans `schema.prisma`), et le client exige un adaptateur de driver — d'où la dépendance à `@prisma/adapter-pg` et `pg`.

### 6. Multi-tenant à double isolation

**Décision.** Hiérarchie `Account → Company → (Salarié, plus tard)`. Toute requête de données est filtrée d'abord par `accountId`, puis par `companyId`. Le mécanisme est implémenté dans `apps/api/src/common/tenancy/`.

**Pourquoi une hiérarchie à deux niveaux.** Elle découle du produit : un cabinet (un `Account`) gère plusieurs sociétés clientes (des `Company`). Un seul niveau ne permettrait pas de cloisonner deux sociétés au sein d'un même cabinet.

**Pourquoi un mécanisme plutôt qu'une consigne.** Une règle du type « pensez à filtrer par `accountId` » est violée tôt ou tard, et la violation est silencieuse : la requête fonctionne, elle renvoie simplement trop de données. Trois éléments rendent l'oubli difficile :

- le contexte voyage seul, via `AsyncLocalStorage`, donc personne n'a à le transmettre — ni à oublier de le transmettre ;
- les filtres sont construits par des fonctions dédiées qui **lèvent une erreur** plutôt que de renvoyer un filtre vide ;
- une garde refuse toute requête de données dépourvue de contexte.

**Conséquences.** Chaque nouveau contrôleur de données doit porter `TenantGuard` et être ajouté à la liste du middleware dans `app.module.ts`. Cette liste est volontairement explicite plutôt qu'un joker : elle se vérifie d'un coup d'œil.

### 7. Super-admin séparé, hors hiérarchie

**Décision.** `PLATFORM_ADMIN` est un rôle distinct dont l'`accountId` est **nul par construction**. Le filtrage par tenant s'applique à lui comme à tout le monde ; son accès élargi passe par une fonction dédiée exigeant un motif, et doit être journalisé dans `AuditLog`.

**Pourquoi.** L'alternative naturelle — un compte « au-dessus » qui voit tout — a un défaut majeur : l'accès total devient le **comportement par défaut** du super-admin, donc invisible et non tracé. Dans un SaaS de paie, l'éditeur a techniquement accès aux salaires de milliers de personnes ; la seule posture défendable est que cet accès soit _impossible par accident_ et _toujours tracé quand il est délibéré_.

**Conséquence concrète, et volontaire :** un `PLATFORM_ADMIN` qui appelle `GET /societes` reçoit une **erreur 403**. Ce n'est pas un bogue. C'est le principe qui fonctionne.

### 8. Calcul monétaire en décimal exact

**Décision.** Aucun montant en virgule flottante. Type `Decimal` de Prisma en base, `decimal.js` en code, arrondis toujours explicites.

**Pourquoi.** `0.1 + 0.2` vaut `0.30000000000000004` en virgule flottante. Sur une cotisation isolée l'écart est invisible ; cumulé sur douze mois, des dizaines de rubriques et des centaines de salariés, il devient un écart déclaratif qu'il faudra justifier.

**Conséquences.** Le calcul est plus verbeux qu'avec des nombres natifs. Pour que la règle ne repose pas sur la seule vigilance, ESLint interdit `parseFloat`, `Number.parseFloat` et `Math.round` avec un message renvoyant vers `decimal.js`.

### 9. Auth.js, en coquille désactivée

**Décision.** Auth.js est retenu comme future bibliothèque d'authentification. Au module 0, seule une **coquille désactivée** existe (`apps/back-office/src/lib/auth/`), **sans installer la dépendance**.

**Pourquoi maintenant.** Fixer le choix évite qu'il soit refait plus tard sous contrainte.

**Pourquoi sans la dépendance.** Installer une bibliothèque d'authentification sans l'utiliser, c'est ajouter une surface d'attaque et une source de confusion pour un bénéfice nul. Elle sera ajoutée par le module qui l'activera réellement.

**Conséquence transitoire.** Pour pouvoir démontrer et tester l'isolation multi-tenant sans authentification, l'API accepte en développement un en-tête `x-paymarh-user-id`, à partir duquel elle relit le rôle et le compte **en base** (jamais depuis la requête). **Ce n'est pas de l'authentification** et cela doit disparaître avec le module d'authentification. Aucune mise en production n'est possible tant que ce relais existe.

### 10. Livrables hors base

**Décision.** Les documents finalisés ne seront pas stockés en base ; la base ne gardera qu'une **référence** vers un stockage d'objets de type S3. Au module 0, seule l'interface existe (`apps/api/src/deliverables/`).

**Pourquoi.** Stocker des PDF en base fait gonfler les sauvegardes, ralentit les restaurations et complique les migrations, sans aucun bénéfice. En passant par un port abstrait, le fournisseur (S3, MinIO, autre) reste un détail interchangeable.

---

## Conséquences globales

**Ce qu'on gagne.** Un socle où l'isolation des données, la reproductibilité des calculs et l'exactitude monétaire sont garanties par des mécanismes outillés plutôt que par la discipline. Un contrat de données unique, partagé et vérifié à la compilation.

**Ce qu'on paie.** Plus de cérémonie qu'un projet équivalent sans ces contraintes : filtres explicites, décimaux explicites, données rassemblées avant calcul. Ce coût est assumé et proportionné au domaine.

**Ce qui reste ouvert et devra faire l'objet d'ADR ultérieurs :** la stratégie de déploiement et d'hébergement, le passage éventuel à un lint avec analyse de types, le choix du fournisseur de stockage d'objets, la conception du portail salarié, et la stratégie de versionnement des barèmes réglementaires dans le temps.
