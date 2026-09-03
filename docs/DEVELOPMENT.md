# Environnement de développement

Comment installer, lancer et vérifier PaymaRH sur une machine de travail.

---

## 1. Prérequis

| Outil              | Version  | Vérifier        | Installer                                                     |
| ------------------ | -------- | --------------- | ------------------------------------------------------------- |
| **Node.js**        | LTS 24.x | `node -v`       | [nodejs.org](https://nodejs.org) — choisir « LTS »            |
| **pnpm**           | 11.x     | `pnpm -v`       | `npm install -g pnpm`                                         |
| **Docker Desktop** | récent   | `docker -v`     | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Git**            | récent   | `git --version` | [git-scm.com](https://git-scm.com)                            |

Docker Desktop doit être **démarré** (icône active dans la barre des tâches) avant toute commande de base de données. La commande `docker info` doit répondre sans erreur.

> **Pourquoi pas la toute dernière version de Node ?** Les versions LTS reçoivent des correctifs pendant trois ans et sont celles que les bibliothèques testent réellement. Une version « de pointe » apporte surtout des surprises.

---

## 2. Installation, une seule fois

```bash
git clone <url-du-depot> paymarh
cd paymarh

# 1. Installer toutes les dépendances du monorepo
pnpm install

# 2. Créer le fichier d'environnement local
cp .env.example .env          # Linux / macOS
Copy-Item .env.example .env   # Windows PowerShell

# 3. Démarrer PostgreSQL
pnpm db:up

# 4. Créer les tables
pnpm db:migrate

# 5. Insérer les données de démonstration
pnpm db:seed
```

Le fichier `.env` contient des valeurs adaptées au développement local. Il est ignoré par Git et ne doit **jamais** être versionné.

---

## 3. Lancer l'application au quotidien

```bash
pnpm db:up     # si PostgreSQL n'est pas déjà démarré
pnpm dev       # lance l'API et le back-office ensemble
```

| Service         | Adresse                        |
| --------------- | ------------------------------ |
| Back-office     | <http://localhost:3000>        |
| API             | <http://localhost:3001>        |
| Témoin de santé | <http://localhost:3001/health> |

Pour ne lancer qu'une seule partie :

```bash
pnpm dev:api           # API seule
pnpm dev:back-office   # back-office seul
```

**Comment savoir que tout va bien :** ouvrir <http://localhost:3000>. La page affiche un badge vert « API en ligne » et la version de l'API. Un badge rouge signifie que l'API n'est pas démarrée ou que PostgreSQL est arrêté.

---

## 4. Toutes les commandes

### Application

| Commande               | Effet                                               |
| ---------------------- | --------------------------------------------------- |
| `pnpm dev`             | Lance l'API et le back-office en mode développement |
| `pnpm dev:api`         | Lance l'API seule (rechargement à chaud)            |
| `pnpm dev:back-office` | Lance le back-office seul (Turbopack)               |
| `pnpm build`           | Compile tout le monorepo, dans le bon ordre         |

### Base de données

| Commande          | Effet                                                         |
| ----------------- | ------------------------------------------------------------- |
| `pnpm db:up`      | Démarre PostgreSQL dans Docker et attend qu'il réponde        |
| `pnpm db:down`    | Arrête PostgreSQL (les données sont conservées)               |
| `pnpm db:logs`    | Affiche les journaux de PostgreSQL                            |
| `pnpm db:migrate` | Applique les migrations, ou en crée une si le schéma a changé |
| `pnpm db:seed`    | Insère les données de démonstration                           |
| `pnpm db:reset`   | **Efface tout**, rejoue les migrations et le seed             |
| `pnpm db:studio`  | Ouvre Prisma Studio, une interface pour consulter la base     |

> `pnpm db:reset` détruit toutes les données locales. Sans conséquence en développement, jamais à lancer ailleurs.

### Qualité

| Commande          | Effet                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `pnpm verify`     | Vérification complète avant de valider un module (lint, format, types, tests, imports circulaires) |
| `pnpm lint:fix`   | Corrige automatiquement ce qui peut l'être                                                         |
| `pnpm format`     | Reformate tous les fichiers                                                                        |
| `pnpm test:unit`  | Tests unitaires uniquement (API + back-office), sans base de données                               |
| `pnpm test:watch` | Relance les tests à chaque modification                                                            |

**Avant de considérer un module terminé**, la vérification complète doit passer :

```bash
pnpm verify
```

---

## 5. Modifier le schéma de données

1. Éditer `apps/api/prisma/schema.prisma`.
2. Lancer `pnpm db:migrate`, qui demande un nom de migration (en minuscules avec tirets, ex. `ajout-table-salarie`).
3. Prisma crée le fichier SQL dans `apps/api/prisma/migrations/` **et** régénère le client TypeScript.
4. Commiter le fichier de migration : il fait partie de l'historique du projet.

> **Ne jamais modifier une migration déjà commitée.** Pour corriger, on en crée une nouvelle. Une migration réécrite après coup produit des bases divergentes entre les machines.

### Particularité de Prisma 7

Depuis la version 7, l'URL de connexion **ne vit plus dans `schema.prisma`** mais dans `apps/api/prisma.config.ts`. Le client, lui, reçoit sa connexion via un adaptateur (`@prisma/adapter-pg`), construit dans `apps/api/src/common/prisma/prisma.service.ts`.

Le client généré est écrit dans `apps/api/src/generated/prisma/` et **n'est pas versionné** : il se régénère à chaque migration, ou avec `pnpm --filter @paymarh/api db:generate`.

---

## 6. Interroger l'API pendant le développement

Le module 0 n'a **aucune authentification**. Pour que l'API sache au nom de qui répondre, on lui passe un en-tête de développement, affiché par `pnpm db:seed` :

```bash
# Le témoin de santé est public
curl http://localhost:3001/health

# Les routes de données exigent une identité
curl http://localhost:3001/societes \
  -H "x-paymarh-user-id: <identifiant affiché par le seed>"
```

Sans cet en-tête, l'API répond **401**. C'est le comportement voulu : on échoue fermé.

> Cet en-tête est un **relais de développement**, pas une authentification. Il sera supprimé et remplacé par Auth.js dans le module dédié. **Aucune mise en production n'est possible tant qu'il existe.**

### Back-office : `NEXT_PUBLIC_PAYMARH_USER_ID`

Le back-office envoie le même identifiant via la variable d'environnement `NEXT_PUBLIC_PAYMARH_USER_ID` (dans `.env`), qui alimente l'en-tête `x-paymarh-user-id` côté navigateur.

> **Béquille de développement — pas une authentification.** À remplacer par Auth.js. **Bloque toute mise en production tant qu'elle existe**, exactement comme l'en-tête côté API.

---

## 7. Workflow Git

```bash
git checkout -b module-1-fiches      # une branche par module
# ... développement ...
pnpm verify
git add .
git commit -m "Ajoute la fiche salarié"
```

- Une branche par module, nommée `module-<n>-<sujet>`.
- Messages de commit en français, à l'impératif.
- On ne fusionne dans `main` qu'après validation du module.
- **`.env` n'est jamais commité.**

---

## 8. En cas de problème

| Symptôme                               | Cause probable                                  | Solution                                                                          |
| -------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| `docker: daemon not running`           | Docker Desktop est fermé                        | Démarrer Docker Desktop, attendre qu'il soit prêt                                 |
| `container is unhealthy`               | Volume dans un état incohérent                  | `pnpm db:down` puis `pnpm db:up`                                                  |
| `DATABASE_URL est absente`             | Pas de fichier `.env`                           | Copier `.env.example` en `.env`                                                   |
| Badge rouge « API injoignable »        | API arrêtée, ou base arrêtée                    | `pnpm db:up` puis `pnpm dev:api`                                                  |
| `Cannot find module './x.service'`     | Extension `.js` oubliée dans un import de l'API | Voir [CONVENTIONS.md §4](./CONVENTIONS.md#4-imports-esm--lextension-js-dans-lapi) |
| `Nest can't resolve dependencies`      | Un `import type` sur une classe injectée        | Retirer le `type` : NestJS a besoin de l'import à l'exécution                     |
| Port 3000 ou 3001 déjà utilisé         | Une instance tourne encore                      | Fermer l'autre terminal, ou changer `API_PORT` dans `.env`                        |
| Erreurs bizarres après un `git pull`   | Dépendances désynchronisées                     | `pnpm install` puis `pnpm --filter @paymarh/api db:generate`                      |
| `PostgreSQL n'est pas demarre` (tests) | Docker arrêté                                   | `pnpm db:up` puis relancer `pnpm test`                                            |

### Repartir de zéro

```bash
pnpm db:down
pnpm install
pnpm db:up
pnpm db:reset
```
