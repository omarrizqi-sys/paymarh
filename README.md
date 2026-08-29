# PaymaRH

**Logiciel de paie marocain pour le secteur privé, en SaaS multi-société.**

PaymaRH s'adresse à deux publics :

- des **entreprises**, qui gèrent la paie de leurs propres salariés ;
- des **cabinets**, qui gèrent la paie de plusieurs sociétés clientes.

> ## État actuel : module 0 — fondations
>
> Ce dépôt contient le **socle technique**, et **aucune fonctionnalité de paie**.
>
> Ce qui fonctionne : la base de données démarre, l'API répond, le back-office s'affiche et joint l'API, l'isolation multi-tenant est en place et testée.
>
> Ce qui n'existe pas encore : bulletins, rubriques, cotisations, absences, déclarations, authentification, portail salarié, application mobile. Chacun viendra par un module dédié.

---

## Démarrage rapide

### 1. Prérequis

| Outil          | Version             | Vérifier avec   |
| -------------- | ------------------- | --------------- |
| Node.js        | LTS (24.x)          | `node -v`       |
| pnpm           | 11.x                | `pnpm -v`       |
| Docker Desktop | récent, **démarré** | `docker info`   |
| Git            | récent              | `git --version` |

Si pnpm manque : `npm install -g pnpm`, puis **rouvrez votre terminal**.

### 2. Installer

```bash
git clone <url-du-depot>
cd paymarh
pnpm install
```

### 3. Créer le fichier d'environnement

```bash
# Linux / macOS
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Les valeurs par défaut fonctionnent telles quelles en développement. Il n'y a **qu'un seul** `.env`, à la racine : Docker, l'API et le back-office le lisent tous. Il est ignoré par Git et ne doit jamais contenir de secret réel.

### 4. Lancer la base de données

```bash
pnpm db:up          # démarre PostgreSQL et attend qu'il soit prêt
pnpm db:migrate     # crée les tables (la première fois)
pnpm db:seed        # crée les données de démonstration (la première fois)
```

Le seed affiche les identifiants créés — **notez celui de l'administrateur de compte**, il sert à interroger l'API.

### 5. Lancer l'API et le back-office

```bash
pnpm dev
```

- **Back-office** : <http://localhost:3000>
- **API** : <http://localhost:3001> — témoin de santé sur <http://localhost:3001/health>

Ouvrez <http://localhost:3000> : la page affiche « PaymaRH — Back-office » et un badge **API en ligne**. Le socle tourne.

---

## Vue d'ensemble de l'architecture

```
Interfaces (clients)          →   API (NestJS)              →   Stockage
──────────────────────            ────────────────              ────────────────
back-office (Next.js)             toute la logique              PostgreSQL
portail salarié*                  moteur de paie (pur)          objets type S3*
application mobile*               isolation multi-tenant
                                  journal d'audit
* n'existent pas encore
```

Six principes régissent le projet. Ils sont **non négociables** et détaillés dans [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) :

1. **API d'abord** — le front ne calcule jamais rien.
2. **Moteur de paie pur** — il reçoit tout en entrée, ne lit jamais la base ; un bulletin doit être rejouable des années plus tard.
3. **Double isolation multi-tenant** — `Account → Company`, filtrage systématique et outillé.
4. **Super-admin séparé** — hors hiérarchie, sans passe-droit, accès élargi motivé et tracé.
5. **Décimal exact** — aucun montant en virgule flottante, jamais.
6. **Livrables hors base** — la base ne garde qu'une référence vers le stockage d'objets.

---

## Organisation du dépôt

```
paymarh/
├── apps/
│   ├── api/                  API REST NestJS — toute la logique
│   └── back-office/          Interface des gestionnaires (Next.js + Turbopack)
├── packages/
│   ├── shared-types/         Types partagés API ↔ interfaces
│   └── config/               Configurations partagées (TypeScript, ESLint, Prettier)
├── base-de-connaissance/     Articles du futur blog — source unique
├── docs/                     Documentation technique
│   ├── ARCHITECTURE.md       Le stack, les couches, les six principes
│   ├── CONVENTIONS.md        Conventions de code
│   ├── DEVELOPMENT.md        Environnement de travail et dépannage
│   └── adr/                  Journal des décisions d'architecture
├── docker-compose.yml        PostgreSQL local
└── .env.example              Variables d'environnement (valeurs d'exemple)
```

---

## Toutes les commandes

### Base de données

| Commande          | Effet                                              |
| ----------------- | -------------------------------------------------- |
| `pnpm db:up`      | Démarre PostgreSQL et attend qu'il soit prêt       |
| `pnpm db:down`    | Arrête PostgreSQL (données conservées)             |
| `pnpm db:logs`    | Journaux de PostgreSQL en continu                  |
| `pnpm db:migrate` | Applique les migrations Prisma                     |
| `pnpm db:seed`    | (Re)crée les données de démonstration — idempotent |
| `pnpm db:reset`   | **Efface tout**, rejoue migrations et seed         |
| `pnpm db:studio`  | Explore la base visuellement                       |

### Développement

| Commande               | Effet                          |
| ---------------------- | ------------------------------ |
| `pnpm dev`             | API + back-office en parallèle |
| `pnpm dev:api`         | API seule                      |
| `pnpm dev:back-office` | Back-office seul               |
| `pnpm build`           | Construit tout                 |
| `pnpm typecheck`       | Vérifie les types partout      |

### Qualité

| Commande              | Effet                          |
| --------------------- | ------------------------------ |
| `pnpm lint`           | ESLint sur tout le dépôt       |
| `pnpm format`         | Prettier réécrit les fichiers  |
| `pnpm format:check`   | Prettier vérifie sans réécrire |
| `pnpm test`           | Vitest sur tout le dépôt       |
| `pnpm check:circular` | madge — imports circulaires    |

**Avant de considérer un module comme terminé**, ces cinq commandes doivent toutes passer :

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm check:circular
```

---

## Deux comportements qui surprennent, et qui sont volontaires

**L'API répond `401` sans en-tête `x-paymarh-user-id`.** Il n'y a aucune authentification au module 0 ; cet en-tête est un relais temporaire de développement. Sans contexte, on ne lit rien : on échoue fermé. Détails dans [`apps/api/README.md`](./apps/api/README.md).

**L'API répond `403` au super-admin sur `GET /companies`.** Ce n'est pas un bogue, c'est le principe 4. Un `PLATFORM_ADMIN` n'a pas de compte de rattachement : le chemin de filtrage normal ne le mène nulle part. Son accès élargi passe par un chemin explicite, motivé et journalisé.

---

## Discipline documentaire

> **À chaque module futur validé, un brouillon d'article est ajouté dans [`base-de-connaissance/`](./base-de-connaissance/), selon le gabarit fourni.**

Le pipeline se fait en deux temps : **brouillon capturé au fil du développement** — par celui qui vient de construire la fonctionnalité, tant que les détails sont frais — puis **finition éditoriale et SEO avant publication**.

Un module n'est pas terminé tant que son brouillon n'existe pas. C'est aussi contraignant que les tests, et pour la même raison : ce qui n'est pas fait quand c'est facile ne se fait jamais.

Au module 0, aucun article métier n'existe : aucune fonctionnalité utilisateur n'a encore été construite.

---

## Documentation

| Document                                                                           | Pour qui                                      |
| ---------------------------------------------------------------------------------- | --------------------------------------------- |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)                                   | Comprendre la structure et les six principes  |
| [`docs/CONVENTIONS.md`](./docs/CONVENTIONS.md)                                     | Écrire du code conforme au projet             |
| [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md)                                     | Installer, lancer, dépanner                   |
| [`docs/adr/`](./docs/adr/)                                                         | Comprendre _pourquoi_ un choix a été fait     |
| [`apps/api/README.md`](./apps/api/README.md)                                       | Travailler sur l'API                          |
| [`apps/back-office/README.md`](./apps/back-office/README.md)                       | Travailler sur le back-office                 |
| [`apps/api/src/payroll-engine/README.md`](./apps/api/src/payroll-engine/README.md) | **À lire avant de toucher au moteur de paie** |
| [`apps/api/src/deliverables/README.md`](./apps/api/src/deliverables/README.md)     | Comprendre le stockage des documents          |
| [`packages/shared-types/README.md`](./packages/shared-types/README.md)             | Ajouter ou modifier un type partagé           |
| [`base-de-connaissance/README.md`](./base-de-connaissance/README.md)               | Rédiger un article                            |

---

## Licence

Propriétaire — tous droits réservés.
