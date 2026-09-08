# PaymaRH — Document de contexte (reprise de conversation)

> **Comment m'en servir :** téléverse ce fichier au début d'une nouvelle conversation avec Claude, avec le message d'ouverture fourni à part.
>
> **Version :** remplace intégralement la v4 et la v5. Dernière mise à jour : fin du **temps 2.a de la sous-étape 2.1.c-2** (enveloppe générique des tableaux et rubrique Personnes à charge livrées, vérifiées à l'écran, commitées, poussées). **483 tests, 73 fichiers, `pnpm verify` vert, arbre propre.**

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
- **Écrire pour un non-développeur.** Les questions de cadrage doivent partir d'une situation concrète à l'écran, pas d'un mécanisme technique. Leçon du temps 2 : une première série de questions a dû être intégralement réécrite parce qu'elle était incompréhensible. **Si une question ne peut pas s'expliquer par « voilà ce que l'utilisateur fait, voilà ce qui se passe », elle est mal posée.**
- Sorties **complètes et prêtes à copier-coller**. Pas d'esquisse partielle.
- Claude accompagne chaque question d'une **recommandation motivée**, pour que le porteur puisse valider par un simple « ok ».
- Il conteste et corrige quand c'est nécessaire — **c'est un signal fiable**, ne pas le contourner.
- Quand un point est trop technique, il le dit et on le reporte. Ne pas insister.
- À chaque module validé, produire **un article de base de connaissance** (manuel utilisateur), rédigé par Cursor à partir de ses notes.
- **Claude indique à la fin de CHAQUE message quel modèle (Sonnet ou Opus) et quel effort de réflexion (faible, moyen, élevé) paramétrer pour le message suivant.** Sans justification, sauf si le porteur la demande. Repères : cadrage d'un nouveau temps, rédaction d'un prompt Cursor, production du document de contexte → **Opus, élevé**. Relecture d'un rapport de Cursor → **Opus, moyen**. Instructions git, échanges courts, confirmations → **Opus, faible**.

### 2.1 Règles de conduite éprouvées

- **Une seule instruction git par message.** Jamais « commite » et « avant de commiter » ensemble.
- **`pnpm verify` est le seul critère d'acceptation technique.** Ne jamais écrire « lint vert et test vert ».
- **Docker fonctionne chez Cursor.** Il peut lancer `pnpm verify` en entier. **Cela ne change rien à l'acceptation** : ses résultats ne valent pas acceptation, c'est le porteur qui lance la commande.
- **Exiger la SORTIE BRUTE de `pnpm verify`, collée depuis le terminal, jamais un résumé.** Leçon coûteuse de la 2.1.c-2 : un rapport a présenté une sortie *reconstituée de mémoire*, avec une commande `madge` fictive traitant zéro fichier et un `next build` amputé de son option. **Un résumé de sortie n'est pas une preuve.** Mettre cette exigence dans chaque prompt.
- **Toujours vérifier le rapport de Cursor contre le prompt.** Le motif est constant : le code est écrit, la preuve manque.
- **Vérifier l'arithmétique des tests à chaque livraison.** Total avant, total après, nombre de tests annoncés : les trois doivent se réconcilier.
- **Exiger fichier ET numéro de ligne pour chaque test de la liste nominale.**
- **Exiger la section « Décisions prises seul » dans chaque rapport.** Quand elle disparaît, la redemander.
- **Un test qui passe sans exercer le défaut qu'il prétend couvrir est un échec, pas un test.** Exiger une **preuve d'échec** : introduire temporairement le défaut, lancer le test, coller la sortie de l'échec, remettre le code correct. Deux cas vécus au temps 2.a, tous deux détectés par cette exigence (T18, puis T34).
- **Se méfier des contrôles qui ne se déclenchent jamais.** Un contrôle correct qu'aucun chemin réel n'atteint est **plus dangereux qu'une absence de contrôle**.
- **Un test qui passe une fois sur deux ne prouve rien.** Le rendre déterministe, jamais le relancer.
- **Un nom de test qui contredit une règle est un doute à lever**, pas un détail de rédaction.
- **Quand un mécanisme dépend d'un port provisoire, exiger que les tests doublent ce port.**
- **Un test ignoré n'est pas un test réussi.**
- **Ne jamais relâcher une contrainte de production pour faire passer un test.**
- **Se méfier des décorateurs et des exemptions.** La liste d'exemption est une dette qui se vide, jamais qui s'allonge.
- **Un mécanisme de test ne doit jamais vivre dans le code de production.**
- **Demander systématiquement pourquoi un fichier hors périmètre a été modifié**, et exiger une explication vérifiable. Cas vécu au temps 2.a : « déjà modifié en début de branche » s'est révélé faux après vérification, Cursor l'a lui-même corrigé.
- **Exiger la cause avant la correction.** Une hypothèse n'est pas un diagnostic.
- **Quand un comportement ne peut pas être testé honnêtement, préférer l'aveu au faux test.** Cas vécu : le défilement du sommaire, dont la précision dépend de hauteurs de mise en page que jsdom ne simule pas. Cursor l'a dit au lieu d'écrire un test décoratif. **La charge bascule alors sur la vérification à l'œil, qui doit être explicitement listée.**
- Découper chaque sous-étape en **temps successifs, avec arrêt entre chacun**.
- **Fil Cursor neuf par temps.** Les prompts correctifs restent dans le fil du temps concerné.
- **Modèles Cursor** : Composer 2.5 pour le développement courant, Opus 5 pour l'architecture et les types partagés.
- **Séparer les commits de nature différente** — sauf quand un même fichier est touché par deux temps.
- **La vérification visuelle est une étape à part entière**, pas un bonus. Les tests couvrent la mécanique ; ils ne disent rien de ce que l'écran donne à voir. **Cinq défauts réels trouvés à l'œil à ce jour, tous avec une suite de tests verte.**

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

Une règle ESLint (`no-restricted-imports`, native) interdit `.js` sur les imports relatifs de `apps/back-office/src`. Les noms de paquets contenant `.js` (`decimal.js`) ne matchent pas.

**Raison d'être** : deux `.js` recopiés du style API cassaient la compilation du navigateur **sans que `pnpm verify` s'en aperçoive** — le typecheck TypeScript les résout, Turbopack non.

### 3.2 Prettier et les documents de référence

`docs/PaymaRH-Contexte-Reprise-*.md` est dans `.prettierignore`. Ce document est rédigé à la main, ce n'est pas un livrable technique, et il ne doit jamais bloquer `pnpm verify` ni être reformaté.

---

## 4. Principes d'architecture (GRAVÉS)

1. **API d'abord** — aucun calcul de paie dans le front, jamais.
2. **Moteur de paie pur et isolé** — `payroll-engine/`, fonction pure, aucun accès base. **Toujours vide à ce stade.**
3. **Double isolation multi-tenant** — `Account → Company → Salarié`. Toute requête filtre par `accountId` puis `companyId`.
4. **Super-admin séparé** — rôle `PLATFORM_ADMIN`, `accountId` nul, accès par chemin `/admin/` tracé.
5. **Décimal exact** — `parseFloat`, `Number.parseFloat`, `Math.round` interdits par ESLint, **front compris**. **Ne jamais désactiver la règle.**
6. **Livrables = monde à part** — les PDF vont au stockage d'objets, pas en base.
7. **Étanchéité de l'information** — aucun message ni code d'erreur ne révèle une donnée hors périmètre. Doublon → « Cette valeur n'est pas disponible. », sans nommer. Ressource d'un autre compte → **404, jamais 403**. Prime sur le confort d'utilisation.
   - **Corollaire écran** : une action ou une rubrique que l'utilisateur n'a pas le droit d'exercer ou de voir est **absente du DOM**. Jamais grisée, jamais masquée en CSS. **Le grisé reste légitime pour un état sans rapport avec les droits** — Enregistrer inactif tant que rien n'a changé, ligne inactive dans un tableau, **bouton Supprimer grisé pendant un aller-retour serveur**.
   - **Corollaire données** : `operations` est une **liste de ce que l'utilisateur peut faire**. Jamais un objet du type `{ supprimer: false }`.
   - **Corollaire API** : une clé masquée est **absente** de la réponse, jamais `null`. Le type partagé les déclare donc **optionnelles**, jamais nullables.
8. **Tout calcul et tout contrôle côté serveur** — le front n'en rejoue aucun. Deux exceptions documentées (ADR 0009) : confort de saisie, affichage conditionnel.
9. **Aucune chaîne destinée à l'affichage ne sort de l'API.** L'API rend des données, l'écran compose les phrases.
   - **Exception 1** : la liste déroulante des situations familiales accorde ses libellés en genre à partir du sexe saisi localement, parce qu'elle affiche des valeurs **non encore choisies**. Le libellé de la valeur enregistrée vient du serveur et n'est jamais recalculé.
   - **Exception 2** (ajoutée au temps 2.a) : le champ `message` de l'**aperçu d'impact avant suppression**. Seul le serveur sait si la ligne sera supprimée définitivement ou rendue inactive, et pourquoi. L'écran l'affiche **tel quel**, sans le reformuler ni le fusionner.
   - Les deux exceptions sont listées dans `docs/CONVENTIONS.md` **à l'intérieur de la règle elle-même**, pas dans une section séparée : une exception rangée loin de sa règle n'est jamais trouvée.
10. **Le français affiché porte ses accents et ses apostrophes typographiques ( ’ ).** La règle « minuscules, tirets, sans accent » vise **les noms de fichiers et de dossiers techniques**, jamais un texte lu par un humain. Un garde-fou (`francais-affiche.spec.ts`) refuse toute élision ASCII dans un littéral contenant un mot français. Frontière : **si un utilisateur le lit à l'écran, ça porte des accents ; sinon, non**.

---

## 5. Décisions transverses figées

- **Langue du code mixte** : technique en anglais, **termes métier réglementaires en français** (`salarie`, `emploi`, `bulletin`, `cotisation`, `etablissement`). `Company` reste en anglais (ADR 0005).
- **Mois de paie et mois d'effet** : `String` au format `AAAA-MM`, jamais `DateTime` (ADR 0006).
- **Identifiants légaux** en `String`, jamais en nombre, pour les zéros de tête.
- **Aucune valeur de remplacement** type « À compléter ». Un champ vide vaut mieux qu'une donnée fausse. Quand un référentiel ne fournit pas un seuil, l'alerte n'est simplement pas émise — jamais de seuil inventé.
- **Vocabulaire des états** : « archivé » n'existe pas. Active / inactive / supprimée.
- **L'ordre d'un référentiel est porté par la DONNÉE**, jamais par un tri alphabétique, jamais par un tri d'écran. Un champ `ordre` dans la table. Vaut pour `Pays` (Maroc en tête) et pour `LienParente` (Enfant = 1, Conjoint = 2). **Règle générale pour tout référentiel à venir.**
- **Suppressions** : aperçu d'impact, puis `DELETE` avec jeton de confirmation en paramètre d'URL (`confirmationJeton`) ; refus `CONFIRMATION_OBSOLETE` (409) si le contexte a changé, `CONFIRMATION_REQUISE` (400) si le jeton manque.
- **Le jeton de confirmation ne porte que des FAITS**, jamais un texte d'affichage. Ligne de tableau : `{ salarieId, ligneId, mode }`. Société : les quantités. Fiche salarié : `{ id }`.
  - **Raison** : quand le message entrait dans le hash, corriger une virgule invalidait toutes les confirmations en cours.
  - **Conséquence assumée** : sur la **fiche salarié**, le jeton est constant dans le temps. Il prouve qu'un aperçu a eu lieu, **il ne garantit pas la fraîcheur**. **Ne pas compter sur ce jeton comme garantie temporelle.**
- **Dossiers et fichiers techniques** : minuscules, tirets, sans accent.
- **Base de connaissance** : `/base-de-connaissance`, un article Markdown par sujet, front-matter SEO. **Les articles sont rédigés par Cursor**, à partir de `docs/notes-base-de-connaissance-salarie.md`, sur un prompt écrit par Claude. Le porteur relit.
- **Deux enveloppes de réponse coexistent volontairement** : le module 1 rend `{ data, warnings }`, le module 2 rend `{ donnees, alertes }`. **Deux clients API distincts, jamais un client générique.** ADR 0021.
- **TanStack Table** : réservé au module 1. Dans le module 2, une table qui ne trie ni ne pagine côté client utilise directement `shadcn/ui` (`docs/CONVENTIONS.md` §12).

---

## 6. Gestion des droits

Modèle à trois niveaux : `famille de droits` → `socle de l'utilisateur (compte)` → `droits par société`.

- Permissions nommées par opération (`salarie.creer`, `emploi.supprimer`…).
- **Les droits varient d'une société à l'autre.** Un droit porte : qui, quoi, où.
- **Le socle n'est pas un plafond** : il pré-remplit au rattachement, l'administrateur peut ensuite retirer ou ajouter par société.
- **Aucun effet rétroactif** à aucun étage. Contrepartie : outil de modification en masse (module 6).
- **Administrateur principal unique** par compte.
- **La rémunération forme un bloc à droits propres**, lecture et écriture. Seul bloc dans ce cas.

### 6.1 Ce que la lecture d'une fiche expose réellement (vérifié au temps 2.a)

`GET /salaries/:id` rend une liste `operations` **à la racine de la fiche** (`donnees.operations`) et **sur chaque emploi** (`donnees.emplois[].operations`). **Jamais par rubrique ni par ligne de tableau.**

Racine, valeurs possibles aujourd'hui : `salarie.lire`, `salarie.modifier`, `salarie.supprimer`, `emploi.creer`, `salarie.remuneration.lire`, `salarie.remuneration.ecrire`.

Emploi : `emploi.modifier`, `emploi.supprimer`, `salarie.remuneration.lire`, `salarie.remuneration.ecrire`.

`salarie.remuneration.ecrire` est **indépendante** de `salarie.remuneration.lire` : l'écran peut donc traiter le cas « je vois mais je ne modifie pas » sans rien deviner.

Sans `salarie.remuneration.lire`, la clé `comptesBancaires` est **absente** de la réponse.

> **Conséquence à retenir pour la 2.1.c-3** : `operations` n'existe pas au niveau d'une ligne. Une ligne de statut particulier propagée par la société, qui doit être en lecture seule sans bouton de suppression, **ne pourra pas s'appuyer sur `operations`**. Il faudra un autre signal.

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

**Deux lectures d'une même ligne**, volontairement divergentes au mois de clôture : l'**état affiché** (inactive dès le mois de fin) et la **lisibilité pour un mois donné** (fin incluse). Conséquence : une personne à charge supprimée s'affiche inactive **tout en restant comptée** au mois en cours. C'est correct et figé par un test.

> **Décision du temps 2.a** : cette divergence **n'est pas expliquée à l'écran**, parce que le compteur de personnes à charge n'est pas affiché — il n'y a donc aucune contradiction visible. Le sujet se rouvre le jour où ce compteur s'affiche, ou au module 4 quand le bulletin montrera le nombre retenu. Le calcul de la déduction relève du moteur, pas de la fiche.

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

1. **Fiches** : société ✅, salariés ⏳ (API livrée ; socle, liste, identité et premier tableau répétable livrés), organismes
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
**391 tests.** Trois temps. **ADR 0021** — enregistrement global et échec partiel.

### ✅ 2.1.c-2, temps 0 — Extensions d'API
**402 tests.** `indexLigne` sur `AlerteApi` (PUT groupé des comptes bancaires uniquement) ; `dateSortie` exposée à la racine de la fiche ; type `FicheSalarie` unique dans `packages/shared-types`, avec l'alias **`EmploiFicheNonType`** à typer au temps 3.

### ✅ 2.1.c-2, temps 1 — Rubriques d'identité
**446 tests, 69 fichiers.** Quatre blocs réels ; deux routes de référentiel (`pays`, `situations-familiales`) ; temps 1-bis correctif ; restauration des accents dans 182 textes + garde-fou ; trois salariés de démonstration ; unicité du code banque ; trace des erreurs sur `stderr` ; `next build` ajouté à `pnpm verify`.

### ✅ 2.1.c-2, temps 2.a — Enveloppe des tableaux et personnes à charge
**483 tests, 73 fichiers.** Vérifié à l'écran, commité en cinq commits, poussé. Contenu :

- **Route de référentiel `GET /referentiels/liens-parente`**, créée, avec **migration ajoutant un champ `ordre`** à la table `LienParente` (Enfant = 1, Conjoint = 2). L'ordre est porté par la donnée, jamais par un tri.
- **Client d'appel du back-office complété** : création, remplacement de liste (PUT), suppression avec jeton en paramètre d'URL. Le PUT est écrit d'avance pour le temps 2.b.
- **Composant d'enveloppe générique** des tableaux répétables — enveloppe seulement.
- **Rubrique Personnes à charge**, formulaire écrit à la main.
- **Propagation de version après écriture hors séquence** — **ADR 0022**.
- **`docs/CONVENTIONS.md` §13** : contrat de l'enveloppe générique.
- **Correction du défilement du sommaire** : un défaut qui dormait depuis le temps 1, invisible avec quatre rubriques, criant avec cinq.
- **`.prettierignore`** : le document de contexte n'est plus reformaté.

### ⏭️ Prochaine étape — 2.1.c-2, temps 2.b : les comptes bancaires

**Cadrage à faire.** C'est l'autre famille de tableaux : PUT de la liste entière, alertes rattachées par position, suppression différée, masquage selon les droits. Il éprouvera l'enveloppe écrite au temps 2.a.

Puis **temps 2.c** : prêts et saisies ensemble (même famille que les personnes à charge).

Puis **temps 3** : écran de création, action « Supprimer le salarié » dans le rail, remplacement de `EmploiFicheNonType`, **avertissement de navigation**.

Puis **2.1.c-3** : emplois, rubriques portées par l'emploi (dont les trois tableaux restants), affichage de l'héritage, alertes.

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

- **Sommaire et rail restent visibles au défilement**, dans les deux sens. Les rubriques du centre défilent normalement.
- Le sommaire **fait défiler** jusqu'à la rubrique. Repliable complètement.
- **Le défilement est déclenché APRÈS le commit React**, jamais pendant. Sinon la position visée est calculée avant que la mise en page ne soit stabilisée, et le premier clic vise à côté.
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

**Un test protège cette asymétrie — ne jamais le fusionner avec un autre.** Il existe désormais **deux tests distincts** : un au niveau du socle, un au niveau interne d'un tableau.

**Après un conflit, un seul bouton : « Recharger les valeurs du serveur »**, qui prévient avant d'écraser la saisie. **Ni « Réessayer », ni « Enregistrer quand même », ni fusion.**

**Annuler** abandonne les modifications de toute la fiche, en **nommant les rubriques concernées**. Il appelle `reinitialiser()` sur **toutes** les rubriques et **ne provoque aucun appel serveur**.

`reinitialiser()` ramène aux valeurs du **dernier enregistrement réussi**, pas à celles du chargement de la page.

### 11.4 Ce que l'écran retient d'une réponse d'écriture — CRITIQUE

**Les routes POST, PATCH et DELETE des tableaux renvoient LA FICHE ENTIÈRE, relue en base.**

**L'écran ne l'applique JAMAIS en bloc.** Il n'en retient que **deux choses** :
- le nouveau numéro de version ;
- la ligne portant l'identifiant concerné par l'appel.

Tout le reste est ignoré.

**Raison** : les autres rubriques peuvent porter une saisie non enregistrée. La fiche renvoyée contient les valeurs **en base**, donc les anciennes. L'appliquer en bloc écraserait la saisie en cours, **sans aucun message**.

**Pourquoi garder la ligne** : une suppression ne supprime pas toujours. Si la ligne a servi à un bulletin, elle revient avec l'état `INACTIVE` et un mois de fin, et l'écran doit l'afficher ainsi.

Un test protège cette règle. **Il monte deux rubriques réelles** et échoue si l'écran applique la fiche en bloc — c'est sa preuve d'échec qui le rend valable. La première version de ce test montait une seule rubrique et un champ de décor : elle ne prouvait rien, et Cursor l'a lui-même démontée.

### 11.5 La découpe des rubriques d'identité — quatre blocs

**Une rubrique d'écran = une rubrique d'API, sans exception.**

| Bloc | Route | Contenu |
|---|---|---|
| **Identité** | `PATCH /salaries/:id/identite` | « Identification » : nom, prénom, sexe · « État civil » : date, ville et pays de naissance, nationalité, situation familiale |
| **Identifiants et immatriculations** | `PATCH /salaries/:id/identifiants-legaux` | matricule · type de pièce (déduit) · numéro de pièce, CNSS, CIMR |
| **Coordonnées** | `PATCH /salaries/:id/coordonnees` | « Adresse », « Contact », « Contact d'urgence » |
| **Dates clés** | `PATCH /salaries/:id/dates` | date d'entrée, date d'ancienneté · date de sortie (déduite) |

Le matricule est dans le **deuxième** bloc, avec les deux autres identifiants uniques par société.

**Les valeurs déduites ne bougent pas avant l'enregistrement.** Le type de pièce porte la mention « mis à jour à l'enregistrement ». L'écran ne recalcule jamais une règle métier.

**Les alertes** : avec un nom de champ → sous le champ ; sans nom de champ → en tête de son bloc. **Jamais de bandeau global.** Elles disparaissent dès que l'utilisateur modifie un champ **de ce bloc**.

**Les refus affichent le message du serveur tel quel.** Ne jamais ajouter d'explication — ce serait une fuite reconstituée par l'écran.

### 11.6 Les tableaux répétables — ordre dans la page

Ordre de la spécification, tableaux intercalés :

Identité → Identifiants → Coordonnées → **Personnes à charge** → **Comptes bancaires** → Dates clés → **Prêts** → **Saisies**

**Chaque tableau est une entrée du sommaire.**

Les trois autres tableaux (primes contractuelles, avantages en nature, statuts particuliers) sont portés par l'**emploi** et relèvent de la 2.1.c-3.

### 11.7 Les tableaux répétables — comportement figé

**Le tableau reste un affichage en lecture seule.** Un clic sur une ligne ou sur « Ajouter » déplie le formulaire **juste en dessous, dans la page, sur toute la largeur, en disposition verticale.** Ni saisie dans les cellules, ni panneau latéral.

**Composant générique pour l'enveloppe seulement** — tableau, tri, bouton Ajouter, dépliage, confirmation de suppression — **et un formulaire écrit à la main par tableau.** Pas de générateur de formulaire.

**Un seul formulaire ouvert sur toute la page.** Ouvrir un formulaire referme celui qui l'était, **en conservant sa saisie**. Ce mécanisme vit au niveau de la page, pas du tableau.

**Deux boutons dans le formulaire déplié**, aucun appel serveur :
- « Valider la ligne » → replie, retient la saisie localement.
- « Annuler la ligne » → replie, restaure les valeurs d'avant l'ouverture.

**La photo des valeurs de référence est prise à la PREMIÈRE ouverture** d'une ligne et ne change plus jusqu'à Valider ou Annuler. Une fermeture automatique due à l'ouverture d'un autre formulaire ne la renouvelle pas. Après Valider, la photo suivante repart des valeurs validées ; après Annuler, des valeurs restaurées. *(Défaut réel corrigé au temps 2.a : la photo était reprise à chaque ouverture, donc Annuler restaurait ce qu'on voulait annuler.)*

**Le bouton Enregistrer global, quand un formulaire est ouvert**, vaut « Valider la ligne » implicite puis enregistre. Il ne refuse jamais au motif qu'une ligne semble incomplète : tous les contrôles sont côté serveur.

**Aucun tri côté écran.** Les lignes arrivent triées par le serveur et sont affichées dans l'ordre reçu. **Une ligne ajoutée non encore enregistrée s'affiche en dernier**, avec la mention « non enregistrée », jusqu'au prochain enregistrement réussi.

**Les lignes inactives sont affichées** en grisé, avec la mention « inactive depuis MM/AAAA », sans filtre ni bascule. Elles se déplient **en lecture seule** : aucun champ modifiable, aucun bouton de suppression — **absents du DOM**, pas grisés.

**Un tableau est UNE SEULE rubrique** au regard du registre, pas une rubrique par ligne. `envoyer(version)` enchaîne en interne, en séquence : **modifications puis ajouts, chacun dans l'ordre d'affichage**. Le numéro rendu par chaque appel est utilisé par le suivant ; le dernier est rendu au socle.

**Refus 400 sur une ligne : on continue** avec les suivantes. La **première** ligne refusée voit son formulaire s'ouvrir ; les autres restent repliées mais **portent une marque visible**, et leur message serveur apparaît au dépliage. **Aucune alerte n'est perdue.**

**Refus 409 : arrêt immédiat** de la séquence, remontée au socle.

### 11.8 Les suppressions dans les tableaux

**Enregistrement à deux vitesses, assumé :**

| | Ajout et modification | Suppression |
|---|---|---|
| Comptes bancaires | différés, via Enregistrer | **différée aussi** |
| Personnes à charge, prêts, saisies | différés, via Enregistrer | **immédiate**, avec aperçu et jeton |

**Ligne jamais enregistrée** : retrait local immédiat, **sans confirmation, sans appel serveur**.

**Ligne déjà enregistrée** (tableaux ligne à ligne) :
1. Appel de la route d'aperçu (GET, aucune version exigée).
2. Fenêtre de confirmation par-dessus la page :
   - **Titre** fourni par le tableau appelant (« Supprimer cette personne à charge ? »), jamais codé en dur dans la fenêtre ;
   - le champ `message` du serveur, **tel quel** ;
   - « Cette suppression part tout de suite. Le bouton Annuler de la fiche ne reviendra pas dessus. » ;
   - si la rubrique porte des modifications non enregistrées : « Vos autres modifications de cette rubrique restent à enregistrer. » ;
   - boutons **« Supprimer »** et **« Garder la ligne »**.
3. DELETE avec jeton en paramètre d'URL et en-tête `If-Match`.
4. On applique §11.4, puis on propage la version (ADR 0022).

**Refus 409 `CONFIRMATION_OBSOLETE`** : l'écran **redemande l'aperçu** et réaffiche la fenêtre avec la nouvelle phrase, précédée de « la situation a changé depuis l'affichage ». **Jamais de renvoi automatique du DELETE** : l'effet a changé, l'utilisateur doit reconfirmer.

**Pendant un aller-retour de suppression**, tous les boutons Supprimer du tableau sont **grisés**. Ici le grisé porte un état passager, pas un droit.

**Comptes bancaires** : pas de suppression immédiate. La ligne disparaît de la liste locale et c'est le PUT qui l'efface. La confirmation dit « cette ligne sera supprimée à l'enregistrement » — **des mots différents pour un effet différent**.

### 11.9 Les emplois — 2.1.c-3

**Accordéon : les emplois sont empilés sur la même page.** Un seul emploi → le sélecteur s'efface. Deux ou plus → les emplois clos sont repliés derrière « afficher les emplois terminés ».

### 11.10 La création d'un salarié — temps 3

L'écran de création affiche **toutes les rubriques d'identité**, pas un formulaire réduit. **Un salarié peut être créé sans aucun emploi.** Aucun tableau répétable : on enregistre, on arrive sur la fiche, on ajoute ensuite.

**Différence structurelle à traiter** : la création est **un seul appel** (`POST /salaries` accepte toute l'identité), alors que le registre envoie une rubrique par appel. Le registre devra savoir se comporter en deux modes.

### 11.11 La liste des salariés

**Colonnes** : matricule · nom · prénom · état · date d'entrée · poste · établissement.

**La colonne poste** est composée par l'écran à partir de deux champs :

| Situation | `poste` | `nombreEmploisOuverts` | Affichage |
|---|---|---|---|
| Un seul emploi ouvert | libellé | 1 | le libellé |
| Plusieurs emplois ouverts | `null` | 2, 3… | « N emplois » |
| Salarié sorti | poste du dernier emploi clos | 0 | ce libellé |
| Aucun emploi | `null` | 0 | rien |

**Aucun tri.** Le serveur trie par nom puis prénom.

**Pagination par curseur** : « Charger plus », qui disparaît quand `prochainCurseur` est nul. **Pas de numéro de page, pas de total.**

**Filtres** : état (tous / actifs / inactifs, **rien présélectionné**) et établissement.

**Deux écrans vides distincts** : aucun salarié dans la société, et recherche sans résultat.

**Le matricule est un lien réel** vers la fiche, en plus du clic sur la ligne.

---

## 12. L'API des quatre tableaux du salarié — relevé vérifié

Contrôleur : `apps/api/src/modules/salaries/salaries.controller.ts`, `@Controller('salaries')`. Aucun préfixe global.
Corps attendus : `apps/api/src/modules/salaries/dto/tableaux-salarie.dto.ts`.

**Personnes à charge · Prêts · Saisies sur salaire** — même modèle :

```
POST   /salaries/:id/<tableau>
PATCH  /salaries/:id/<tableau>/:ligneId
DELETE /salaries/:id/<tableau>/:ligneId?confirmationJeton=<valeur>
GET    /salaries/:id/<tableau>/:ligneId/impact-suppression
```

Segments : `personnes-a-charge`, `prets`, `saisies-sur-salaire`.

**Comptes bancaires** — un seul verbe :

```
PUT /salaries/:id/comptes-bancaires     corps : tableau `comptes`
```

Remplace la **liste entière**. Pas de POST, pas de PATCH, pas de DELETE par ligne. **Aucune route d'aperçu.** La suppression se fait en renvoyant la liste sans la ligne.

**Verrouillage optimiste** : toutes les écritures l'exigent, DELETE et PUT compris. En-tête `if-match`. La version est **toujours celle du SALARIÉ**, jamais celle de la ligne. **Chaque réponse réussie rend la fiche entière, version comprise** — voir §11.4 pour ce que l'écran en retient. L'aperçu (GET) n'exige aucune version.

**Aperçu d'impact** rend :
```
{ donnees: { salarieId, ligneId, mode, message, jetonConfirmation } }
```
`mode` vaut `'supprimer'` ou `'inactiver'`. Le jeton est calculé sur `{ salarieId, ligneId, mode }` — les faits, jamais le message. Il change si le mode change.

**Refus** : jeton absent → `400 CONFIRMATION_REQUISE` ; jeton périmé → `409 CONFIRMATION_OBSOLETE`.

**Forme d'une alerte** :
```ts
interface AlerteApi {
  readonly code: string;
  readonly champ?: string;
  readonly indexLigne?: number;   // PUT groupé des comptes bancaires UNIQUEMENT, à partir de 0
  readonly message: string;
  readonly salarieExistantId?: string;
}
```

`indexLigne` est l'index dans le tableau **envoyé**, pas dans l'affichage. **L'écran doit conserver le tableau exact qu'il vient d'envoyer** et rattacher les alertes par position dans celui-ci — sujet du temps 2.b.

**Lignes inactives** : champ `etat` valant `'ACTIVE'` ou `'INACTIVE'` sur chaque ligne des trois tableaux historisés.

---

## 13. Ce que les temps 2.a et antérieurs ont appris — à ne pas réapprendre

**Un rapport peut fabriquer une preuve.** Une sortie de `pnpm verify` reconstituée de mémoire annonçait « aucun cycle » sur **zéro fichier traité**. **Exiger la sortie brute, collée, dans chaque prompt.**

**Un test peut passer sans rien prouver.** Deux cas au temps 2.a. Le premier montait une seule rubrique et faisait « survivre » un champ non contrôlé, hors de tout état React — il aurait passé même avec le défaut. Le second, sur la restauration d'une ligne, n'a été démasqué que par l'exigence de preuve d'échec. **Exiger systématiquement : introduire le défaut, coller la sortie de l'échec, remettre le code.**

**Cursor démonte ses propres tests quand on le lui demande.** Sur T18, il a écrit « ce test est un faux positif » avec la preuve. C'est le comportement attendu — le lui dire.

**Un défaut peut dormir plusieurs temps.** Le défilement du sommaire visait à côté au premier clic depuis le temps 1 : avec quatre rubriques l'écart était invisible, avec cinq il sautait aux yeux. La cause n'avait rien à voir avec les tableaux.

**Une explication invérifiable n'est pas une explication.** « Fichier déjà modifié en début de branche » s'est révélé faux à la vérification, et Cursor l'a corrigé lui-même. **Demander le `git diff --stat` et le commit concerné.**

**Quand un comportement ne se teste pas honnêtement, le dire.** Les hauteurs de mise en page ne se simulent pas en jsdom. Cursor a refusé d'écrire un test de précision de défilement. **Bon réflexe — mais la charge bascule alors sur la vérification à l'œil, qui doit être listée explicitement.**

**`pnpm verify` ne couvrait pas la compilation du front.** Deux imports avec extension `.js` cassaient l'écran avec 430 tests verts. `next build` est désormais **en dernière position**.

**Un contrôle testé à la création peut manquer à la modification.** Vérifier **quel chemin** un test couvre, pas seulement qu'il existe.

**Une hypothèse n'est pas un diagnostic.** Exiger la cause avant la correction, et un test qui échoue sur le code d'avant.

**Un défaut d'ordonnancement peut faire perdre une saisie silencieusement.** La distinction saisie/serveur doit reposer sur un **drapeau explicite**, jamais sur un ordre d'exécution ou un délai. C'est la même famille que la règle §11.4.

**Trois tests instables, trois causes différentes, aucune n'était « la machine ».**

**Le nettoyage entre tests doit couvrir ce que les tests créent.**

**Une erreur avalée coûte une soirée.** Le helper écrit désormais sur `stderr` (jamais `console.*`).

**Un filtre de trace doit être étroit.**

**Un garde-fou qui crie à tort sera ignoré.** Mieux vaut pas de garde-fou qu'un garde-fou qu'on apprend à ignorer.

**Une exemption ne s'allonge jamais.**

**Le principe d'étanchéité peut vider un mécanisme de sa substance.** Le jeton de suppression de fiche ne compare rien. Le savoir plutôt que compter sur une garantie inexistante.

**Une exception rangée loin de sa règle n'est jamais trouvée.** Consigner les exceptions **dans** la règle qu'elles amendent.

**Les tests ne voient pas l'écran.** Cinq défauts réels trouvés à l'œil à ce jour.

---

## 14. Le modèle de la fiche salarié — l'essentiel

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

La fiche porte le **rattachement** d'une prime (code + mois d'application), jamais un montant. Les avantages en nature portent un montant.

### Valeurs déduites — jamais stockées

Type de pièce d'identité · date de sortie du salarié · état actif/inactif · solde restant d'un prêt · durée du travail dans l'autre base · durée de la période d'essai · nombre de personnes à charge · libellé accordé en genre de la situation familiale · mois en cours.

> **Le nombre de personnes à charge n'est PAS affiché à l'écran au temps 2.** Il est calculé au chargement et deviendrait faux après un ajout. **Ne jamais recharger la fiche automatiquement pour le rafraîchir** — c'est le défaut corrigé au temps 1-bis.

### Trois unicités, toutes par société

Matricule (toujours) · numéro de pièce d'identité (si renseigné) · numéro CNSS (si renseigné). **Aucun contrôle ne traverse la frontière d'une société**, y compris entre sociétés d'un même cabinet.

**Un matricule attribué n'est jamais réattribué**, même après suppression (ADR 0019).

### Une donnée sensible

`situationHandicap` sur les personnes à charge, **visible seulement pour un enfant**. Marquée `sensible`, sans droits propres à ce stade. Quand le lien passe à Conjoint, la case est **absente du DOM** et sa valeur est **conservée** (règle A0), pour réapparaître telle quelle si l'on revient à Enfant.

### Une exception : TAHFIZ

Exonération **portée par la société**, pas un statut saisi salarié par salarié. Son activation propage le statut à tous les salariés **ayant un emploi ouvert**, existants et futurs — jamais aux salariés sortis.

Au **retrait** : ligne jamais utilisée par un bulletin → supprimée ; ligne déjà utilisée → inactivée avec un mois de fin.

Une ligne propagée est en **lecture seule** depuis la fiche salarié. **`operations` n'existe pas au niveau ligne** — il faudra un autre signal (voir §6.1).

### Le code d'une banque est unique

Les trois premiers chiffres du RIB sont l'**identifiant Bank Al-Maghrib** de l'établissement bancaire. Contrainte d'unicité en base, champ nullable, résolution par `findUnique`. **Aucun tri, aucun repli.**

**Les 21 codes du référentiel sont vides**, donc le pré-remplissage est **inerte en production**.

---

## 15. Points ouverts

| Réf | Sujet | État |
|---|---|---|
| — | Béquilles de dev `x-paymarh-user-id`, `NEXT_PUBLIC_PAYMARH_USER_ID`, `x-paymarh-permissions-refusees` | **bloquent la mise en production** |
| — | **Béquille des permissions refusées prouvée sur une route sonde uniquement** | à refermer au module d'authentification |
| — | **Avertissement de navigation partiel.** Seuls la fermeture d'onglet et le lien de retour sont couverts. Next.js 16 n'offre pas de garde au niveau du routeur. **La solution devra être une contrainte outillée** (règle de lint interdisant le lien standard dans la zone de la fiche). Le risque a grandi avec les tableaux : quitter une page avec une saisie non enregistrée ne dit rien | **temps 3** |
| — | **« Cette fiche est ouverte ailleurs »** : prévenir avant d'enregistrer plutôt que de découvrir le conflit au moment d'enregistrer. Écarté au temps 2 — le serveur ne sait pas qui a une fiche ouverte, « ouvert » n'a pas de définition évidente (onglet oublié), et sans authentification on ne peut pas nommer l'autre utilisateur | après le module d'authentification |
| — | **`ordre Int @unique` sur `LienParente`** : plus strict que sur `Pays`. Sans conséquence sur deux lignes, mais insérer une valeur entre les deux obligerait à renuméroter | à revoir si la liste s'allonge |
| — | **`operations` n'existe pas au niveau ligne de tableau.** Les lignes de statut particulier propagées par la société devront s'appuyer sur un autre signal | 2.1.c-3 |
| — | **Personne à charge inactive encore comptée** : plus de contradiction à l'écran tant que le compteur n'est pas affiché. Se rouvre avec l'affichage du compteur ou au module 4 | module 4 |
| — | **Page d'accueil du back-office** : affiche l'adresse de l'API et « authentification non implémentée » | à retirer avant production |
| — | Liste d'exemption du module 1 : 35 routes sur l'ancien mécanisme de droits. **Ne jamais l'allonger.** | à vider à la reprise du module 1 |
| X3 | **Codes des 21 banques du référentiel, tous vides.** Pré-remplissage et alerte prouvés par test mais **inertes en production** | travail de données, par le porteur |
| — | **`EmploiFicheNonType`** : la forme d'un emploi est volontairement opaque | à typer au temps 3 |
| — | **Le jeton de suppression de fiche est constant** : il prouve qu'un aperçu a eu lieu, pas sa fraîcheur | à ne pas prendre pour une garantie |
| — | **Mention « mis à jour à l'enregistrement » absente sous la date de sortie** | à rouvrir en 2.1.c-3 |
| — | **Compilation de l'API absente de `pnpm verify`.** `nest build` n'a pas le filet de Turbopack | à discuter |
| — | `BulletinPort` et `ReferentielNationalPort` provisoires : sept mécanismes en dépendent | modules 2, 4 et 5 |
| — | Premier mois de gestion : point d'ancrage du chaînage des bulletins | module 2 |
| — | **Articles de base de connaissance non relus** : fiche société, et fiche salarié | relecture par le porteur |
| — | **Captures d'écran des articles** : automatisables avec Playwright (non installé). À mettre en place **en fin de 2.1.c**. Le prompt devra demander à Cursor de poser des marqueurs d'emplacement | fin 2.1.c |
| — | 26 requêtes SQL par lecture d'une fiche | à mesurer sur données réelles |
| — | Divergence des enveloppes de réponse module 1 / module 2 | assumée, ADR 0021 |
| — | **Dérive CRLF sous Windows** : avertissements à chaque `git add`. Un `.gitattributes` réglerait le problème | non fait, son propre commit |
| Z14 | Trois retouches sur la fiche société v7, **plus** l'AuditLog du module 1 sans `accountId` ni `companyId` ; **champ Banque de la fiche société à aligner sur celui de la fiche salarié** | prochain passage sur le module 1 |
| — | **Verrouillage des autres rubriques pendant l'enregistrement global** (seuls les comptes bancaires sont verrouillés au temps 2.b) | temps 2.c ou 3 |
| — | **Suppression d'un compte bancaire désigné par un emploi** | 2.1.c-3 |
| — | **`couleur` sur `Banque`** : obligatoire en base, nullable dans le type partagé — incohérence à corriger | prochain passage référentiels |
| — | **Champ `ordre` absent sur `Banque`** : l'API trie par nom ; à traiter avec le remplissage des codes (X3) | porteur / X3 |
| Z6 | Faire confirmer par la CNSS et la DGI la consolidation en une ligne par salarié | vérification métier |
| Z9 | Référentiels service et département | autre module |
| Y7 | Console d'administration du référentiel | modules 4 et 5 |
| — | Date de sortie **hors intervalle** : alerte et confirmation devraient coexister, non testé | 2.1.c-3 |
| — | **Les tests d'intégration partagent la base du serveur de développement.** Toute saisie manuelle sur les salariés de démonstration fait échouer `pnpm verify` (test S3). Remède : `pnpm db:reset` **puis** `pnpm db:seed` — `db:reset` vide la base sans rejouer le seed, et `db:seed` seul ne purge pas les lignes existantes. Solution de fond : base dédiée aux tests (`DATABASE_URL` distincte) ou base éphémère. | hors module 2 |
| — | C24 ne se déclenche pas sur un emploi portant sa propre référence de grille horaire | module 3 |
| — | Vérifications OMPIC (classes 9 et 42) et noms de domaine pour la marque Adrim | en attente |

---

## 16. Environnement

- **GitHub** : `https://github.com/omarrizqi-sys/paymarh.git`, branche `main`, Git connecté à Cursor.
- **Cursor travaille sur le dépôt local.** Un fichier produit par Claude doit être **déposé dans le dépôt**. **Cursor ne peut pas lire un `.xlsx`** — toujours fournir la version Markdown.
- **Docker fonctionne chez le porteur ET chez Cursor.** `pnpm db:up` démarre PostgreSQL.
- **`pnpm verify`** = `lint && format:check && typecheck && test && check:circular && back-office build`. **Seule commande de validation, lancée par le porteur.**
- `madge` rapporte constamment **2 avertissements** — deux imports CSS. Bénins, à ne pas réinstruire.
- **Lancer les commandes une par une**, jamais en parallèle.
- **Voir le rendu en local** : `pnpm db:up`, puis `pnpm --filter api dev`, puis `pnpm --filter back-office dev`, puis `http://localhost:3000`. Le fichier `apps/back-office/.env` porte `NEXT_PUBLIC_PAYMARH_USER_ID`, affiché par `pnpm db:seed`. **Next ne relit pas ce fichier à chaud.**
- **Après une migration ou un changement de seed, rejouer le seed** avant toute vérification visuelle. **Après une vérification visuelle sur les salariés de démonstration**, les tests d'intégration partagent la même base : remède `pnpm db:reset` **puis** `pnpm db:seed` avant `pnpm verify` — `db:reset` vide la base sans rejouer le seed, et `db:seed` seul ne purge pas les lignes saisies manuellement.
- **Le seed crée trois salariés de démonstration** dans la société DEMO-001 : un complet et actif (avec personnes à charge, comptes, prêt), un minimal sans emploi, une salariée sortie de nationalité étrangère.
- **Quand un écran refuse de s'afficher**, la vraie erreur est dans le **terminal du back-office** — le helper de trace y écrit sur `stderr`.
- **Environnement PowerShell** : `curl` est un alias — utiliser `curl.exe` ou `Invoke-RestMethod`. `rmdir /s /q` n'existe pas — utiliser `Remove-Item -Recurse -Force`. **Les chemins contenant des crochets doivent être entre guillemets** dans un `git add`.
- **Commit manuel** : `git add <chemins>` → `git commit -m "..."` → `git push`.

---

## 17. Rappels de méthode

- Claude **cadre et décide avec le porteur d'abord**, puis fournit **un prompt Cursor complet** par temps.
- Le prompt Cursor doit toujours : donner le contexte, **lister les fichiers à lire avant d'écrire**, rappeler le socle à réutiliser, délimiter le périmètre strict (à faire / à NE PAS faire), lister les `.md` à créer, poser des **critères d'acceptation vérifiables par un non-codeur**, exiger la **liste nominale des tests avec fichier et numéro de ligne**, exiger la section **« Décisions prises seul »**, exiger la **sortie brute de `pnpm verify`**, exiger une **preuve d'échec** pour tout test de non-régression, et demander à Cursor de **s'arrêter et poser la question** si un choix n'est pas couvert.
- **Prévoir un point d'arrêt préalable** dans le prompt quand une donnée manque (route existante ou non, champ présent ou non). Cursor répond, puis continue.
- **Le critère d'acceptation technique est `pnpm verify` vert chez le porteur.**
- **Après chaque temps livré : vérification visuelle à l'écran**, avec une liste de points numérotés fournie par Claude. **Les points qui portent la raison d'être du temps doivent être signalés comme tels.**
- Exiger que Cursor **propose toute dépendance avant installation**.
- Ne jamais introduire de logique métier hors du module en cours.
- **Vérifier systématiquement les rapports de Cursor** : arithmétique des tests, tests annoncés contre tests exigés, contrôles déclenchables contre contrôles théoriques, contraintes de production contre confort de test, fichiers hors périmètre modifiés, sortie brute contre résumé, **tests qui prouvent réellement ce qu'ils annoncent**.
- **Quand Cursor s'arrête et pose une question, c'est le comportement attendu** — le lui dire. Quand il démonte son propre test, aussi.
- **Claude signale au porteur quand ouvrir une nouvelle conversation** est optimal, et fournit ce document mis à jour à ce moment-là.
- **Claude indique le modèle et l'effort à paramétrer à la fin de chaque message** (voir §2).
