# PaymaRH — Document de contexte (reprise de conversation)

> **Comment m'en servir :** téléverse ce fichier au début d'une nouvelle conversation avec Claude, avec le message d'ouverture fourni à part.
>
> **Version :** remplace intégralement la v4. Dernière mise à jour : fin du **temps 1 de la sous-étape 2.1.c-2** (rubriques d'identité livrées, vérifiées à l'écran, commitées). **446 tests, 69 fichiers, `pnpm verify` vert, arbre propre.**

---

## 1. Le projet

**PaymaRH** — logiciel de paie marocain pour le **secteur privé**, distribué en **SaaS multi-société**.

Objectif : générer des **bulletins de paie** et des **déclarations sociales et fiscales** conformes à la législation marocaine, plus une couche SIRH liée à la paie.

Deux publics : **entreprises** qui gèrent leurs propres salariés, **cabinets** qui gèrent plusieurs sociétés clientes.

Déclarations visées : **CNSS**, **AMO**, **SIMPL-IR**.

> **Nom commercial.** La marque **Adrim** a été retenue pour remplacer PaymaRH, sous réserve des vérifications OMPIC et des noms de domaine. **Le renommage n'est PAS appliqué** : le dépôt, le code, les fichiers de spécification et ce document parlent de PaymaRH. Ne rien renommer sans instruction explicite.

> ⚠️ **Ne pas confondre avec PayloRH**, marque française d'externalisation de paie, entité totalement distincte.

> ⚠️ **Ne jamais transposer le droit français.** Le porteur maîtrise les deux droits et corrige systématiquement. En cas de doute sur une règle marocaine, **poser la question plutôt que supposer**. Pièges déjà rencontrés : le CDI intérimaire et le contrat à objet défini sont des notions françaises ; le barème kilométrique marocain est celui de la CNSS, distinct de celui de la DGI ; il n'existe ni contrat d'apprentissage ni contrat d'insertion au Maroc ; les conventions collectives n'ont pas la même portée.

---

## 2. Profil du porteur et méthode

- Le porteur est **expert paie**, sans background technique. Il ne code pas.
- **Claude sert à réfléchir, cadrer et décider. Cursor sert à développer.**
- Ordre invariable : **on cadre ensemble d'abord** (Claude pose des questions numérotées, le porteur tranche), **puis** Claude rédige le prompt Cursor.
- Le porteur répond **par numéro**. Numéroter les questions et les regrouper par thème.
- Sorties **complètes et prêtes à copier-coller**. Pas d'esquisse partielle.
- Claude accompagne chaque question d'une **recommandation motivée**, pour que le porteur puisse valider par un simple « ok ».
- Il conteste et corrige quand c'est nécessaire — **c'est un signal fiable**, ne pas le contourner.
- Quand un point est trop technique, il le dit et on le reporte. Ne pas insister.
- À chaque module validé, produire **un article de base de connaissance** (manuel utilisateur), rédigé par Cursor à partir de ses notes.

### 2.1 Règles de conduite éprouvées

- **Une seule instruction git par message.** Jamais « commite » et « avant de commiter » ensemble.
- **`pnpm verify` est le seul critère d'acceptation technique.** Ne jamais écrire « lint vert et test vert ».
- **Docker fonctionne désormais chez Cursor** (changement depuis la v4). Il peut lancer `pnpm verify` en entier. **Cela ne change rien à l'acceptation** : ses résultats ne valent pas acceptation, c'est le porteur qui lance la commande. La raison n'a jamais été Docker, c'est le motif constant « le code est écrit, la preuve manque ».
- **Exiger la SORTIE BRUTE de `pnpm verify`, collée depuis le terminal, jamais un résumé.** Leçon coûteuse de la 2.1.c-2 : un rapport a présenté une sortie *reconstituée de mémoire*, avec une commande `madge` fictive traitant zéro fichier et un `next build` amputé de son option. Le dépôt n'avait pas bougé — c'est le rapport qui fabriquait une preuve. **Un résumé de sortie n'est pas une preuve.** Mettre cette exigence dans chaque prompt.
- **Toujours vérifier le rapport de Cursor contre le prompt.** Le motif est constant : le code est écrit, la preuve manque.
- **Vérifier l'arithmétique des tests à chaque livraison.** Total avant, total après, nombre de tests annoncés : les trois doivent se réconcilier. Un écart signale soit un test disparu, soit un rapport inexact — les deux se sont produits.
- **Exiger fichier ET numéro de ligne pour chaque test de la liste nominale.** Un nom de test seul ne se vérifie pas.
- **Exiger la section « Décisions prises seul » dans chaque rapport.** C'est le seul endroit où Cursor déclare ce qu'il a inventé. Quand elle disparaît d'un rapport, la redemander.
- **Se méfier des contrôles qui ne se déclenchent jamais.** Un contrôle correct qu'aucun chemin réel n'atteint est **plus dangereux qu'une absence de contrôle**. Cas vécu en 2.1.c-2 : l'unicité du matricule était testée à la création mais pas à la modification — l'écran remontait une erreur 500 en anglais.
- **Un test qui passe une fois sur deux ne prouve rien.** Le rendre déterministe, jamais le relancer. Trois cas traités en 2.1.c-2 : délais hérités, ordre implicite, collision de codes.
- **Un nom de test qui contredit une règle est un doute à lever**, pas un détail de rédaction.
- **Quand un mécanisme dépend d'un port provisoire, exiger que les tests doublent ce port.**
- **Un test ignoré n'est pas un test réussi.**
- **Ne jamais relâcher une contrainte de production pour faire passer un test.**
- **Se méfier des décorateurs et des exemptions.** Tout mécanisme qui dispense une route d'une vérification doit être refermé par une contrainte réelle. Cas vécu : Cursor a ajouté deux routes neuves à la liste d'exemption du module 1 pour faire passer le contrôle de conformité. La liste est une dette qui se vide, jamais qui s'allonge.
- **Un mécanisme de test ne doit jamais vivre dans le code de production.** Cas vécu : trois exports d'instrumentation étaient bundlés par Next. Si un test ne peut s'écrire sans instrumentation, c'est qu'il teste la mécanique interne au lieu du comportement observable — le réécrire.
- **Demander systématiquement pourquoi un fichier hors périmètre a été modifié.**
- Découper chaque sous-étape en **temps successifs, avec arrêt entre chacun**.
- **Fil Cursor neuf par temps.** Les prompts correctifs restent dans le fil du temps concerné.
- **Modèles Cursor** : Composer 2.5 pour le développement courant, Opus 5 pour l'architecture et les types partagés.
- **Séparer les commits de nature différente** — sauf quand un même fichier est touché par deux temps.
- **La vérification visuelle est une étape à part entière**, pas un bonus. Les tests couvrent la mécanique ; ils ne disent rien de ce que l'écran donne à voir. Deux défauts réels ont été trouvés à l'œil en 2.1.c-2 alors que 442 tests étaient verts.

---

## 3. Stack technique (FIGÉ)

100 % TypeScript, gratuit et open source.

| Couche | Choix |
|---|---|
| Langage | TypeScript 6.0.3, mode strict — ne pas changer la version |
| Runtime | Node.js LTS |
| Paquets | pnpm, monorepo, workspaces |
| Base de données | PostgreSQL 18, Docker en local |
| ORM | Prisma 7.10 |
| Backend | NestJS 12, API REST, ESM |
| Frontend | Next.js 16.3.3 + React + TypeScript, Turbopack |
| UI | Tailwind CSS + shadcn/ui |
| Tableaux | TanStack Table v8 — **module 1 seulement**, voir §5 |
| Calcul monétaire | decimal.js + type Decimal Prisma — **jamais de flottant** |
| Auth | Auth.js, **pas encore installé** |
| Stockage fichiers | abstraction type S3, interface seulement |
| Outillage | ESLint, Prettier, Vitest 4.1, madge |
| Mobile (plus tard) | React Native / Expo |

### 3.1 Conventions d'import — deux règles opposées, outillées

- **API** : l'extension `.js` est **obligatoire** sur les imports relatifs (ESM Nest).
- **Back-office** : l'extension `.js` est **interdite** — Turbopack ne la résout pas.

Une règle ESLint (`no-restricted-imports`, native, aucun paquet ajouté) interdit `.js` sur les imports relatifs de `apps/back-office/src`. Les noms de paquets contenant `.js` (`decimal.js`) ne matchent pas.

**Raison d'être** : deux `.js` recopiés du style API dormaient depuis le temps 2.a et cassaient la compilation du navigateur **sans que `pnpm verify` s'en aperçoive** — le typecheck TypeScript les résout, Turbopack non.

---

## 4. Principes d'architecture (GRAVÉS)

1. **API d'abord** — aucun calcul de paie dans le front, jamais.
2. **Moteur de paie pur et isolé** — `payroll-engine/`, fonction pure, aucun accès base. **Toujours vide à ce stade.**
3. **Double isolation multi-tenant** — `Account → Company → Salarié`. Toute requête filtre par `accountId` puis `companyId`.
4. **Super-admin séparé** — rôle `PLATFORM_ADMIN`, `accountId` nul, accès par chemin `/admin/` tracé.
5. **Décimal exact** — `parseFloat`, `Number.parseFloat`, `Math.round` interdits par ESLint, **front compris**. **Ne jamais désactiver la règle.**
6. **Livrables = monde à part** — les PDF vont au stockage d'objets, pas en base.
7. **Étanchéité de l'information** — aucun message ni code d'erreur ne révèle une donnée hors périmètre. Doublon → « Cette valeur n'est pas disponible. », sans nommer. Ressource d'un autre compte → **404, jamais 403**. Prime sur le confort d'utilisation.
   - **Corollaire écran** : une action ou une rubrique que l'utilisateur n'a pas le droit d'exercer ou de voir est **absente du DOM**. Jamais grisée, jamais masquée en CSS. Le grisé reste légitime pour un état sans rapport avec les droits — Enregistrer inactif tant que rien n'a changé, ligne inactive dans un tableau.
   - **Corollaire données** : `operations` est une **liste de ce que l'utilisateur peut faire**. Jamais un objet du type `{ supprimer: false }`.
   - **Corollaire API** : une clé masquée est **absente** de la réponse, jamais `null`. Une clé à `null` dirait « cette donnée existe et elle est vide ». Le type partagé les déclare donc **optionnelles**, jamais nullables.
8. **Tout calcul et tout contrôle côté serveur** — le front n'en rejoue aucun. Deux exceptions documentées (ADR 0009) : confort de saisie, affichage conditionnel.
9. **Aucune chaîne destinée à l'affichage ne sort de l'API.** L'API rend des données, l'écran compose les phrases.
   - **Exception unique et nommée** : la liste déroulante des situations familiales accorde ses libellés en genre à partir du sexe saisi localement, parce qu'elle affiche des valeurs **non encore choisies**. Le libellé de la valeur enregistrée (`fiche.situationFamiliale.libelle`) vient du serveur et n'est jamais recalculé.
10. **Le français affiché porte ses accents et ses apostrophes typographiques ( ’ ).** La règle « minuscules, tirets, sans accent » vise **les noms de fichiers et de dossiers techniques**, jamais un texte lu par un humain. Un garde-fou (`francais-affiche.spec.ts`) refuse toute élision ASCII (`l'`, `d'`, `n'`…) dans un littéral contenant un mot français. Frontière : **si un utilisateur le lit à l'écran, ça porte des accents ; sinon, non** — codes techniques, identifiants, valeurs stockées, commentaires et noms de tests restent ASCII.

---

## 5. Décisions transverses figées

- **Langue du code mixte** : technique en anglais, **termes métier réglementaires en français** (`salarie`, `emploi`, `bulletin`, `cotisation`, `etablissement`). `Company` reste en anglais (ADR 0005).
- **Mois de paie et mois d'effet** : `String` au format `AAAA-MM`, jamais `DateTime` (ADR 0006).
- **Identifiants légaux** en `String`, jamais en nombre, pour les zéros de tête.
- **Aucune valeur de remplacement** type « À compléter ». Un champ vide vaut mieux qu'une donnée fausse. Quand un référentiel ne fournit pas un seuil, l'alerte n'est simplement pas émise — jamais de seuil inventé.
- **Vocabulaire des états** : « archivé » n'existe pas. Active / inactive / supprimée.
- **Suppressions** : aperçu d'impact avec quantités, puis `DELETE` avec jeton de confirmation en paramètre d'URL (`confirmationJeton`) ; refus `CONFIRMATION_OBSOLETE` (409) si le contexte a changé, `CONFIRMATION_REQUISE` (400) si le jeton manque.
- **Le jeton de confirmation ne porte que des FAITS**, jamais un texte d'affichage. Ligne temporelle : `{ salarieId, ligneId, mode }`. Société : les quantités. Fiche salarié : `{ id }`. Sortie d'emploi : `{ emploiId, dateSortie }`.
  - **Raison** : quand le message entrait dans le hash, corriger une virgule invalidait toutes les confirmations en cours. C'est arrivé avec la restauration des accents.
  - **Conséquence assumée** : sur la **fiche salarié**, le jeton est constant dans le temps. Il prouve qu'un aperçu a eu lieu, **il ne garantit pas la fraîcheur**. Ce n'est pas un trou nouveau : puisqu'on refuse d'énumérer ce que la suppression détruit (étanchéité), il n'y a rien à comparer. Le seul cas d'interdiction réel, le bulletin, est fermé par `SUPPRESSION_INTERDITE`. **Ne pas compter sur ce jeton comme garantie temporelle.**
- **Dossiers et fichiers techniques** : minuscules, tirets, sans accent.
- **Base de connaissance** : `/base-de-connaissance`, un article Markdown par sujet, front-matter SEO. **Les articles sont rédigés par Cursor**, à partir des notes qu'il accumule dans `docs/notes-base-de-connaissance-salarie.md`, sur un prompt écrit par Claude. Le porteur relit.
- **Deux enveloppes de réponse coexistent volontairement** : le module 1 rend `{ data, warnings }`, le module 2 rend `{ donnees, alertes }`. Contredit l'ADR 0005 mais unifier toucherait 330 tests pour un gain cosmétique. **Deux clients API distincts, jamais un client générique.** ADR 0021.
- **TanStack Table** : réservé au module 1. Dans le module 2, une table qui ne trie ni ne pagine côté client utilise directement `shadcn/ui` (`docs/CONVENTIONS.md` §12). Vaudra pour les tableaux répétables du temps 2.

---

## 6. Gestion des droits

Modèle à trois niveaux : `famille de droits` → `socle de l'utilisateur (compte)` → `droits par société`.

- Permissions nommées par opération (`salarie.creer`, `emploi.supprimer`…).
- **Les droits varient d'une société à l'autre.** Un droit porte : qui, quoi, où.
- **Le socle n'est pas un plafond** : il pré-remplit au rattachement, l'administrateur peut ensuite retirer ou ajouter par société.
- **Aucun effet rétroactif** à aucun étage. Contrepartie : outil de modification en masse (module 6).
- **Administrateur principal unique** par compte.
- **La rémunération forme un bloc à droits propres**, lecture et écriture. Seul bloc dans ce cas.

**Opérations exposées au niveau salarié** : `salarie.lire`, `salarie.modifier`, `salarie.supprimer`, `emploi.creer`, `salarie.remuneration.lire`, `salarie.remuneration.ecrire`.
**Au niveau collection** : `salarie.lire`, `salarie.creer`.

Sans `salarie.remuneration.lire`, la clé `comptesBancaires` est **absente** de la réponse — c'est ce qui permet à l'écran de masquer la rubrique sans rien deviner.

Les tables de droits appartiennent toujours au **module d'authentification**, à intercaler avant toute mise en production.

---

## 7. Héritage et historisation

### Héritage — modèle Silae

**Case vide = valeur héritée. Case remplie = valeur propre.** Aucune case à cocher.

Résolution : **`SAL > ETB > SOC > NAT`** (référentiel national).

- Un champ héritable est **toujours nullable en base**. `null` = hérité.
- La valeur résolue s'affiche **en dessous du champ**, en petit, **avec son origine** : « 44 h — établissement Casablanca ».
- **La valeur propre et la valeur résolue ne se mélangent jamais.** La lecture rend la valeur propre telle quelle, `null` compris, et un **objet parallèle** porte les résolutions (ADR 0017).
- **Pas de bouton « tout hériter ».** Vider un champ suffit.
- **Une exception** : les jours fériés travaillés sont des cases à cocher, où « aucune case cochée » est une valeur métier légitime. Un booléen explicite `suivreJoursFeriesEtablissement`, à `true` par défaut, porte l'intention.
- **Le moteur de paie ne lit jamais la fiche société.** Une étape de résolution construit un jeu de paramètres complet et plat avant chaque calcul.

**Champs héritables retenus** (liste close) : durée contractuelle, repos hebdomadaire, télétravail autorisé, indemnité de télétravail, montant de l'indemnité, grille horaire, jours fériés travaillés.

### Historisation — deux mécanismes, et c'est voulu

**Critère unique :** *le moteur a-t-il besoin de cette valeur telle qu'elle était pour recalculer un bulletin d'un mois passé ?*

| Bloc | Porté par | Mécanisme |
|---|---|---|
| `CONTRAT` | Emploi | table de versions datées |
| `REMUNERATION` | Emploi | table de versions datées |
| `AFFECTATION_TEMPS_DE_TRAVAIL` | Emploi | table de versions datées |
| `PERSONNES_A_CHARGE` | Salarié | lignes à validité temporelle |
| `RETENUES` | Salarié | lignes à validité temporelle |

**Règles de comportement :**
- **Le client n'écrit JAMAIS une version ni une date d'effet.** Le serveur décide seul d'écraser ou de versionner. Le front ne doit jamais savoir ce qui est historisé.
- **On écrase sans créer de version** tant qu'aucun bulletin n'existe pour le mois concerné.
- **Modifier un historique n'est jamais bloqué**, même si un bulletin validé existe. La correction déclenchera une régularisation.
- **Date d'effet** : déduite du mois en cours, **sauf la première version d'un bloc porté par un emploi**, qui prend le mois de la date de début de cet emploi.

**Mois de fin — deux règles distinctes :**
- **Suppression** d'une ligne utilisée par un bulletin : elle devient inactive, mois de fin = **mois en cours**.
- **Modification** d'une ligne avec bulletin existant : l'ancienne est close au **mois précédent**, la nouvelle démarre au **mois en cours**.

**Deux lectures d'une même ligne**, volontairement divergentes au mois de clôture : l'**état affiché** (inactive dès le mois de fin) et la **lisibilité pour un mois donné** (fin incluse). Conséquence visible : une personne à charge supprimée s'affiche inactive **tout en restant comptée** au mois en cours. C'est correct, c'est figé par un test, et **c'est à expliquer à l'écran au temps 2**.

Les lignes inactives sont **renvoyées par la lecture**, reconnaissables au champ `etat` valant `'INACTIVE'`.

---

## 8. Le mois en cours et les états du bulletin

Il n'y a pas de clôture mensuelle explicite à la Silae. Le mois en cours est **déduit**, au niveau **salarié**, tous emplois confondus.

**Cinq états**, dont seuls trois sont stockés :

| État | Signification | Stocké ? |
|---|---|---|
| 0 | non calculé, non calculable | non — déduit |
| 1 | non calculé, calculable | non — déduit |
| 2 | calculé | oui |
| 3 | validé | oui |
| 4 | édité (imprimé ou envoyé) | oui |

**Cascade du mois en cours**, dans cet ordre :
1. S'il existe un mois avec au moins un bulletin à l'état 2 ou 3 → **ce mois** (le plus récent).
2. Sinon, si des bulletins existent, tous à l'état 4 → **le mois suivant le plus récent**.
3. Sinon → le mois de début de l'**emploi actif le plus ancien**, ou à défaut le **mois calendaire** (fuseau `Africa/Casablanca`, jamais un décalage fixe : le Maroc repasse à UTC+0 pendant le Ramadan).

**Règle de chaînage à porter au module 2** : le bulletin d'un mois n'est calculable que si le mois précédent est à l'état 4. Cela **exige un point d'ancrage** — un « premier mois de gestion » qui reste à définir.

> Le mois en cours **n'est jamais utilisé pour un affichage de liste** : sa déduction interroge les bulletins, ce qui est hors de question sur cinquante lignes.

---

## 9. Cartographie des modules

1. **Fiches** : société ✅, salariés ⏳ (API livrée, socle, liste et identité livrés ; tableaux et emplois à faire), organismes
2. **Traitement mois** : heures, éléments variables, contrôle des bulletins, import
3. **Gestion** : contact, grilles horaires, planning, imputations analytiques, acomptes, augmentations
4. **Paramétrage** : cotisations, primes, heures, accords, absences, fonctions calculs, masques d'édition, méthodes, liaison comptable, jours fériés, lieux de travail, notes de frais
5. **Référentiel** : cotisations, prélèvement à la source, primes, heures, absences, fonctions calculs
6. **Outils** : synthèses, suivi de production, analyse de l'effectif, **modifications de salariés en masse**
7. **Déclarations** : CNSS, AMO, SIMPL-IR
8. **Alertes**
9. **Simulation**

**Module d'authentification** : à intercaler avant toute mise en production.

---

## 10. État d'avancement

### ✅ Module 0 — Fondations
Monorepo pnpm, PostgreSQL Docker, schéma multi-tenant, `GET /health`, isolation prouvée.

### ✅ Module 1 — Fiche société
Spécification `docs/specification-fiche-societe-v7.md`. Écrans livrés en 1.1.c. Article publié en brouillon, **non relu**. **ADR 0005 à 0010.**

### ✅ Module 2, phase 2 — Cadrage de la fiche salarié : CLOS
`PaymaRH_Fiche_salarie_v5.xlsx` (8 onglets) et `docs/specification-fiche-salarie-v5.md` (fait foi pour Cursor). **111 champs, 96 décisions tracées, 70 règles.**

### ✅ 2.1.a — Modèle de données
Schéma Prisma, migrations, seed de six référentiels, compteurs atomiques, ADR 0011.

### ✅ 2.1.b — API REST
**330 tests.** Cinq prompts, treize passages correctifs. **ADR 0012 à 0020.**

### ✅ 2.1.c-1 — Socle des écrans et liste des salariés
**391 tests.** Découpée en trois temps. **ADR 0021** — enregistrement global et échec partiel.

### ✅ 2.1.c-2, temps 0 — Extensions d'API
**402 tests.** Trois extensions :
- `indexLigne` optionnel sur `AlerteApi`, renseigné **uniquement** par le PUT groupé des comptes bancaires (les trois alertes : format, banque incohérente, RIB déjà utilisé). Absent partout ailleurs, un test le protège.
- `dateSortie` du salarié exposée à la racine de la fiche, déduite du **même prédicat** que l'état (`emploiEstOuvert`). Règle : au moins un emploi ouvert ou aucun emploi → `null` ; sinon la plus récente des dates de sortie, **garantie présente**. Le cas « clos sans date » est inatteignable — **aucun repli écrit**, c'est du code mort.
- **Type `FicheSalarie` unique** dans `packages/shared-types`, annotant le retour de `versFicheSalarie` : un champ renvoyé mais non déclaré fait échouer la compilation. La forme d'un emploi reste volontairement opaque sous l'alias nommé **`EmploiFicheNonType`**, à typer au temps 3.

### ✅ 2.1.c-2, temps 1 — Rubriques d'identité
**446 tests, 69 fichiers.** Vérifié à l'écran. Contenu :
- Quatre blocs réels, trois rubriques de démonstration supprimées
- Deux routes de référentiel neuves : `GET /referentiels/pays` (195, Maroc en tête par la donnée, jamais par un tri d'écran), `GET /referentiels/situations-familiales` (code + libellé masculin + libellé féminin)
- **Temps 1-bis** : correction d'un défaut réel du socle (voir §12)
- Restauration des accents et apostrophes typographiques dans **182 textes** (112 écrans, 62 messages d'API, 8 référentiels) + garde-fou
- Trois salariés de démonstration dans le seed
- Unicité du code banque + résolution déterministe depuis le RIB
- Trace des erreurs d'appel API sur `stderr`
- `next build` ajouté à `pnpm verify`

### ⏭️ Prochaine étape — 2.1.c-2, temps 2 : les tableaux répétables

**Quatre tableaux portés par le salarié** : personnes à charge, comptes bancaires, prêts, saisies. **Cadrage à faire.**

Puis **temps 3** : écran de création, action « Supprimer le salarié » dans le rail, remplacement de `EmploiFicheNonType`.

Puis **2.1.c-3** : emplois, rubriques portées par l'emploi (dont les trois tableaux restants : primes contractuelles, avantages en nature, statuts particuliers), affichage de l'héritage, alertes.

---

## 11. Les écrans — décisions figées

### 11.1 Routes et contexte société

```
/societes/[id]/salaries              liste des salariés de cette société
/societes/[id]/salaries/[salarieId]  fiche d'un salarié
```

**La société est portée par l'URL, jamais par un état applicatif.** Le client HTTP lit l'identifiant dans les paramètres de route et l'envoie en `x-paymarh-company-id`. Ni état global, ni stockage navigateur, ni sélecteur de société.

Raison : les cabinets gèrent plusieurs sociétés. Une société courante gardée en mémoire est un état invisible — deux onglets ouverts, et on saisit un salarié dans la mauvaise entreprise. **Cette décision vaut pour tous les modules à venir.**

### 11.2 Le squelette

Trois colonnes : **sommaire à gauche · rubriques au centre · rail d'actions à droite**.

- Le sommaire **fait défiler** jusqu'à la rubrique. Repliable complètement.
- Les rubriques sont **empilées, toutes visibles, toujours éditables**. Pas de mode lecture.
- Le rail porte Enregistrer et Annuler en tête. **Repliable en colonne d'icônes**, qui restent cliquables avec infobulle.
- L'état replié/déplié est conservé pendant la session.
- La liste des salariés utilise le même squelette **sans la colonne de gauche**.

### 11.3 L'enregistrement — un seul bouton pour une API découpée

L'API modifie **par rubrique** : une rubrique = un appel. L'écran n'a **qu'un seul bouton Enregistrer**.

**Un registre des modifications** partagé par la page. Contrat d'une rubrique (`RubriqueEnregistrable`) : `id`, `libelle`, `estModifiee()`, `envoyer(version)`, **`reinitialiser()`**. Le socle ne connaît le contenu d'aucune rubrique.

Au clic : les rubriques modifiées sont envoyées **une par une, en séquence, dans l'ordre de la page**. Jamais en parallèle.

**Le numéro de version circule.** Le verrouillage optimiste est porté par l'entité — `Salarie.version`, `Emploi.version` — pas par la rubrique. Chaque réponse réussie rend le **nouveau numéro**, que le socle propage aux rubriques restantes.

**Deux natures de refus, deux comportements :**

| Refus | Comportement |
|---|---|
| **Métier** (`400` avec code) | on continue avec les rubriques suivantes ; la rubrique refusée garde sa saisie et affiche le message du serveur |
| **Conflit** (`409` `CONFLIT_VERSION`, `428` `EN_TETE_IF_MATCH_REQUIS`) | on **arrête immédiatement** ; les rubriques non envoyées restent modifiées sans message ; **un seul bandeau, au niveau de la fiche** |

Raison de l'asymétrie : un conflit ne dit pas « cette rubrique est mauvaise », il dit « la fiche entière a changé ». **Un test protège cette asymétrie — ne jamais le fusionner avec un autre.**

**Après un conflit, un seul bouton : « Recharger les valeurs du serveur »**, qui prévient avant d'écraser la saisie. **Ni « Réessayer », ni « Enregistrer quand même », ni fusion.**

**Annuler** abandonne les modifications de toute la fiche, en **nommant les rubriques concernées** dans sa confirmation. Il appelle `reinitialiser()` sur **toutes** les rubriques déclarées et **ne provoque aucun appel serveur**. Ne pas confondre avec « Recharger les valeurs du serveur », qui relit après un conflit.

`reinitialiser()` ramène aux valeurs du **dernier enregistrement réussi**, pas à celles du chargement de la page.

### 11.4 La découpe des rubriques d'identité — quatre blocs, calqués sur l'API

**Une rubrique d'écran = une rubrique d'API, sans exception.** La spécification décrit six blocs, l'API en expose quatre. C'est la découpe de l'API qui fait foi.

| Bloc à l'écran | Route | Contenu |
|---|---|---|
| **Identité** | `PATCH /salaries/:id/identite` | intertitre « Identification » : nom, prénom, sexe · intertitre « État civil » : date, ville et pays de naissance, nationalité, situation familiale |
| **Identifiants et immatriculations** | `PATCH /salaries/:id/identifiants-legaux` | matricule · type de pièce (déduit, non modifiable) · numéro de pièce, CNSS, CIMR |
| **Coordonnées** | `PATCH /salaries/:id/coordonnees` | intertitres « Adresse », « Contact », « Contact d'urgence » (un seul contact) |
| **Dates clés** | `PATCH /salaries/:id/dates` | date d'entrée, date d'ancienneté · date de sortie (déduite, non modifiable) |

Le matricule est dans le **deuxième** bloc, avec les deux autres identifiants uniques par société — le serveur les contrôle ensemble. Les intertitres découpent la lecture, jamais l'enregistrement.

**Les valeurs déduites ne bougent pas avant l'enregistrement.** Le type de pièce porte la mention « mis à jour à l'enregistrement ». L'écran ne recalcule jamais une règle métier. *(La date de sortie ne porte pas cette mention : au temps 1, aucun enregistrement fait sur cet écran ne peut la changer. La question se rouvrira quand les emplois seront éditables.)*

**Les alertes** : avec un nom de champ → sous le champ ; sans nom de champ (homonyme) → en tête de son bloc. **Jamais de bandeau global.** Elles disparaissent dès que l'utilisateur modifie un champ **de ce bloc**, et ne reviennent que si le serveur les renvoie.

**Les refus affichent le message du serveur tel quel.** Ne jamais ajouter d'explication du type « ce matricule est peut-être utilisé par un salarié supprimé » — ce serait une fuite reconstituée par l'écran. C'est inconfortable, c'est délibéré.

### 11.5 Les tableaux répétables — décidé, pas encore construit

Quatre tableaux portés par le salarié : **personnes à charge, comptes bancaires, prêts, saisies**. Les trois autres (primes contractuelles, avantages en nature, statuts particuliers) sont portés par l'**emploi** et relèvent de la 2.1.c-3.

**Le tableau reste un affichage en lecture seule.** Un clic sur une ligne ou sur « Ajouter » déplie le formulaire **juste en dessous, dans la page, sur toute la largeur, en disposition verticale.** Ni saisie dans les cellules, ni panneau latéral. Raisons chiffrées : douze cases à cocher pour les primes, trois identifiants bancaires côte à côte, un champ conditionnel pour les personnes à charge, des lignes propagées en lecture seule.

**Composant générique pour l'enveloppe seulement** — tableau, tri, bouton Ajouter, dépliage, confirmation de suppression — **et un formulaire écrit à la main par tableau.** Pas de générateur de formulaire : les quatre n'ont rien en commun.

**L'API ne traite pas les quatre tableaux de la même façon :**

| Tableau | Routes | Aperçu d'impact |
|---|---|---|
| Personnes à charge | POST / PATCH / DELETE par ligne | oui |
| Prêts | POST / PATCH / DELETE par ligne | oui |
| Saisies | POST / PATCH / DELETE par ligne | oui |
| **Comptes bancaires** | **PUT de la liste entière** | **n'existe pas** |

Le remplacement global des comptes est cohérent avec la contrainte C23 : la somme des parts doit faire exactement 100 %, ce qui n'a de sens que sur la liste complète.

**Enregistrement à deux vitesses, assumé :**

| | Ajout et modification | Suppression |
|---|---|---|
| Comptes bancaires | différés, via Enregistrer | **différée aussi** |
| Personnes à charge, prêts, saisies | différés, via Enregistrer | **immédiate**, avec aperçu et jeton |

La suppression immédiate est inévitable : l'aperçu d'impact exige un aller-retour serveur et un jeton qui périmerait s'il attendait. **La confirmation doit dire explicitement que la suppression est immédiate et ne sera pas annulée par le bouton Annuler.**

**Les lignes inactives sont affichées**, en grisé, avec la mention « inactive depuis MM/AAAA », sans filtre ni bascule. Le grisé porte ici un état, pas un droit.

### 11.6 Les emplois — 2.1.c-3

**Accordéon : les emplois sont empilés sur la même page.** Un seul emploi → le sélecteur s'efface. Deux ou plus → les emplois clos sont repliés derrière « afficher les emplois terminés ».

### 11.7 La création d'un salarié — temps 3

L'écran de création affiche **toutes les rubriques d'identité**, pas un formulaire réduit. **Un salarié peut être créé sans aucun emploi.** Aucun tableau répétable : on enregistre, on arrive sur la fiche, on ajoute ensuite.

**Différence structurelle à traiter** : la création est **un seul appel** (`POST /salaries` accepte toute l'identité), alors que le registre envoie une rubrique par appel. Le registre devra savoir se comporter en deux modes.

### 11.8 La liste des salariés

**Colonnes** : matricule · nom · prénom · état · date d'entrée · poste · établissement.

**La colonne poste** est composée par l'écran à partir de deux champs :

| Situation | `poste` | `nombreEmploisOuverts` | Affichage |
|---|---|---|---|
| Un seul emploi ouvert | libellé | 1 | le libellé |
| Plusieurs emplois ouverts | `null` | 2, 3… | « N emplois » |
| Salarié sorti | poste du dernier emploi clos | 0 | ce libellé |
| Aucun emploi | `null` | 0 | rien |

**Aucun tri.** Le serveur trie par nom puis prénom. Un tri côté client sur une page paginée ne trierait que la page affichée.

**Pagination par curseur** : « Charger plus », qui disparaît quand `prochainCurseur` est nul. **Pas de numéro de page, pas de total.** Tout changement de filtre remet à zéro l'accumulation.

**Filtres** : état (tous / actifs / inactifs, **rien présélectionné**) et établissement (envoie l'identifiant, affiche le libellé).

**Deux écrans vides distincts** : aucun salarié dans la société, et recherche sans résultat.

**Le matricule est un lien réel** vers la fiche, en plus du clic sur la ligne — sinon impossible d'ouvrir une fiche dans un nouvel onglet.

---

## 12. Ce que la 2.1.c-2 a appris — à ne pas réapprendre

**Un rapport peut fabriquer une preuve.** Une sortie de `pnpm verify` reconstituée de mémoire annonçait « aucun cycle » sur **zéro fichier traité**, et un `next build` amputé de son option. Le dépôt était intact. **Exiger la sortie brute, collée, dans chaque prompt.**

**`pnpm verify` ne couvrait pas la compilation du front.** Deux imports avec extension `.js`, dormant depuis deux jours, cassaient l'écran des salariés dans le navigateur avec 430 tests verts — le typecheck TypeScript les résout, Turbopack non. `next build` est désormais **en dernière position** de la chaîne (le plus lent en dernier). La compilation de l'API n'y est pas : à discuter séparément.

**Un contrôle testé à la création peut manquer à la modification.** L'unicité du matricule remontait en erreur 500 anglaise depuis l'écran, alors que tous les tests d'unicité passaient : la route de modification n'interceptait pas l'erreur métier. Vérifier **quel chemin** un test couvre, pas seulement qu'il existe.

**Une hypothèse n'est pas un diagnostic.** Six tests d'intégration échouaient ; Cursor a supposé « React 19 » et contourné. La vraie cause était un problème d'ordre banal : une copie synchronisée au rendu de l'enfant alors que le parent la lit avant. **Exiger la cause avant la correction, et un test qui échoue sur le code d'avant.**

**Un défaut d'ordonnancement peut faire perdre une saisie silencieusement.** Après un enregistrement, la resynchronisation serveur arrivait en retard et écrasait une saisie faite entre-temps — 3 % en isolation, 17 % sous charge. La distinction saisie/serveur doit reposer sur un **drapeau explicite**, jamais sur un ordre d'exécution ou un délai.

**Trois tests instables, trois causes différentes, aucune n'était « la machine ».** Délai de 5 s hérité par défaut sur un test qui démarre l'application entière (les trois autres tests lourds du dépôt avaient un délai posé) ; date la plus récente qui était aussi le dernier élément du tableau (corrigé en mettant le **maximum au milieu de trois** valeurs, ce qui rend le test insensible à l'ordre) ; code de banque tiré de l'horloge sur 800 valeurs, avec 377 fixtures jamais nettoyées.

**Le nettoyage entre tests doit couvrir ce que les tests créent.** 392 banques parasites s'étaient accumulées en base.

**Une erreur avalée coûte une soirée.** Un `catch` sans paramètre transformait toute panne en message générique, sans aucune trace. Le helper écrit désormais sur `stderr` (jamais `console.*`, que Next relaie vers le navigateur en développement) et a trouvé la vraie cause en une seule exécution — une fonction d'un fichier `'use client'` appelée pendant le rendu serveur.

**Un filtre de trace doit être étroit.** Le signal Next de bascule en route dynamique produisait 746 lignes par build. Filtré sur un **préfixe exact**, pas sur une catégorie, avec un test prouvant qu'une vraie erreur passe toujours.

**Un garde-fou qui crie à tort sera ignoré.** Le motif « liste de mots français sans accents » produisait des faux positifs irréductibles sur de vrais messages techniques. Cursor s'est arrêté et l'a dit plutôt que d'ajouter une liste blanche. **Mieux vaut pas de garde-fou qu'un garde-fou qu'on apprend à ignorer.**

**Une exemption ne s'allonge jamais.** Deux routes neuves avaient été ajoutées à la liste d'exemption du module 1 pour faire passer le contrôle de conformité.

**Le principe d'étanchéité peut vider un mécanisme de sa substance.** Le jeton de suppression de fiche ne compare rien, parce qu'on refuse d'énumérer ce qui sera détruit. Ce n'est pas un trou nouveau, c'est une conséquence — mais il faut le savoir plutôt que de compter sur une garantie qui n'existe pas.

**Les tests ne voient pas l'écran.** Deux défauts réels trouvés à l'œil avec 442 tests verts.

---

## 13. Le modèle de la fiche salarié — l'essentiel

**Structure : identité (1) + emplois (N).** Pas d'objet « contrat » : le type de contrat est un champ de l'emploi. Un CDD transformé en CDI reste **le même emploi**. Une rupture suivie d'une réembauche crée un **nouvel emploi**.

Deux emplois peuvent coexister dans la même société, y compris dans deux établissements différents. **Aucune limite.**

| Porté par le **salarié** | Porté par l'**emploi** |
|---|---|
| Identité, état civil, coordonnées | Poste, dates, type de contrat, période d'essai |
| Immatriculations (CNSS, CIMR) | Établissement, service, département |
| Personnes à charge | Temps de travail, grille horaire, repos hebdomadaire |
| Comptes bancaires | Jours fériés travaillés, télétravail |
| Date d'entrée, date d'ancienneté | Rémunération, paiement |
| Prêts, saisies sur salaire | Primes, avantages en nature, statuts particuliers |

**Deux sorties** : sortie d'emploi (STC) et sortie du salarié, **déduite** de la clôture du dernier emploi ouvert. L'état du salarié est déduit, jamais saisi.

**Une seule ancienneté par salarié**, au niveau salarié.

### Emplois multiples et calcul

- **Deux emplois = deux bulletins.** Plafonds et barèmes sur le **total des assiettes**.
- **Tout au prorata des assiettes** : IR, abattement, charges de famille, plafond CNSS, prêts, saisies.
- Jours plafonnés à **26**. Écart d'arrondi sur le bulletin de l'assiette la plus élevée.
- **Déclarations** : une seule ligne consolidée par salarié. **À faire confirmer auprès des administrations.**
- **Le moteur est appelé au niveau salarié × mois** et rend N bulletins. ADR à produire au module 4.

### Chaîne de calcul

**Fiche → éléments variables → bulletin, pour les PRIMES SEULEMENT.** Le salaire de base, les avantages en nature, les prêts et les saisies alimentent le bulletin directement — d'où leur historisation.

La fiche porte le **rattachement** d'une prime (code + mois d'application), jamais un montant. Les avantages en nature, eux, portent un montant.

### Valeurs déduites — jamais stockées

Type de pièce d'identité · date de sortie du salarié · état actif/inactif · solde restant d'un prêt · durée du travail dans l'autre base · durée de la période d'essai · nombre de personnes à charge · libellé accordé en genre de la situation familiale · mois en cours.

Toutes présentes dans la réponse de lecture : `typePieceIdentite`, `dateSortie`, `etat`, `prets[].soldeRestant`, `nombrePersonnesACharge`, `situationFamiliale.libelle`, `moisEnCours`.

### Trois unicités, toutes par société

Matricule (toujours) · numéro de pièce d'identité (si renseigné) · numéro CNSS (si renseigné). **Aucun contrôle ne traverse la frontière d'une société**, y compris entre sociétés d'un même cabinet.

**Un matricule attribué n'est jamais réattribué**, même après suppression (ADR 0019).

### Une donnée sensible

`situationHandicap` sur les personnes à charge, visible seulement pour un enfant. Marquée `sensible`, sans droits propres à ce stade.

### Une exception : TAHFIZ

Exonération **portée par la société**, pas un statut saisi salarié par salarié. Son activation propage le statut à tous les salariés **ayant un emploi ouvert**, existants et futurs — jamais aux salariés sortis.

Au **retrait** : ligne jamais utilisée par un bulletin → supprimée ; ligne déjà utilisée → inactivée avec un mois de fin. Un **rétrécissement** des dates ne peut jamais amputer un mois déjà couvert par un bulletin produit.

Une ligne propagée est en **lecture seule** depuis la fiche salarié.

### Le code d'une banque est unique

Les trois premiers chiffres du RIB sont l'**identifiant Bank Al-Maghrib** de l'établissement bancaire. Contrainte d'unicité en base, champ nullable (PostgreSQL autorise plusieurs `NULL`), résolution par `findUnique`. **Aucun tri, aucun repli** : si rien ne correspond, on ne pré-remplit pas.

**Les 21 codes du référentiel sont vides**, donc le pré-remplissage est **inerte en production**. Le test qui le couvre fabrique sa propre banque — un commentaire le signale.

---

## 14. Points ouverts

| Réf | Sujet | État |
|---|---|---|
| — | Béquilles de dev `x-paymarh-user-id`, `NEXT_PUBLIC_PAYMARH_USER_ID`, `x-paymarh-permissions-refusees` | **bloquent la mise en production** |
| — | **Béquille des permissions refusées prouvée sur une route sonde uniquement.** Risque faible (garde global partagé) | à refermer au module d'authentification |
| — | **Avertissement de navigation partiel.** Seuls la fermeture d'onglet et le lien de retour sont couverts. Next.js 16 n'offre pas de garde au niveau du routeur. **La solution devra être une contrainte outillée** (règle de lint interdisant le lien standard dans la zone de la fiche) | temps 2 ou 3 |
| — | **Page d'accueil du back-office** : affiche l'adresse de l'API, sa version et « authentification non implémentée » | à retirer avant production |
| — | Liste d'exemption du module 1 : 35 routes sur l'ancien mécanisme de droits. **Ne jamais l'allonger.** | à vider à la reprise du module 1 |
| X3 | **Codes des 21 banques du référentiel, tous vides.** Pré-remplissage depuis le RIB et alerte d'incohérence prouvés par test mais **inertes en production** | travail de données, à faire par le porteur |
| — | **`EmploiFicheNonType`** : la forme d'un emploi est volontairement opaque dans le type partagé | à typer au temps 3 |
| — | **Le jeton de suppression de fiche est constant** : il prouve qu'un aperçu a eu lieu, il ne garantit pas la fraîcheur. Conséquence de l'étanchéité, pas un trou nouveau | à ne pas prendre pour une garantie |
| — | **Mention « mis à jour à l'enregistrement » absente sous la date de sortie**, à raison au temps 1 (rien sur cet écran ne peut la changer) | à rouvrir en 2.1.c-3 |
| — | **Compilation de l'API absente de `pnpm verify`.** `nest build` n'exige pas de base, mais n'a pas le filet de Turbopack | à discuter |
| — | `BulletinPort` et `ReferentielNationalPort` provisoires : sept mécanismes en dépendent | modules 2, 4 et 5 |
| — | Premier mois de gestion : point d'ancrage du chaînage des bulletins | module 2 |
| — | **Articles de base de connaissance non relus** : fiche société, et fiche salarié (règles de gestion) | relecture par le porteur |
| — | **Captures d'écran des articles** : automatisables avec Playwright (non installé). À mettre en place **en fin de 2.1.c**, quand les écrans seront stables. Le prompt devra demander à Cursor de poser des marqueurs d'emplacement | fin 2.1.c |
| — | 26 requêtes SQL par lecture d'une fiche | à mesurer sur données réelles |
| — | Divergence des enveloppes de réponse module 1 / module 2 | assumée, ADR 0021 |
| — | **Dérive CRLF sous Windows** : un fichier non modifié peut faire échouer `prettier --check` avec un diff vide. Un fichier `.gitattributes` réglerait le problème définitivement | non fait, son propre commit |
| Z14 | Trois retouches sur la fiche société v7, **plus** l'AuditLog du module 1 sans `accountId` ni `companyId` | prochain passage sur le module 1 |
| Z6 | Faire confirmer par la CNSS et la DGI la consolidation en une ligne par salarié | vérification métier |
| Z9 | Référentiels service et département | autre module |
| Y7 | Console d'administration du référentiel | modules 4 et 5 |
| — | Apparition d'une date de sortie **hors intervalle** : alerte et confirmation devraient coexister, non testé | 2.1.c-3 |
| — | C24 ne se déclenche pas sur un emploi portant sa propre référence de grille horaire | module 3 |
| — | Personne à charge inactive mais encore comptée : à expliquer à l'écran | temps 2 |
| — | Liberia / Nigeria : graphies sans accent conservées, conformes à l'usage administratif | classé |
| — | Vérifications OMPIC et noms de domaine pour la marque Adrim | en attente |

---

## 15. Environnement

- **GitHub** : `https://github.com/omarrizqi-sys/paymarh.git`, branche `main`, Git connecté à Cursor.
- **Cursor travaille sur le dépôt local.** Un fichier produit par Claude doit être **déposé dans le dépôt**. **Cursor ne peut pas lire un `.xlsx`** — toujours fournir la version Markdown.
- **Docker fonctionne chez le porteur ET chez Cursor.** `pnpm db:up` démarre PostgreSQL.
- **`pnpm verify`** = `lint && format:check && typecheck && test && check:circular && back-office build`. **C'est la seule commande de validation, et c'est le porteur qui la lance.**
- `madge` rapporte constamment **2 avertissements** — deux imports CSS qu'il ne sait pas analyser. Bénins, à ne pas réinstruire.
- **Lancer les commandes une par une**, jamais en parallèle.
- **Voir le rendu en local** : `pnpm db:up`, puis `pnpm --filter api dev`, puis `pnpm --filter back-office dev`, puis `http://localhost:3000`. Le fichier `apps/back-office/.env` porte `NEXT_PUBLIC_PAYMARH_USER_ID`, dont la valeur est affichée par `pnpm db:seed`. **Next ne relit pas ce fichier à chaud** — redémarrer après modification.
- **Le seed crée trois salariés de démonstration** dans la société DEMO-001 : un complet et actif (avec personnes à charge, comptes, prêt), un minimal sans emploi, une salariée sortie de nationalité étrangère (qui prouve « Mariée » et « carte de séjour »).
- **Quand un écran refuse de s'afficher**, la vraie erreur est dans le **terminal du back-office** — le helper de trace y écrit sur `stderr`. Elle n'apparaît ni dans le navigateur, ni dans l'onglet Réseau si l'appel part du serveur.
- **Environnement PowerShell** : `curl` est un alias — utiliser `curl.exe` ou `Invoke-RestMethod`. `rmdir /s /q` n'existe pas — utiliser `Remove-Item -Recurse -Force`.
- **Commit manuel** : `git add <chemins>` → `git commit -m "..."` → `git push`.

---

## 16. Rappels de méthode

- Claude **cadre et décide avec le porteur d'abord**, puis fournit **un prompt Cursor complet** par temps.
- Le prompt Cursor doit toujours : donner le contexte, rappeler le socle à réutiliser, délimiter le périmètre strict (à faire / à NE PAS faire), lister les `.md` à créer, poser des **critères d'acceptation vérifiables par un non-codeur**, exiger la **liste nominale des tests avec fichier et numéro de ligne**, exiger la section **« Décisions prises seul »**, exiger la **sortie brute de `pnpm verify`**, et demander à Cursor de **s'arrêter et poser la question** si un choix n'est pas couvert.
- **Le critère d'acceptation technique est `pnpm verify` vert chez le porteur.**
- **Après chaque temps livré : vérification visuelle à l'écran**, avec une liste de points numérotés fournie par Claude.
- Exiger que Cursor **propose toute dépendance avant installation**.
- Ne jamais introduire de logique métier hors du module en cours.
- **Vérifier systématiquement les rapports de Cursor** : arithmétique des tests, tests annoncés contre tests exigés, contrôles déclenchables contre contrôles théoriques, contraintes de production contre confort de test, fichiers hors périmètre modifiés, sortie brute contre résumé.
- **Quand Cursor s'arrête et pose une question, c'est le comportement attendu** — le lui dire. Trois arrêts en 2.1.c-2 ont évité autant de contournements, et l'un d'eux a corrigé une erreur de Claude.
- **Claude signale au porteur quand ouvrir une nouvelle conversation** est optimal, et fournit ce document mis à jour à ce moment-là.
- **Claude signale quand repasser en réflexion élevée** : cadrage d'un nouveau temps, production du document de contexte, arbitrage d'architecture. La relecture de rapports se fait très bien en réflexion moyenne.
