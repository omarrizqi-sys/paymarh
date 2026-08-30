# `@paymarh/back-office` — le back-office PaymaRH

## Rôle

L'interface web destinée aux **gestionnaires de paie** : administrateurs de compte et gestionnaires, en cabinet comme en entreprise.

C'est un **client de l'API, et rien d'autre.** Il affiche ce que l'API lui répond, et transmet ce que l'utilisateur saisit. Il ne calcule rien.

> **Règle sans exception :** aucun calcul de paie ne doit apparaître ici. Pas d'addition de rubriques, pas d'arrondi, pas de proratisation — pas même « juste pour l'aperçu » ou « pour éviter un aller-retour réseau ». Le jour où trois interfaces existeront, une logique dupliquée produirait trois résultats différents pour un même bulletin.

---

## Démarrage

Depuis la **racine du dépôt** :

```bash
pnpm dev:back-office     # http://localhost:3000
```

L'API doit tourner en parallèle pour que la page affiche « API en ligne » :

```bash
pnpm dev                 # lance l'API et le back-office ensemble
```

Si l'API est arrêtée, le back-office **s'affiche quand même** et signale simplement qu'il ne la joint pas. C'est voulu : le témoin de connexion doit pouvoir dire « hors ligne », donc il ne peut pas dépendre de l'API pour s'afficher.

---

## Turbopack

Turbopack est le compilateur utilisé **en développement et pour le build**, conformément au choix figé au module 0 :

```json
"dev":   "next dev --turbopack --port 3000",
"build": "next build --turbopack"
```

C'est le compilateur vers lequel Next.js converge. L'activer dès maintenant évite une migration ultérieure, et raccourcit nettement les temps de rechargement.

---

## Structure

```
src/
├── app/
│   ├── layout.tsx          mise en page racine (langue, styles globaux)
│   ├── page.tsx            LA page du module 0 — écran technique
│   └── globals.css         Tailwind v4 + jetons de thème shadcn/ui
│
├── components/
│   ├── etat-api.tsx        témoin de connexion à l'API (composant client)
│   └── ui/                 composants shadcn/ui, copiés dans le projet
│
└── lib/
    ├── api/health.ts       appel à GET /health + interprétation (fonctions pures)
    ├── auth/               COQUILLE Auth.js — désactivée
    ├── utils.ts            utilitaire cn() de shadcn/ui
    └── version.ts          version affichée
```

**Une seule page au module 0** (`/`), volontairement dépourvue de toute fonctionnalité métier. Elle affiche le nom du produit, l'état de la liaison avec l'API et la version. C'est un écran de preuve, pas un écran de travail.

---

## Tailwind CSS v4 et shadcn/ui

**Il n'y a pas de `tailwind.config.js`**, et c'est normal : depuis la version 4, Tailwind se configure directement en CSS. Le thème (couleurs, rayons) vit dans `src/app/globals.css`, dans les blocs `:root`, `.dark` et `@theme inline`.

**shadcn/ui n'est pas une dépendance.** Ses composants sont **copiés** dans `src/components/ui/` : le code nous appartient et se modifie librement. Ne remplacez jamais un de ces fichiers par un import externe.

Pour ajouter un composant :

```bash
pnpm dlx shadcn@latest add <nom-du-composant>
```

---

## La coquille Auth.js

`src/lib/auth/auth.config.ts` réserve l'emplacement de l'authentification **sans rien implémenter** :

- aucune page de connexion, aucun fournisseur d'identité, aucun mot de passe, aucune session ;
- **la dépendance `next-auth` n'est même pas installée** — installer une bibliothèque d'authentification sans l'utiliser ajouterait une surface d'attaque pour un bénéfice nul.

Le fichier consigne les décisions déjà prises (forme de la session, articulation avec le `TenantContext` de l'API) pour que le module d'authentification n'ait qu'à les activer.

`obtenirSession()` renvoie toujours `null`. **Ne la faites pas renvoyer une fausse session** : ce serait créer une authentification factice, précisément ce que le module 0 interdit.

---

## Points d'attention

**Pas d'extension dans les imports**, contrairement à l'API. Next.js utilise un bundler qui les résout lui-même. L'alias `@/` pointe vers `src/`.

**Les types métier viennent de `@paymarh/shared-types`.** Ne redéclarez jamais localement la forme d'un `Account`, d'une `Company` ou d'un `User`.

**Variable d'environnement :** `NEXT_PUBLIC_API_URL` (par défaut `http://localhost:3001`). Le préfixe `NEXT_PUBLIC_` est imposé par Next.js pour rendre une variable visible côté navigateur — n'y mettez donc jamais de secret.

### Béquille de développement : `NEXT_PUBLIC_PAYMARH_USER_ID`

En l'absence d'Auth.js, le back-office identifie l'appelant en envoyant l'en-tête `x-paymarh-user-id`, alimenté par `NEXT_PUBLIC_PAYMARH_USER_ID` dans `.env` (même uuid que celui affiché par `pnpm db:seed`).

> **Béquille de développement — pas une authentification.** À remplacer par Auth.js. **Bloque toute mise en production tant qu'elle existe**, exactement comme l'en-tête côté API. Voir aussi `apps/api/README.md` et `docs/DEVELOPMENT.md` §6.

---

## Commandes

Depuis la racine, préfixer par `pnpm --filter @paymarh/back-office` :

| Commande    | Effet                                       |
| ----------- | ------------------------------------------- |
| `dev`       | Serveur de développement sous Turbopack     |
| `build`     | Build de production sous Turbopack          |
| `start`     | Sert le build de production                 |
| `typecheck` | Vérifie les types sans produire de fichiers |
