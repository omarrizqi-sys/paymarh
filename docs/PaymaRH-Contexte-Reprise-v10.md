# VECTA — Document de contexte (reprise de conversation)

> **Comment m'en servir :** téléverse ce fichier au début d'une nouvelle conversation avec Claude, avec le message d'ouverture fourni à part.
>
> **Version :** remplace intégralement la v9. Dernière mise à jour : fin du **temps 4 de la sous-étape 2.1.c-3**. **698 tests, 100 fichiers, `pnpm verify` vert, arbre propre, tout est poussé.**

---

## 0. Le nom — à lire avant tout le reste

**Le produit s'appelle VECTA.** La marque Adrim, envisagée un temps, est abandonnée.

**Règle, sans exception :**

| VECTA | PaymaRH |
|---|---|
| Le **produit** | Le **projet de développement** |
| Toute chaîne destinée à l'**affichage** | Dépôt, dossiers, paquets |
| Tout document lu par un **utilisateur** | Code, classes et types TypeScript |
| Base de connaissance, domaine `vecta.ma` | En-têtes HTTP (`x-paymarh-*`), variables d'environnement |
| Titre d'onglet, logo textuel, métadonnées | Base de données, migrations, `pnpm --filter @paymarh/...` |

Ne renomme jamais un élément de la colonne de droite. Ne laisse jamais « PaymaRH » ni « Adrim » apparaître dans une chaîne affichée.

> ⚠️ **Ne pas confondre avec PayloRH**, marque française d'externalisation de paie, entité totalement distincte.

---

## 1. Le projet

**VECTA** — logiciel de paie marocain pour le **secteur privé**, distribué en **SaaS multi-société**.

Objectif : générer des **bulletins de paie** et des **déclarations sociales et fiscales** conformes à la législation marocaine, plus une couche SIRH liée à la paie.

Deux publics : **entreprises** qui gèrent leurs propres salariés, **cabinets** qui gèrent plusieurs sociétés clientes.

Déclarations visées : **CNSS**, **AMO**, **SIMPL-IR**.

> ⚠️ **Ne jamais transposer le droit français.** Le porteur maîtrise les deux droits et corrige systématiquement. En cas de doute sur une règle marocaine, **poser la question plutôt que supposer**.
>
> Pièges déjà rencontrés : le CDI intérimaire et le contrat à objet défini sont des notions françaises ; le barème kilométrique marocain est celui de la CNSS, distinct de celui de la DGI ; il n'existe ni contrat d'apprentissage ni contrat d'insertion au Maroc ; les conventions collectives n'ont pas la même portée.
>
> **Cas du temps 2.c** : le montant prélevé au titre d'une saisie à tiers détenteur dépend de la **quotité saisissable de l'article 387 du code du travail marocain**. Claude ne connaissait pas cette règle et ne l'a pas inventée — le porteur l'a apportée, et elle a modifié la spécification.
>
> **Cas du temps 3 (2.1.c-2)** : la liste des champs qui ne peuvent jamais être vides pour un salarié marocain, et le caractère **facultatif** de la date de naissance, ont été tranchés par le porteur contre ce que l'API imposait.
>
> **Cas de la 2.1.c-3** : les **primes contractuelles ne sont pas historisées**, parce que leur valeur d'un mois est figée dans les éléments variables de ce mois. Claude ne le savait pas, n'a rien recommandé, et a reposé la question jusqu'à obtenir la règle. Le schéma n'a pas bougé.

---

## 2. Profil du porteur et méthode

- Le porteur est **expert paie**, sans background technique. Il ne code pas.
- **Claude sert à réfléchir, cadrer et décider. Cursor sert à développer.**
- Ordre invariable : **on cadre ensemble d'abord** (Claude pose des questions numérotées, le porteur tranche), **puis** Claude rédige le prompt Cursor.
- Le porteur répond **par numéro**. Numéroter les questions et les regrouper par thème.
- **Écrire pour un non-développeur.** Les questions de cadrage doivent partir d'une situation concrète à l'écran, pas d'un mécanisme technique. **Si une question ne peut pas s'expliquer par « voilà ce que l'utilisateur fait, voilà ce qui se passe », elle est mal posée.**
- Sorties **complètes et prêtes à copier-coller**. Pas d'esquisse partielle. **Les prompts Cursor sont livrés dans un bloc de code d'un seul tenant**, sans commentaire de Claude à l'intérieur ; les remarques vont avant et après le bloc.
- **JAMAIS de clôture de bloc de code à l'intérieur d'un prompt Cursor.** *(Règle née d'un défaut réel de la 2.1.c-3 : trois chemins de route encadrés par une clôture imbriquée ont coupé le prompt en deux. Le porteur a collé le second morceau, et Cursor a reçu un prompt amputé de trois chantiers sur six — qu'il a reconstruits de son mieux, en le déclarant.)* Les chemins, extraits de types et exemples de code vont **en texte indenté ou en ligne**, jamais dans un bloc imbriqué.
- Claude accompagne chaque question d'une **recommandation motivée**, pour que le porteur puisse valider par un simple « ok ».
- **Quand Claude n'a pas la connaissance métier, il le dit et ne recommande rien.** Et quand le porteur répond « ok pour tout » alors qu'une question sans recommandation reste ouverte, **Claude la repose seule** au lieu de la combler.
- **Vérifier que toutes les questions ont été tranchées** avant de rédiger le prompt. **Signaler l'omission ou l'ambiguïté, ne jamais la combler en silence.**
- Il conteste et corrige quand c'est nécessaire — **c'est un signal fiable**, ne pas le contourner.
- À chaque module validé, produire **un article de base de connaissance** (manuel utilisateur), rédigé par Cursor à partir de ses notes.
- **Quand le porteur demande une vérification à l'œil, Claude fournit systématiquement les trois commandes de lancement** (`pnpm db:up`, `pnpm --filter api dev`, `pnpm --filter back-office dev`), sans attendre qu'il les redemande.
- **Claude ne donne jamais du contenu de fichier là où une commande est attendue.**
- **Claude ne fait jamais d'affirmation sur ce qu'il a lui-même produit sans vérifier.** *(Cas de la 2.1.c-3 : Claude a nié avoir coupé un prompt en deux ; la capture d'écran du porteur a prouvé le contraire. L'aveu immédiat et la règle qui en découle valent mieux que la défense.)*

### 2.1 Modèle et effort — règle absolue

**Claude indique à la fin de CHAQUE message quel modèle (Sonnet ou Opus) et quel effort de réflexion (faible, moyen, élevé) paramétrer pour le message suivant.**

**Sans exception aucune** : messages courts, instructions git d'une ligne, confirmations, corrections de commande.

Format : une ligne isolée en fin de message, sans justification, sauf si le porteur la demande.

**L'effort annoncé est celui du message SUIVANT.**

| Situation | Modèle et effort |
|---|---|
| Cadrage d'un nouveau temps | **Opus, élevé** |
| Rédaction d'un prompt Cursor de fond (API, types partagés, outillage) | **Opus, élevé** |
| Rédaction d'un prompt Cursor de câblage | **Opus, moyen** |
| Production du document de contexte | **Opus, élevé** |
| Relecture d'un rapport de Cursor | **Opus, moyen** |
| Relecture d'un point d'arrêt ou d'un diagnostic | **Opus, moyen** |
| Instructions git, échanges courts, confirmations | **Opus, faible** |
| Retour de vérification visuelle | **Opus, faible** |

### 2.2 Règles de conduite éprouvées

- **Une seule instruction git par message.**
- **Ne jamais donner une procédure amputée sans le dire.**
- **`pnpm verify` est le seul critère d'acceptation technique.** Ne jamais écrire « lint vert et test vert ».
- **`pnpm verify` échoue massivement si un serveur de développement tourne en parallèle.** *(Constaté au temps 2 : 39 échecs sous contention, vert sans.)* **Exiger que Cursor arrête `pnpm --filter api dev` et `pnpm --filter back-office dev` avant de lancer `verify`** — il ne le fait pas spontanément.
- **Exiger la SORTIE BRUTE de `pnpm verify`, collée depuis le terminal, jamais un résumé.** **Interdire explicitement la redirection dans un fichier.** **Écrire dans le prompt : « c'est moi qui juge ce qui est attendu dans cette sortie ».**
- **Toujours vérifier le rapport de Cursor contre le prompt.** Le motif est constant : le code est écrit, la preuve manque.
- **Vérifier l'arithmétique des tests à chaque livraison.** Total avant, total après, ajoutés, retirés, modifiés. Un test **déplacé** n'est ni un ajout ni un retrait ; un test **renommé** n'est pas un ajout ; un test **retourné** (assertions inversées) est une modification.
- **Exiger fichier ET numéro de ligne pour chaque test de la liste nominale.** « La liste, pas la commande. »
- **Exiger la section « Décisions prises seul » dans chaque rapport. C'est la section la plus rentable du rapport.** *(À la 2.1.c-3, elle a révélé trois fois des faits majeurs : le prompt amputé, le défaut du repli d'accordéon, et le choix de source unique du registre de masquage.)*
- **Un test qui passe sans exercer le défaut qu'il prétend couvrir est un échec, pas un test.** Exiger une **preuve d'échec**, et **vérifier sur quel chemin elle porte**.
  - **Une preuve d'échec « reconstruite » n'est pas une preuve.**
  - **Quand une preuve d'échec ne peut honnêtement pas exister — parce que le comportement n'a jamais manqué — le dire vaut mieux que la fabriquer.**
  - **Un test qui fabrique ses propres données ne prouve pas le chemin réel.** *(Temps 3 : le test « une valeur héritée s'affiche » était vert pendant que l'écran était vide. Renommé pour dire ce qu'il vérifie vraiment.)*
- **Se méfier des contrôles qui ne se déclenchent jamais**, et des **mécanismes sans appelant**.
- **Se méfier des décorateurs et des exemptions.** **Un contrôle de droit se place au plus près de la donnée, jamais sur une route.**
- **Se méfier d'un contrôle qui reconnaît des NOMS DE CLÉS plutôt que de suivre la donnée.** *(Trois failles réelles nées de ce même mécanisme : comptes bancaires en 2.1.b, rémunération d'emploi et avantages en nature en 2.1.c-3. Voir ADR 0024 et 0032.)*
- **Ne jamais relâcher une contrainte de production pour faire passer un test.**
- **Un test ignoré n'est pas un test réussi.**
- **Demander systématiquement pourquoi un fichier hors périmètre a été modifié.**
- **Vérifier ce qui est indexé avant de commiter.** `git status --short` avant `git commit`.
- **Exiger la cause avant la correction. Une hypothèse n'est pas un diagnostic.**
  - **Découper le diagnostic et la correction en deux prompts quand la cause est inconnue.** *Pratiqué six fois à ce jour. À chaque fois, le relevé a changé la correction envisagée ; deux fois, il a montré que le défaut n'était pas là où on le croyait.*
- **Quand Cursor corrige le prompt de Claude, il a souvent raison.** *(À la 2.1.c-3 : il a établi que le refus sur les statuts propagés existait déjà, contre un relevé antérieur erroné ; il a signalé l'écart quatre rubriques d'écran / trois routes ; il a refusé d'implémenter avant de savoir comment porter l'ordre des référentiels.)* **C'est le comportement attendu.**
- **Quand Cursor s'arrête et pose une question, le lui dire.** *(À la 2.1.c-3, deux arrêts ont changé le cadrage : l'absence de champ `ordre` sur trois référentiels, et l'absence de route HTTP pour ces mêmes référentiels.)*
- **Une correction acceptée peut n'être qu'un masque.** **Accepter, et inscrire le point ouvert explicitement — jamais laisser une dette silencieuse.**
- Découper chaque sous-étape en **temps successifs, avec arrêt entre chacun**. **Et découper un temps en plusieurs prompts quand il mélange des natures de travail différentes.**
- **Fil Cursor neuf par prompt.** Les prompts correctifs et les diagnostics restent dans le fil du prompt concerné.
- **Modèles Cursor** : Composer 2.5 pour le développement courant ; le modèle le plus fort disponible pour l'architecture, les migrations de base, les types partagés et les contrôles de sécurité.
- **Séparer les commits de nature différente.** *(À la 2.1.c-3 : six commits pour six chantiers indépendants, trois pour le correctif de sécurité, deux pour le temps 4.)*
- **La vérification visuelle est une étape à part entière**, pas un bonus. **Quinze défauts réels trouvés à l'œil à ce jour, tous avec une suite de tests verte.**
- **Après une correction trouvée à l'œil, refaire une vérification à l'œil.**
- **La vérification à l'œil du porteur peut révéler un trou de CADRAGE, pas seulement un défaut de code.** *(Temps 3 de la 2.1.c-2 : le bouton « Sociétés » non protégé. Temps 3 de la 2.1.c-3 : l'héritage invisible, dû à un seed que Claude avait mal cadré.)*

### 2.3 Le point d'arrêt préalable

Quand un prompt dépend de faits que Claude ne peut pas vérifier, **le prompt commence par une section « point d'arrêt »** : Cursor relève les faits, avec fichiers et numéros de ligne, **puis s'arrête sans écrire de code**.

Bilan cumulé : **treize relevés**. **La plupart ont changé le cadrage.** À la 2.1.c-3 : l'API des emplois était déjà entièrement livrée (le plan supposait qu'elle restait à écrire) ; les référentiels d'emploi n'avaient aucune route HTTP ; le contrôle d'écriture sur la rémunération ne protégeait pas les routes d'emploi ; quatre rubriques d'écran se heurtaient à trois routes d'API.

Règles :
- **N'écris pas de code, ne crée pas de fichier** doit être écrit explicitement.
- **Lire la partie 2 ne vaut pas autorisation d'écrire** quand le prompt est en deux parties.
- Exiger **fichier et numéro de ligne** pour chaque fait.
- Exiger une **preuve par le code** pour tout fait comportemental.
- Accepter **« NON PROUVÉ »** comme réponse. *Interdire explicitement « probablement », « il semble », « en principe », « sans doute », « a priori ».*
- **Demander à Cursor de confirmer que `git status --short` est inchangé à la fin d'un relevé.**

### 2.4 Reprendre des faits d'un point d'arrêt précédent

Quand un prompt suit un relevé déjà exploité, **ne pas en refaire un**. Rappeler les faits en tête de prompt sous la forme : *« N faits que j'affirme. Si l'un est faux, arrête-toi et dis-le. »*

**Attention** : un fait relevé peut être **périmé** — ou **faux dès l'origine**. *(À la 2.1.c-3, un relevé affirmait qu'aucun refus ne protégeait les statuts particuliers propagés ; le code le contredisait depuis plusieurs temps. Claude s'était fié au relevé pour recommander une correction inutile. C'est le rapport de Cursor qui a rétabli la vérité.)*

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
| Tableaux | TanStack Table v8 — **module 1 seulement** |
| Calcul monétaire | decimal.js + type Decimal Prisma — **jamais de flottant** |
| Auth | Auth.js, **pas encore installé** |
| Stockage fichiers | abstraction type S3, interface seulement |
| Outillage | ESLint, Prettier, Vitest 4.1, madge |
| Mobile (plus tard) | React Native / Expo |

**Aucune dépendance d'accordéon n'a été ajoutée** : l'accordéon des emplois est fait de boutons et d'état local.

**`@testing-library/jest-dom` n'est pas installé** — `toHaveClass` est indisponible ; les tests passent par `classList.contains`.

### 3.1 Conventions d'import — deux règles opposées, outillées

- **API** : l'extension `.js` est **obligatoire** sur les imports relatifs (ESM Nest).
- **Back-office** : l'extension `.js` est **interdite** — Turbopack ne la résout pas.

Une règle ESLint (`no-restricted-imports`, native) l'impose sur `apps/back-office/src`.

### 3.2 `no-restricted-imports` — deux usages, deux blocs distincts

1. l'interdiction de l'extension `.js` dans le back-office ;
2. l'interdiction des outils de navigation Next hors du module de navigation gardée.

**Les deux blocs sont séparés dans `eslint.config.js`.** **Aucun plugin ESLint sur mesure n'a été écrit, et il ne faut pas en écrire.**

### 3.3 Prettier et les documents de référence

`docs/PaymaRH-Contexte-Reprise-*.md` est dans `.prettierignore`.

> **`navigation-en-tete.tsx` réapparaît modifié à chaque passage de `pnpm format`.** Le fichier commité et le format attendu divergent. Bénin, mais il faut le remettre en état avant chaque commit (`git checkout -- <chemin>`). **À régler une fois pour toutes.**

---

## 4. Principes d'architecture (GRAVÉS)

1. **API d'abord** — aucun calcul de paie dans le front, jamais.
2. **Moteur de paie pur et isolé** — `payroll-engine/`, fonction pure, aucun accès base. **Toujours vide à ce stade.**
3. **Double isolation multi-tenant** — `Account → Company → Salarié`.
4. **Super-admin séparé** — rôle `PLATFORM_ADMIN`, `accountId` nul, accès par chemin `/admin/` tracé.
5. **Décimal exact** — `parseFloat`, `Number.parseFloat`, `Math.round` interdits par ESLint, **front compris**. **Ne jamais désactiver la règle.**
6. **Livrables = monde à part** — les PDF vont au stockage d'objets, pas en base.
7. **Étanchéité de l'information** — aucun message ni code d'erreur ne révèle une donnée hors périmètre. Doublon → « Cette valeur n'est pas disponible. ». Ressource d'un autre compte → **404, jamais 403**.
   - **Corollaire écran** : une action ou une rubrique que l'utilisateur n'a pas le droit d'exercer ou de voir est **absente du DOM**. Jamais grisée, jamais masquée en CSS. **Le grisé reste légitime pour un état sans rapport avec les droits.**
   - **Corollaire données** : `operations` est une **liste de ce que l'utilisateur peut faire**.
   - **Corollaire API** : une clé masquée est **absente** de la réponse, jamais `null`. Le type partagé les déclare **optionnelles**, jamais nullables.
     - **L'optionalité d'un champ ne doit avoir qu'UNE SEULE signification.** Sur `EmploiFiche`, elle signifie « masqué faute de droit » — à l'unique exception d'`operations`, documentée à la définition du champ. Voir ADR 0027.
     - **Extension de la 2.1.c-3** : sur `ResolutionsEmploi`, `| null` signifiait déjà « aucune valeur héritée trouvée ». Le masquage ne pouvait donc **pas** emprunter `null` : **il supprime la clé**, et deux champs sont devenus optionnels avec cette seule signification.
   - **Corollaire écran** : distinguer **clé absente** (pas le droit de voir) et **liste vide** (rien à montrer).
   - **Corollaire sécurité** : **masquer une rubrique à l'écran ne protège rien** tant que la route d'écriture reste ouverte.
8. **Tout calcul et tout contrôle côté serveur** — le front n'en rejoue aucun. Deux exceptions documentées (ADR 0009).
9. **Aucune chaîne destinée à l'affichage ne sort de l'API.** L'API rend des données, l'écran compose les phrases.
   - **Exception 1** : la liste déroulante des situations familiales accorde ses libellés en genre localement.
   - **Exception 2** : le champ `message` de l'**aperçu d'impact avant suppression**.
   - **Réciproque** : un message technique du serveur affiché tel quel à l'utilisateur est une **fuite**.
   - **Application de la 2.1.c-3** : l'API rend le **niveau d'héritage** (`SALARIE`/`ETABLISSEMENT`/`SOCIETE`/`NATIONAL`) et le libellé de l'entité ; **l'écran compose la phrase** (« 44 h — établissement Siège Casablanca »).
10. **Le français affiché porte ses accents et ses apostrophes typographiques ( ' ).** Un garde-fou (`francais-affiche.spec.ts`) refuse toute élision ASCII.
11. **Un message d'interface est défini une seule fois.**
12. **Un comportement s'injecte, il ne se déduit jamais de la forme des données.** La variante doit être **déclarée explicitement** par l'appelant. *(À la 2.1.c-3 : une rubrique déclare l'entité qui la porte ; sans cette déclaration, elle retomberait silencieusement sur le salarié et enverrait la mauvaise version.)*
13. **Toute navigation depuis un écran à saisie passe par le module de navigation gardée.** Contrainte **outillée par une règle de lint**. Voir §11.15 et ADR 0031.

---

## 5. Décisions transverses figées

- **Langue du code mixte** : technique en anglais, **termes métier réglementaires en français**. `Company` reste en anglais (ADR 0005).
- **Mois de paie et mois d'effet** : `String` au format `AAAA-MM`, jamais `DateTime` (ADR 0006).
- **Identifiants légaux** en `String`, jamais en nombre.
- **Aucune valeur de remplacement** type « À compléter ». Un champ vide vaut mieux qu'une donnée fausse. **Corollaires** : une part de virement vide s'affiche vide ; un mois de fin vide s'affiche vide ; **une date de naissance absente s'affiche vide** ; **un champ d'emploi vide s'affiche vide**, jamais un tiret.
- **Vocabulaire des états des lignes de tableau** : `ACTIVE` / `PAS_ENCORE_EFFECTIVE` / `CLOTUREE` (ADR 0026).
- **L'ordre d'un référentiel est porté par la DONNÉE**, jamais par un tri alphabétique ou d'écran. Un champ `ordre` dans la table.
  - **Précision de la 2.1.c-3** : `ordre` est posé **sans contrainte d'unicité** sur les trois référentiels d'emploi, contrairement à `Pays`, `LienParente` et `TypeSaisieSurSalaire`. Raison : `@unique` empêche d'insérer une valeur entre deux existantes sans réécrire les suivantes, ce qui heurte la règle « liste extensible sans migration ». **L'unicité sur les trois référentiels anciens reste un point ouvert.**
- **Un référentiel simple se réfère par son CODE, pas par un identifiant technique.**
- **L'ordre des rubriques d'un écran est porté par une DÉCLARATION STABLE.**
  - **Changement de la 2.1.c-3** : l'ordre n'est plus une liste figée mais une **fonction** qui prend les emplois affichés et rend l'ordre complet — les huit rubriques du salarié d'abord, inchangées, puis les rubriques de chaque emploi. Voir §11.17.
- **Suppressions de lignes de tableau** : aperçu d'impact, puis `DELETE` avec jeton de confirmation ; refus `CONFIRMATION_OBSOLETE` (409) ou `CONFIRMATION_REQUISE` (400).
- **Suppression d'une fiche salarié** : aperçu **sans `mode`**, jeton calculé sur le seul identifiant, donc **jamais obsolète**.
- **Suppression d'un emploi** *(2.1.c-3)* : **même modèle que la fiche salarié** — aperçu sans `mode`, jeton sur le seul identifiant.
- **Le jeton de confirmation ne porte que des FAITS**, jamais un texte d'affichage.
- **Dossiers et fichiers techniques** : minuscules, tirets, sans accent.
- **Base de connaissance** : `/base-de-connaissance`, un article Markdown par sujet. **Les articles sont rédigés par Cursor.**
- **Deux enveloppes de réponse coexistent volontairement** : module 1 `{ data, warnings }`, module 2 `{ donnees, alertes }`. ADR 0021.
- **UNE SEULE FORME DE REFUS SORT DE L'API** (ADR 0029).
- **Trois champs ne peuvent jamais être vides** sur un salarié : `nom`, `prenom`, `dateEntree` (ADR 0030).
- **Les primes contractuelles ne sont PAS historisées** *(2.1.c-3)*. Leur valeur d'un mois est figée dans les éléments variables de ce mois, pas dans la fiche. Elles n'ont ni `etat`, ni mois d'effet, ni aperçu de suppression. **Décision métier du porteur, ne pas la rediscuter.**
- **Un montant affiché passe par une fonction unique** *(2.1.c-3)* : `afficherMontant`, distincte de `afficherNombreDecimal` qui sert aux durées. Raison : la première rend une **case vide** sur une valeur vide, la seconde rend `0`.

---

## 6. Gestion des droits

Modèle à trois niveaux : `famille de droits` → `socle de l'utilisateur (compte)` → `droits par société`.

- Permissions nommées par opération (`salarie.creer`, `emploi.supprimer`…).
- **Les droits varient d'une société à l'autre.**
- **Le socle n'est pas un plafond.**
- **Aucun effet rétroactif** à aucun étage.
- **Administrateur principal unique** par compte.
- **La rémunération forme un bloc à droits propres**, lecture et écriture.

### 6.1 Ce que la lecture expose

`GET /salaries/:id` rend une liste `operations` **à la racine de la fiche** et **sur chaque emploi**. **Jamais par rubrique ni par ligne de tableau.**

Racine : `salarie.lire`, `salarie.modifier`, `salarie.supprimer`, `emploi.creer`, `salarie.remuneration.lire`, `salarie.remuneration.ecrire`.

Emploi : `emploi.modifier`, `emploi.supprimer`, `salarie.remuneration.lire`, `salarie.remuneration.ecrire`.

**`GET /salaries` (la liste) rend aussi `operations` au niveau de la COLLECTION**, contenant `salarie.creer`.

Sans `salarie.remuneration.lire`, la clé `comptesBancaires` est **absente** de la réponse.

> **`operations` n'est posé que sur `GET /salaries/:id`. C'est définitif** *(2.1.c-3)*. Un ajout sur `GET /emplois/:id` a été livré puis **retiré** : aucun écran n'appelle cette route, et l'écran n'applique jamais une réponse d'écriture en bloc (§11.4) — il n'en retient que la version et la ligne concernée. Des `operations` renvoyés sur une écriture seraient systématiquement ignorés. **Point ouvert refermé par « pas nécessaire ».**

### 6.2 Le contrôle d'écriture sur la rémunération — TROIS occurrences du même défaut

**Le mécanisme d'interception reconnaît des NOMS DE CLÉS dans le corps de la requête.** Quand le corps envoie un nom qu'il ne connaît pas, il ne voit rien.

| Occurrence | Chemin | Corps | Correction |
|---|---|---|---|
| **2.1.b** | `PUT /salaries/:id/comptes-bancaires` | clé `comptes`, pas `comptesBancaires` | ADR 0024 — contrôle dans le service |
| **2.1.c-3** | `PATCH /emplois/:id/remuneration` | corps **plat** : `montant`, `modePaiement`, `compteBancaireId` inconnus du registre | ADR 0032 — contrôle dans le service |
| **2.1.c-3** | écritures des **avantages en nature** | `montant` inconnu du registre | ADR 0032 — contrôle dans le service |

**Ce qui était faux à la 2.1.c-3.** Seuls `teletravailIndemniteVersee` et `teletravailMontant` étaient couverts sur le PATCH rémunération. **Un utilisateur ayant `emploi.modifier` mais pas `salarie.remuneration.ecrire` pouvait modifier un salaire.** Découvert par un point d'arrêt, prouvé par un appel rendant 200.

**La création d'un emploi paraissait protégée** — elle l'était par accident : son corps porte une clé englobante que le mécanisme reconnaît. Un appel direct au service passait. **Un contrôle explicite y a été posé**, indépendant de la forme du corps.

**Pourquoi le registre n'a PAS été étendu**, alors que c'était la correction la plus courte : il protège une **forme de corps HTTP**, pas une **donnée**. Un import ou une modification en masse écriraient sans passer par la route.

**Le contrôle est unique et partagé** : `assertEcritureRemunerationSalarie` (anciennement `assertEcritureComptesBancairesSalarie`), appelé depuis quatre services.

**Règle générale** : le contrôle se place au plus près de l'écriture, et un test doit prouver qu'il se déclenche **sur ce chemin précis** et **ne déborde pas**.

---

## 7. Héritage et historisation

### Héritage — modèle Silae

**Case vide = valeur héritée. Case remplie = valeur propre.** Aucune case à cocher.

Résolution : **`SAL > ETB > SOC > NAT`**.

- Un champ héritable est **toujours nullable en base**. `null` = hérité.
- La valeur résolue s'affiche **en dessous du champ**, en petit, **avec son origine**.
- **La valeur propre et la valeur résolue ne se mélangent jamais** (ADR 0017).
- **Pas de bouton « tout hériter »**, et **pas de bouton « rétablir la valeur héritée »** *(2.1.c-3)* : vider le champ suffit, et un second chemin pour le même geste serait une dette.
- **Vider un champ héritable envoie `null` explicite**, jamais une omission ni une chaîne vide. Une omission signifie « pas de changement ».
- **La ligne d'héritage reste affichée, inchangée, pendant la saisie**, et jusqu'à l'enregistrement.
- **Une exception** : les jours fériés travaillés, avec un booléen explicite `suivreJoursFeriesEtablissement`.
- **Le moteur de paie ne lit jamais la fiche société.**

**Champs héritables retenus** (liste close) : durée contractuelle, repos hebdomadaire, télétravail autorisé, indemnité de télétravail, montant de l'indemnité, grille horaire, jours fériés travaillés.

> **PIÈGE MAJEUR, découvert à l'œil au temps 3 de la 2.1.c-3.**
> **L'héritage est résolu AU MOIS EN COURS DU SALARIÉ.** Sans aucun bulletin, ce mois est déduit de la date de début de l'emploi ouvert le plus ancien — donc souvent **très ancien**. Un paramétrage d'établissement postérieur à ce mois est **invisible** : la résolution ne trouve rien et rend `null`.
> *Cas réel : le seed posait le paramétrage à 2025-01 et 2025-07, alors que le mois en cours du salarié de démonstration était 2022-03. L'écran affichait des champs vides sans aucune valeur héritée. Ni l'API ni l'écran n'étaient en cause — c'était le seed, et c'était un défaut de cadrage de Claude.*
> **Corrigé** par un paramétrage à 2022-01, et **prouvé** par un test.

**Les résolutions de télétravail sont masquées sans `salarie.remuneration.lire`** *(2.1.c-3)* : `teletravailIndemniteVersee` et `teletravailMontant` disparaissent de `resolutions`. Sans cela, un utilisateur sans droit sur la rémunération voyait un montant. **La clé est supprimée, jamais mise à `null`** (§4, principe 7).

### Historisation — deux mécanismes, et c'est voulu

**Critère unique :** *le moteur a-t-il besoin de cette valeur telle qu'elle était pour recalculer un bulletin d'un mois passé ?*

| Bloc | Porté par | Mécanisme |
|---|---|---|
| `CONTRAT` | Emploi | table de versions datées |
| `REMUNERATION` (paiement inclus) | Emploi | table de versions datées |
| `AFFECTATION_TEMPS_DE_TRAVAIL` | Emploi | table de versions datées |
| `PERSONNES_A_CHARGE` | Salarié | lignes à validité temporelle |
| `RETENUES` (prêts et saisies) | Salarié | lignes à validité temporelle |
| `AVANTAGES_EN_NATURE` | Emploi | lignes à validité temporelle |
| `STATUTS_PARTICULIERS` | Emploi | validité par dates de début et de fin |

> **Les comptes bancaires ne sont PAS historisés.** Suppression physique.
> **Les primes contractuelles ne sont PAS historisées.** Voir §5.

**Règles de comportement :**
- **Le client n'écrit JAMAIS une version ni une date d'effet.** Les champs `moisEffetDebut` et `moisEffetFin` envoyés par le client sont **REFUSÉS** (`CHAMP_INTERDIT`).
- **On écrase sans créer de version** tant qu'aucun bulletin n'existe pour le mois concerné.
- **Modifier un historique n'est jamais bloqué.**
- **Deux lectures d'une même ligne**, volontairement divergentes au mois de clôture. **Ne jamais les aligner** — ADR 0011.

---

## 8. Le mois en cours et les états du bulletin

Il n'y a pas de clôture mensuelle explicite. Le mois en cours est **déduit**, au niveau **salarié**, tous emplois confondus.

**Cinq états**, dont seuls trois sont stockés : 0 non calculable · 1 calculable · 2 calculé · 3 validé · 4 édité.

**Cascade du mois en cours :**
1. S'il existe un mois avec au moins un bulletin à l'état 2 ou 3 → **ce mois** (le plus récent).
2. Sinon, si des bulletins existent, tous à l'état 4 → **le mois suivant le plus récent**.
3. Sinon → le mois de début de l'**emploi actif le plus ancien**, ou à défaut le **mois calendaire** (fuseau `Africa/Casablanca`).

> **Conséquence** : sans aucun bulletin, le mois en cours d'un salarié est souvent **très ancien**. **C'est le piège de l'héritage décrit au §7** — toute donnée datée postérieurement est invisible.

> **`Company.moisEnCours` existe dans le seed mais ne pilote PAS la résolution d'héritage.** Seul le mois en cours **du salarié** compte.

---

## 9. Cartographie des modules

1. **Fiches** : société ✅, salariés ⏳ (API livrée ; socle, liste, identité, quatre tableaux du salarié, création, suppression, **emplois en accordéon et rubriques modifiables** livrés ; restent les trois tableaux d'emploi, la création et la suppression d'un emploi), organismes
2. **Traitement mois** : heures, éléments variables, contrôle des bulletins, import
3. **Gestion** : contact, grilles horaires, planning, imputations analytiques, acomptes, augmentations
4. **Paramétrage** : cotisations, primes, heures, accords, absences, fonctions calculs, masques d'édition, méthodes, liaison comptable, jours fériés, lieux de travail, notes de frais
5. **Référentiel** : cotisations, prélèvement à la source, primes, heures, absences, fonctions calculs
6. **Outils** : synthèses, suivi de production, analyse de l'effectif, modifications en masse
7. **Déclarations** : CNSS, AMO, SIMPL-IR
8. **Alertes**
9. **Simulation**

**Module d'authentification** : à intercaler avant toute mise en production.

---

## 10. État d'avancement

### ✅ Module 0 — Fondations
### ✅ Module 1 — Fiche société
Écrans livrés en 1.1.c. Article publié en brouillon, **non relu**. ADR 0005 à 0010.

### ✅ Module 2, phase 2 — Cadrage de la fiche salarié : CLOS
`PaymaRH_Fiche_salarie_v5.xlsx` et `docs/specification-fiche-salarie-v5.md`.
> **Attention** : cette spécification est **figée pour l'étape 2.1.a — modèle de données uniquement**. Elle **ne définit ni rubriques d'écran, ni alertes, ni contrôles bloquants pour l'emploi**. Ne pas l'interroger sur ces sujets.

### ✅ 2.1.a — Modèle de données · ✅ 2.1.b — API REST · ✅ 2.1.c-1 — Socle et liste
### ✅ 2.1.c-2 — Rubriques portées par le salarié : CLOS
**644 tests, 92 fichiers.** ADR 0022 à 0031.

### ⏳ 2.1.c-3 — Les emplois — temps 1 à 4 livrés

**698 tests, 100 fichiers.**

**Temps 1 — Les trous d'API et le seed.**
Le point d'arrêt d'ouverture a établi que **l'API des emplois était déjà entièrement livrée** — 17 routes, création et suppression comprises. Le plan initial, qui supposait du travail d'API, a été refait : la 2.1.c-3 est un travail d'écran à 90 %.
Livré : les trois aperçus d'impact manquants (avantages en nature, statuts particuliers, emploi entier) avec jetons ; le client HTTP correspondant ; le seed enrichi.
**Le prompt est parvenu amputé à Cursor** (voir §2) : trois chantiers sur six ont été reconstruits de travers, puis corrigés.

**Correctif du temps 1.**
Retrait d'`operations` sur `GET /emplois/:id` ; **masquage des résolutions de télétravail** ; **registre de masquage ramené à une source unique** (il en avait deux, dont l'une réenregistrait ce que l'autre retirait — d'où l'impossibilité de casser le mécanisme proprement) ; test du masquage sur `GET /salaries/:id`, qui n'existait pas ; ADR 0027 corrigée ; code mort retiré.
> **Un chantier prévu a été annulé** : le refus sur les statuts particuliers propagés existait déjà, dans le service, correctement placé. Le relevé d'ouverture était faux, et le rapport de Cursor avait raison.

**Temps 2 — Le socle multi-version.**
Le socle ne savait porter qu'un numéro de version, celui du salarié. Un salarié à deux emplois en a trois.
Livré : versions par entité, **ordre d'envoi calculé** à partir des emplois, **sommaire dissocié de l'ordre d'envoi**, **libellés unifiés en un seul endroit**, et **erreur bruyante** quand une rubrique inscrite est absente de l'ordre — auparavant elle était abandonnée en silence, ce qui aurait produit une saisie perdue sans message.
> **Cinquième occurrence du motif de vigilance** : une valeur par défaut recréée à chaque affichage a provoqué une boucle sans fin (21 minutes de tests avant saturation mémoire). **Signalée et corrigée à la racine**, conformément à la consigne.

**Temps 2 bis — Les référentiels d'emploi.**
Le point d'arrêt du temps 3 a établi que **les types de contrat, motifs de sortie et statuts particuliers n'avaient aucune route HTTP**. Sans elles, l'écran aurait affiché des codes bruts.
Cursor s'est **arrêté avant d'écrire** : ces trois tables n'avaient pas de champ `ordre`, et un tri alphabétique n'aurait pas reproduit l'ordre métier.
Livré : migration ajoutant `ordre` **sans unicité**, trois routes de liste, chargement par la page, et correction de l'ordre des rubriques d'emploi.
> **TAHFIZ est exclu de la liste des statuts particuliers** : c'est une exonération portée par la société, jamais un statut saisi. Il reste en base pour la propagation.

**Temps 3 — L'accordéon, en lecture.**
Livré : le bloc Emplois, l'accordéon, les quatre rubriques en lecture, l'affichage de l'héritage, le retrait du placeholder de rémunération.

**Correctif du temps 3.**
La vérification à l'œil a montré **des champs vides sans aucune valeur héritée**. Le diagnostic a établi que ni l'API ni l'écran n'étaient en cause : **le seed posait le paramétrage d'établissement à une date que le salarié n'atteignait jamais** (voir §7). Corrigé, et **prouvé par un test sur `GET /salaries/:id`** — chemin qu'aucun test ne couvrait jusque-là.

**Correctif de sécurité (ADR 0032).** Voir §6.2.

**Temps 4 — Les rubriques d'emploi modifiables.**
Livré : trois rubriques modifiables par emploi, le formatage unique des montants, la phrase d'héritage manquante sous la répartition horaire.
> **Sixième occurrence du motif de vigilance, et un défaut grave** : **replier un accordéon supprimait silencieusement les modifications non enregistrées de cet emploi.** Le repli démontait les rubriques, ce qui les désinscrivait du registre. Corrigé en gardant le corps monté et masqué. **Cursor a corrigé sans s'arrêter, alors que la consigne l'exigeait** — la correction est bonne, la décision aurait dû revenir au porteur.

### ⏭️ Reste à faire

**Temps 5** — les **trois tableaux portés par l'emploi** : primes contractuelles, avantages en nature, statuts particuliers.
**Temps 6** — la **création** et la **suppression** d'un emploi.
**Puis** — traiter à la racine le motif de vigilance (§15).

---

## 11. Les écrans — décisions figées

### 11.1 Routes et contexte société

```
/societes/[id]/salaries              liste des salariés
/societes/[id]/salaries/nouveau      création d'un salarié
/societes/[id]/salaries/[salarieId]  fiche d'un salarié
```

**La société est portée par l'URL, jamais par un état applicatif.** Ni état global, ni stockage navigateur, ni sélecteur de société.

### 11.2 Le squelette

Trois colonnes : **sommaire à gauche · rubriques au centre · rail d'actions à droite**. Sommaire et rail restent visibles au défilement, repliables. Les rubriques sont **empilées, toutes visibles, toujours éditables**. Pas de mode lecture.

### 11.3 L'enregistrement — un seul bouton pour une API découpée

L'API modifie **par rubrique**. L'écran n'a **qu'un seul bouton Enregistrer**.

**Un registre des modifications** partagé par la page. Contrat `RubriqueEnregistrable` : `id`, `libelle`, **`entite`**, `estModifiee()`, `envoyer(version)`, `reinitialiser()`.

Au clic : les rubriques modifiées sont envoyées **une par une, en séquence, dans l'ordre déclaré**. Jamais en parallèle.

**Le numéro de version circule — MAIS PAR ENTITÉ** *(changement du temps 2)*. Chaque rubrique reçoit le numéro de version de l'entité qui la porte : celui du salarié pour une rubrique du salarié, celui de **son** emploi pour une rubrique d'emploi. **Un succès ne met à jour que le numéro de son entité.**

**Deux natures de refus, deux comportements :**

| Refus | Comportement |
|---|---|
| **Métier** (`400` avec code, `403` sans code) | on continue ; la rubrique refusée garde sa saisie et affiche le message du serveur |
| **Conflit** (`409` `CONFLIT_VERSION`, `428`) | on **arrête immédiatement** ; **un seul bandeau, au niveau de la fiche** |
| **Non métier** (`500`) | message générique, **jamais le message du serveur** |

**Des tests protègent cette asymétrie — ne jamais les fusionner.**

**Un conflit sur une rubrique d'emploi se comporte exactement comme un conflit sur une rubrique du salarié** : même arrêt, même bandeau unique, même bouton « Recharger les valeurs du serveur ». **Le bandeau ne nomme pas l'emploi en cause** — le bouton recharge toute la fiche de toute façon.

**Annuler** abandonne les modifications de toute la fiche, en **nommant les rubriques concernées**, et **ne provoque aucun appel serveur**.

> **`reinitialiser()` ramène aux valeurs du DERNIER ENREGISTREMENT RÉUSSI**, jamais à celles du chargement.

**LE VERROUILLAGE :**

| Situation | Effet |
|---|---|
| **Enregistrement en cours** | **TOUTES les rubriques** deviennent non modifiables |
| **Écriture hors séquence en cours** | boutons Supprimer du tableau concerné **et** bouton Enregistrer du rail inactifs |
| **Suppression de la fiche en cours** | Enregistrer **et** Annuler inactifs |

**Le signal de fin est émis au succès COMME À L'ÉCHEC.**

### 11.4 Ce que l'écran retient d'une réponse d'écriture — CRITIQUE

**Les routes POST, PATCH, PUT et DELETE des tableaux renvoient LA FICHE ENTIÈRE, relue en base.** Les routes PATCH d'emploi renvoient **l'emploi complet**, pas la fiche.

**Règle générale.** L'écran n'applique **jamais** la fiche en bloc. Il n'en retient que **deux choses** : le nouveau numéro de version, et la ligne portant l'identifiant concerné.

**Raison** : les autres rubriques peuvent porter une saisie non enregistrée.

**Exception unique — le PUT groupé des comptes bancaires.** ADR 0023.

**Toute mise à jour d'état doit partir de l'état courant, jamais d'une capture prise plus tôt.**

### 11.5 La découpe des rubriques d'identité — quatre blocs

| Bloc | Route |
|---|---|
| **Identité** | `PATCH /salaries/:id/identite` |
| **Identifiants et immatriculations** | `PATCH /salaries/:id/identifiants-legaux` |
| **Coordonnées** | `PATCH /salaries/:id/coordonnees` |
| **Dates clés** | `PATCH /salaries/:id/dates` |

**Les valeurs déduites ne bougent pas avant l'enregistrement.**

**Les alertes** : avec un nom de champ → sous le champ ; sans nom de champ → en tête de son bloc. **Jamais de bandeau global.**

**Les astérisques.** Portent : nom, prénom, sexe, date d'entrée. Ne portent pas : date d'ancienneté, date de naissance.

> **Écart de câblage connu** : le bloc Identité passe au hook un `onServeurChange` inerte, à la différence des trois autres. **Ne pas le reproduire** : les nouvelles rubriques copient le câblage de Coordonnées et Identifiants légaux.

### 11.6 Ordre dans la page

Identité → Identifiants → Coordonnées → Personnes à charge → Comptes bancaires → Dates clés → Prêts → Saisies sur salaire → **Emplois**

### 11.6 bis Les quatre chemins d'écriture d'un tableau

1. modification locale d'une ligne ; 2. enregistrement via le bouton ; 3. **suppression immédiate hors séquence** ; 4. suppression locale d'une ligne jamais enregistrée.

**LES QUATRE CHEMINS ÉCRIVENT LES ÉTATS *ET* LES COPIES `ref`. SANS EXCEPTION.**

**Le chemin 3 court après un `await`** — l'écriture doit y être **synchrone, dans le handler, avant le signal au registre**.

### 11.7 Les tableaux répétables — comportement figé

**Le tableau reste un affichage en lecture seule.** Un clic déplie le formulaire **juste en dessous, dans la page, sur toute la largeur, en disposition verticale.**

**Composant générique pour l'enveloppe seulement** — **et un formulaire écrit à la main par tableau.**

**L'ENVELOPPE PORTE LA SUPPRESSION POUR LES DEUX FAMILLES, À TRAVERS UN CONTRAT UNIQUE INJECTÉ** : `preparer(ligne)` et `confirmer(ligne)`. **Elle ne connaît aucun code de refus, aucun client d'appel, aucun nom de tableau.** Un test statique le vérifie.

**Pas de colonne « État ».** L'enveloppe reçoit `idColonneMarque` et injecte les mentions.

**Un seul formulaire ouvert sur toute la page**, tous tableaux confondus.

**Deux boutons dans le formulaire déplié**, aucun appel serveur.

**Aucun tri côté écran.** **Une ligne ajoutée non encore enregistrée s'affiche en dernier.**

**Les lignes CLÔTURÉES sont affichées** en grisé, avec « inactive depuis MM/AAAA », et se déplient **en lecture seule**.

**Un tableau est UNE SEULE rubrique** au regard du registre.

### 11.8 Les suppressions dans les tableaux

| | Ajout et modification | Suppression |
|---|---|---|
| Comptes bancaires | différés | **différée aussi** |
| Personnes à charge, prêts, saisies | différés | **immédiate**, avec aperçu et jeton |
| **Avantages en nature, statuts particuliers** | différés | **immédiate**, avec aperçu et jeton *(routes livrées au temps 1)* |
| **Primes contractuelles** | différés | **pas d'aperçu** — non historisées ; fenêtre composée entièrement par l'écran |

### 11.9 à 11.12

*(Comptes bancaires, prêts, saisies sur salaire, liste des salariés : inchangés depuis la v9. Voir ce document pour le détail si un besoin précis se présente — aucune décision de la 2.1.c-3 ne les a modifiés, hors le formatage des montants.)*

### 11.13 L'écran de création d'un salarié

**Route** `/societes/[id]/salaries/nouveau`. **Les quatre blocs d'identité sont RÉUTILISÉS, JAMAIS DUPLIQUÉS**, via un contrat **distinct** `RubriqueCreable`. **Un seul appel POST.** **Quatre implémenteurs, jamais neuf** — les tableaux répétables ne participent jamais à une création. ADR 0028.

> **Ce contrat n'a PAS été étendu aux emplois** *(décision du temps 2)*. On ne sait pas encore à quoi ressemblera l'écran de création d'un emploi ; préparer un mécanisme avant d'avoir le cas réel sous les yeux est la porte de sortie dont on se méfie. **Le temps 6 s'en chargera.**

### 11.14 Supprimer le salarié

Clic → aperçu d'impact → fenêtre → DELETE avec jeton et `If-Match` → **retour à la liste**, sans message de confirmation.

### 11.15 Le garde de navigation (ADR 0031)

**Un module unique** — `components/navigation/` — seul autorisé à importer les outils de navigation de Next, **et une règle de lint** qui l'impose.

**Un fournisseur racine** expose « y a-t-il quelque chose à perdre ». **Les écrans à saisie s'y déclarent** au montage et **s'en retirent au démontage**. L'en-tête consulte.

> **Le retrait au démontage est aussi important que la déclaration.**

**Le bloc Emplois est un écran à saisie depuis le temps 4** : les rubriques d'emploi modifiées apparaissent dans la liste des rubriques à perdre, au bouton Annuler comme au garde.

**Ce qui n'est PAS gardé, et c'est assumé** : le bouton Retour du navigateur, la barre d'URL, la liste des salariés.

### 11.16 Les emplois — décisions d'écran *(temps 3 et 4)*

**Emplacement** : bloc en bas de page, après Saisies sur salaire. Le bloc porte l'identifiant vers lequel le sommaire fait défiler.

**Le sommaire porte UNE SEULE entrée « Emplois »**, marquée navigation seule, signalant si un emploi porte des modifications. **Pas une entrée par emploi** : elle pointerait vers du replié, donc de l'invisible.

**Un seul emploi déplié à la fois.**

**À l'ouverture** : aucun emploi déplié si le salarié en a plusieurs ; le seul, s'il n'en a qu'un. *Déplier d'office avec deux emplois désignerait arbitrairement l'un des deux comme principal — ça n'existe pas dans le modèle.*

**Ligne repliée** : poste · type de contrat · date de début · date de sortie si elle existe. **Pas le matricule**, qui appartient au salarié.

> **LE CORPS D'UN ACCORDÉON REPLIÉ RESTE MONTÉ, MASQUÉ.** *(Défaut réel du temps 4 : le repli démontait les rubriques, ce qui les désinscrivait du registre et **supprimait silencieusement les modifications non enregistrées**.)* **Ne jamais revenir à un démontage.**

**Changer d'emploi déplié n'avertit de rien et ne perd rien.**

**Emplois terminés** : repliés derrière « afficher les emplois terminés ». **Cette bascule est absente du DOM s'il n'y a aucun emploi terminé.** Un emploi terminé **reste modifiable** — « modifier un historique n'est jamais bloqué ».

**Salarié sans aucun emploi** : une phrase sobre. Pas de tableau vide, pas de tiret.

**Trois rubriques modifiables par emploi**, dans cet ordre : **contrat, affectation, rémunération**.

> **Rémunération et Paiement forment UNE SEULE rubrique d'écran** *(temps 4)*. L'API n'a que trois routes PATCH, le paiement passant par celle de la rémunération (ADR 0016). Deux rubriques d'écran pour une route auraient produit deux appels sur la même route, le second écrasant le premier. L'API range déjà le paiement dans la version de rémunération : c'est un seul bloc métier, historisé d'un seul tenant. Le paiement est une **sous-section visuelle**.

**Sans `salarie.remuneration.lire`** : la rubrique Rémunération est **absente du DOM**.
**Sans `salarie.remuneration.ecrire`** : elle s'affiche en lecture, non modifiable.

**Champs déduits, affichés et non modifiables** : durée de la période d'essai, état d'ouverture, durée dans l'autre base.

**Le compte bancaire est une liste déroulante des comptes du salarié.** Le cas « je vois Paiement mais pas les comptes » ne peut pas se produire : les deux sont masqués ensemble.

### 11.17 L'ordre des rubriques — calculé depuis le temps 2

L'ordre n'est plus une liste figée. C'est une **fonction** qui prend les emplois affichés et rend l'ordre complet : les **huit rubriques du salarié d'abord, inchangées**, puis pour chaque emploi, dans l'ordre d'affichage, ses rubriques dans un ordre déclaré.

**L'identifiant d'une rubrique d'emploi est composé en un seul endroit**, jamais déduit ailleurs.

**Le sommaire lit la même source, mais pas la même liste** : huit rubriques du salarié + « Emplois ». **Les rubriques d'emploi n'apparaissent pas au sommaire.**

> **Une rubrique inscrite au registre mais absente de l'ordre lève une erreur visible.** Auparavant elle était abandonnée en silence. Avec des identifiants composés dynamiquement, une faute de composition aurait produit **une saisie perdue sans aucun message**.

**Un seul endroit compose les libellés qualifiés** — « Contrat — Responsable paie » —, utilisé par le bouton Annuler **et** par le garde de navigation. Avant le temps 2, il y en avait deux.

---

## 12. L'API — relevé vérifié

Contrôleurs : `salaries.controller.ts` (`@Controller('salaries')`) et `emplois.controller.ts` (`@Controller('emplois')`). Aucun préfixe global.

### 12.0 Création et suppression d'une fiche salarié

```
POST   /salaries
GET    /salaries/:id/impact-suppression
DELETE /salaries/:id?confirmationJeton=
```

**Le POST n'exige PAS `If-Match`.** Corps : `nom`, `prenom`, `sexe`, `dateEntree` obligatoires ; tout le reste facultatif, `dateNaissance` comprise. **Le POST n'accepte pas d'emploi.**

### 12.1 Les quatre tableaux du salarié

`personnes-a-charge`, `prets`, `saisies-sur-salaire` : POST / PATCH / DELETE / impact-suppression. `if-match` exigé sauf sur l'aperçu.

**Comptes bancaires** : `PUT /salaries/:id/comptes-bancaires`, corps `{ comptes: [...] }`, **tout ou rien**.

### 12.2 L'API des emplois — 17 routes + création

```
POST   /salaries/:salarieId/emplois            création (SansIfMatch, emploi.creer)
GET    /emplois/:id                             lecture (aucun écran ne l'appelle)
GET    /emplois/:id/versions/...                historiques
PATCH  /emplois/:id/contrat                     emploi.modifier, If-Match
PATCH  /emplois/:id/remuneration                emploi.modifier, If-Match — PAIEMENT INCLUS
PATCH  /emplois/:id/affectation-temps-de-travail emploi.modifier, If-Match
POST|PATCH|DELETE /emplois/:id/primes-contractuelles[/:ligneId]
POST|PATCH|DELETE /emplois/:id/avantages-en-nature[/:ligneId]
POST|PATCH|DELETE /emplois/:id/statuts-particuliers[/:ligneId]
GET    /emplois/:id/avantages-en-nature/:ligneId/impact-suppression
GET    /emplois/:id/statuts-particuliers/:ligneId/impact-suppression
GET    /emplois/:id/impact-suppression
DELETE /emplois/:id?confirmationJeton=          emploi.supprimer, If-Match
```

**La version exigée par une écriture d'emploi est celle de L'EMPLOI, pas du salarié.**

**Une route PATCH d'emploi renvoie l'emploi complet**, pas la fiche entière.

**Pas d'aperçu pour les primes contractuelles** — non historisées.

**Le refus de suppression d'un emploi pour cause de bulletins est inactif** tant que le port bulletin rend une liste vide.

### 12.3 Les statuts particuliers propagés

Une ligne porte `origine` : `SAISIE_MANUELLE` ou `PROPAGE_SOCIETE`.

**Un refus serveur, placé DANS LE SERVICE, empêche de modifier ou supprimer une ligne propagée.** Il existe depuis 2.1.b, couvre PATCH et DELETE, et **ne bloque pas la propagation TAHFIZ**, qui écrit directement en transaction. **Le client ne peut pas imposer `origine`.**

### 12.4 Le champ `etat` — trois valeurs

`'ACTIVE' | 'PAS_ENCORE_EFFECTIVE' | 'CLOTUREE'`. **Aucune colonne `etat` en base** — déduit à la lecture par `deduireEtatLigne`, dans un ordre qui compte. **Cette fonction sert CINQ tableaux** — les trois du salarié, plus avantages en nature et statuts particuliers. **Les primes contractuelles ne l'appellent pas.**

### 12.5 Verrouillage optimiste et alertes

**Toutes les écritures exigent `if-match`, sauf les POST de création.** Aperçu d'impact : `{ salarieId, ligneId, mode, message, jetonConfirmation }` pour une ligne ; **sans `mode`** pour une fiche ou un emploi entier.

```ts
interface AlerteApi {
  readonly code: string;
  readonly champ?: string;
  readonly indexLigne?: number;   // PUT groupé des comptes bancaires UNIQUEMENT
  readonly message: string;
  readonly salarieExistantId?: string;
}
```

### 12.6 Le type `EmploiFiche`

`id`, `version`, `numeroOrdre`, `contrat`, `remuneration?`, `paiement?`, `affectation`, `primesContractuelles?`, `avantagesEnNature?`, `statutsParticuliers`, `resolutions`, `operations?`.

**Cinq champs optionnels, une seule signification** : masqué faute de `salarie.remuneration.lire` — à l'exception d'`operations`, documentée à la définition du champ.

> **`versEmploiComplet` déclare `Omit<EmploiFiche, 'resolutions'>`, et c'est CORRECT** : le mapper ne pose pas les résolutions, les appelants les ajoutent. **L'ADR 0027 disait le contraire ; elle a été corrigée avec une note datée.** Interdit d'introduire une conversion forcée pour faire coïncider les deux.

### 12.7 `ResolutionsEmploi`

Sept champs. `| null` signifie **« aucune valeur héritée trouvée »**. **Deux champs sont optionnels** — `teletravailIndemniteVersee` et `teletravailMontant` — et leur optionalité signifie **uniquement « masqué faute de droit »**, la clé étant supprimée.

### 12.8 UNE SEULE FORME DE REFUS (ADR 0029)

Le `ValidationPipe` global traduit chaque erreur en `{ code, message, champ }`. **C'est GLOBAL**, sur toutes les routes. **AUCUNE chaîne anglaise de class-validator ne sort de l'API.** **Un seul champ est désigné par refus.**

### 12.9 Les trois champs qui ne peuvent pas être vides (ADR 0030)

`nom`, `prenom`, `dateEntree`. **INTERDIRE LE VIDE N'EST PAS INTERDIRE L'ABSENCE** : un PATCH qui ne contient pas le champ réussit. **En base, `NOT NULL` n'interdit pas la chaîne vide** — protection portée par l'API seule.

### 12.10 Le tri et les référentiels

| Référentiel | Route | Ordre porté par la donnée |
|---|---|---|
| Pays | `GET /referentiels/pays` | oui (Maroc en tête) |
| Situations familiales | `GET /referentiels/situations-familiales` | oui |
| Liens de parenté | `GET /referentiels/liens-parente` | oui |
| Types de saisie sur salaire | `GET /referentiels/types-saisie-sur-salaire` | oui |
| **Types de contrat** | `GET /referentiels/types-contrat` | oui *(2.1.c-3, sans unicité)* |
| **Motifs de sortie** | `GET /referentiels/motifs-sortie` | oui *(2.1.c-3, sans unicité)* |
| **Statuts particuliers** | `GET /referentiels/statuts-particuliers` | oui *(2.1.c-3, TAHFIZ exclu)* |
| Banques | `GET /referentiels/banques` | **non** — tri par nom, point ouvert |

Les référentiels du module 2 utilisent l'**enveloppe module 1** (`{ data, warnings }`) et un contrôle `referentiel.lire` **dans le service**.

> **`reposHebdomadaire` n'est PAS un référentiel** : c'est une union fermée de sept valeurs, dont les libellés sont portés localement par l'écran.

> **La liste des types de contrat doit rester extensible sans migration.** Ne pas la figer en énumération TypeScript fermée.

---

## 13. Ce que les temps ont appris — à ne pas réapprendre

**Un relevé trouve ce qu'aucun test ne cherche.** À la 2.1.c-3 : une API déjà livrée que le plan supposait à écrire, des référentiels sans route, une faille d'écriture réelle, un conflit entre le nombre de rubriques d'écran et le nombre de routes.

**Un relevé peut être FAUX.** Un fait affirmé dans un relevé antérieur a fait recommander une correction inutile ; c'est le rapport de Cursor qui a rétabli la vérité.

**Une décision métier peut réécrire une API déjà livrée** — ou empêcher une migration inutile. *Les primes contractuelles ont failli être historisées sur un malentendu.*

**Masquer à l'écran ne protège pas. Un contrôle placé sur une route ne protège que cette route. Un contrôle qui reconnaît des noms de clés ne protège que les corps qui portent ces noms** — trois failles réelles, même cause.

**Une protection peut tenir à un accident de forme.** La création d'un emploi paraissait protégée : son corps portait par hasard une clé que le mécanisme reconnaissait.

**Une même forme ne doit jamais porter deux significations.** Rencontré cinq fois : le champ `etat`, l'optionalité d'`EmploiFiche`, les deux langages de refus, le `null` des résolutions, et le registre de masquage à deux sources.

**Un mécanisme sans appelant est une dette qui se prend pour un acquis.** Cinq retirés ou signalés à ce jour.

**Un test vert ne dit rien de l'écran.** Quatrième occurrence à la 2.1.c-3 : le test d'héritage fabriquait ses données et restait vert pendant que l'écran était vide. **Un test qui fabrique ses données ne prouve pas le chemin réel.**

**Un test peut couvrir la route que personne n'appelle.** Tout l'héritage était testé sur `GET /emplois/:id`, qu'aucun écran n'utilise. Sur la route réelle, seule la présence des clés était vérifiée.

**Une donnée invisible à l'écran peut n'être ni un défaut d'API ni un défaut d'écran.** Le seed peut être daté de telle façon que la résolution ne trouve rien.

**Un abandon silencieux est pire qu'une erreur.** Une rubrique absente de l'ordre n'était pas envoyée, sans message. Un accordéon replié effaçait les modifications, sans message.

**Le motif parent/enfant est structurel, pas accidentel.** Six occurrences. Voir §15.

**Un prompt amputé produit un travail de travers.** Et le porteur ne peut pas le voir : il colle ce qu'il voit à l'écran.

**Les tests ne voient pas l'écran. Quinze défauts réels trouvés à l'œil à ce jour.**

---

## 14. Le modèle de la fiche salarié — l'essentiel

**Structure : identité (1) + emplois (N).** Pas d'objet « contrat » : le type de contrat est un champ de l'emploi. Un CDD transformé en CDI reste **le même emploi**. Une rupture suivie d'une réembauche crée un **nouvel emploi**.

Deux emplois peuvent coexister dans la même société. **Aucune limite.**

| Porté par le **salarié** | Porté par l'**emploi** |
|---|---|
| Identité, état civil, coordonnées | Poste, dates, type de contrat, période d'essai |
| Immatriculations (CNSS, CIMR) | Établissement, service, département |
| Personnes à charge | Temps de travail, grille horaire, repos hebdomadaire |
| Comptes bancaires | Jours fériés travaillés, télétravail |
| Date d'entrée, date d'ancienneté | Rémunération, paiement |
| Prêts, saisies sur salaire | Primes, avantages en nature, statuts particuliers |

**Deux sorties** : sortie d'emploi (STC) et sortie du salarié, **déduite**. **Une seule ancienneté par salarié.**

### Emplois multiples et calcul

- **Deux emplois = deux bulletins.** Plafonds et barèmes sur le **total des assiettes**.
- **Tout au prorata des assiettes** : IR, abattement, charges de famille, plafond CNSS, prêts, saisies.
- Jours plafonnés à **26**.
- **Déclarations** : une seule ligne consolidée par salarié. **À faire confirmer auprès des administrations.**

### Chaîne de calcul

**Fiche → éléments variables → bulletin, pour les PRIMES SEULEMENT.** Le salaire de base, les avantages en nature, les prêts et les saisies alimentent le bulletin directement — d'où leur historisation, et d'où la **non-historisation des primes contractuelles**.

### Valeurs déduites — jamais stockées

Type de pièce d'identité · date de sortie du salarié · état actif/inactif · solde restant d'un prêt · durée du travail dans l'autre base · durée de la période d'essai · nombre de personnes à charge · libellé accordé en genre · mois en cours · état d'une ligne de tableau · **état d'ouverture d'un emploi**.

### Trois unicités, toutes par société

Matricule (toujours) · numéro de pièce d'identité (si renseigné) · numéro CNSS (si renseigné).

### Les prêts, les saisies, les comptes bancaires

*(Règles métier inchangées depuis la v9.)*

### Une exception : TAHFIZ

Exonération **portée par la société**. Son activation propage le statut à tous les salariés **ayant un emploi ouvert**, existants et futurs — jamais aux salariés sortis. Une ligne propagée est en **lecture seule depuis la fiche salarié**, et **le serveur le refuse**, pas seulement l'écran. **TAHFIZ n'apparaît pas dans le référentiel des statuts particuliers saisissables.**

---

## 15. Points ouverts

### Refermés — ne plus les chercher

- ~~`operations` sur `GET /emplois/:id` et sur les réponses d'écriture~~ → **pas nécessaire**, §6.1.
- ~~Le registre de masquage à deux sources~~ → source unique.
- ~~Résolutions de télétravail visibles sans droit~~ → masquées.
- ~~Aperçus d'impact manquants sur les tableaux d'emploi et l'emploi entier~~ → livrés.
- ~~Référentiels d'emploi sans route HTTP~~ → livrés, avec `ordre`.
- ~~Une rubrique hors ordre abandonnée en silence~~ → erreur visible.
- ~~L'écriture de rémunération non protégée sur les routes d'emploi~~ → ADR 0032.
- ~~`refuserModificationStatutPropage` sans appelant~~ → retirée.

### LA DETTE À TRAITER — motif parent/enfant

| Réf | Sujet | État |
|---|---|---|
| **★** | **Un état calculé par le parent avant que l'enfant ait rafraîchi ses copies. SIX occurrences** : temps 2.b, 3-0 bis, correctif 3-3, boucle infinie du temps 2, repli d'accordéon du temps 4, et une antérieure. Contournées au cas par cas à chaque fois. **Le seuil de « traiter à la racine » est largement dépassé.** | **à traiter APRÈS LE TEMPS 6, avant la clôture de la sous-étape** |

### Ouverts

| Réf | Sujet | État |
|---|---|---|
| — | Béquilles de dev `x-paymarh-user-id`, `NEXT_PUBLIC_PAYMARH_USER_ID`, `x-paymarh-permissions-refusees` | **bloquent la mise en production** |
| — | **Prêts et saisies ne portent aucun contrôle de droit en écriture** au-delà de `salarie.modifier`. C'est la configuration qui a produit trois failles | module d'authentification |
| — | `referentiel.lire` est accordé à tout utilisateur authentifié : le contrôle n'est pas réellement testable | module d'authentification |
| — | **Le détail de la grille horaire héritée n'est pas affiché** — la phrase dit « 7 lignes de grille horaire » sans les montrer. Les types d'heures n'ont pas de route | **module 3** |
| — | **Les jours fériés travaillés hérités n'affichent rien** | **module 3** |
| — | `departementRef`, `serviceRef`, `repartitionHoraireRef` affichés tels quels — références vers des référentiels inexistants | **module 3** |
| — | **`declarerCleRubrique` n'a plus aucun appelant** — mécanisme d'extension jamais branché | à retirer |
| — | **La page de la fiche charge dix choses en parallèle** à chaque ouverture | à mesurer |
| — | **Tous les emplois restent montés en permanence** (corps masqué, pas démonté). Nécessaire, mais coûteux avec beaucoup d'emplois | à surveiller |
| — | `ordre Int @unique` sur `Pays`, `LienParente` et `TypeSaisieSurSalaire` : plus strict que sur les trois référentiels d'emploi | à aligner |
| — | **`navigation-en-tete.tsx` réapparaît modifié à chaque `pnpm format`** | à régler |
| — | Le refus des champs d'historisation n'est garanti que pour les saisies | à aligner |
| — | **En base, `NOT NULL` n'interdit pas la chaîne vide** sur nom, prénom, date d'entrée | **module d'import** |
| — | **Un filet dans le client HTTP interprète l'ancienne forme de refus en tableau.** Son seul appelant est un test | à surveiller |
| — | **La coquille racine n'est pas couverte par la règle de lint de navigation** | prochain passage |
| — | **La fiche société et la création de société portent une saisie perdable et AUCUN garde** | **reprise du module 1** |
| — | **Écart de câblage du bloc Identité** (`onServeurChange` inerte) | à surveiller |
| — | **Les tests d'intégration partagent la base du serveur de développement.** Toute saisie manuelle fait échouer `pnpm verify`. Remède : `pnpm db:reset` PUIS `pnpm db:seed` | hors module 2 |
| — | **`pnpm verify` échoue sous contention** si un serveur de dev tourne | à surveiller |
| — | **Quotité saisissable (article 387)** | module 4 |
| — | **Le salarié « complet » du seed a maintenant deux emplois** — des tests s'appuient sur lui | à surveiller |
| — | Suppression d'un compte bancaire désigné par un emploi : rien ne l'empêche | **prompt séparé, après le temps 6** |
| — | `couleur` sur `Banque` ; pas de champ `ordre` sur `Banque` ; codes des 21 banques tous vides | référentiels |
| — | Personne à charge inactive encore comptée ; ligne inactive non vérifiable à l'œil | module 4 |
| — | Page d'accueil du back-office : à retirer avant production | production |
| — | Liste d'exemption du module 1 : 35 routes. **Ne jamais l'allonger.** | reprise module 1 |
| — | **Compilation de l'API absente de `pnpm verify`** | à discuter |
| — | `BulletinPort` et `ReferentielNationalPort` provisoires | modules 2, 4 et 5 |
| — | Premier mois de gestion : point d'ancrage du chaînage | module 2 |
| — | **Articles de base de connaissance non relus** | relecture porteur |
| — | Captures d'écran des articles (Playwright non installé) | fin 2.1.c |
| — | 26 requêtes SQL par lecture d'une fiche | à mesurer |
| Z14 | Retouches fiche société v7 + AuditLog sans `accountId`/`companyId` + champ Banque + champs mois + garde de navigation | prochain passage module 1 |
| Z6 | Faire confirmer par la CNSS et la DGI la consolidation en une ligne par salarié | vérification métier |
| — | **Vérifications OMPIC et noms de domaine pour la marque VECTA** | **en attente** |

---

## 16. Environnement

- **GitHub** : `https://github.com/omarrizqi-sys/paymarh.git`, branche `main`. **Le dépôt garde son nom PaymaRH.**
- **Cursor ne peut pas lire un `.xlsx`** — toujours fournir la version Markdown.
- **`pnpm verify`** = `lint && format:check && typecheck && test && check:circular && back-office build`. **Seule commande de validation, lancée par le porteur.**
- **`pnpm format`** avant de rendre un `verify`.
- **ARRÊTER LES SERVEURS DE DÉVELOPPEMENT avant `pnpm verify`.**
- `madge` rapporte constamment **2 avertissements** — deux imports CSS. Bénins.
- **Lancer les commandes une par une**, jamais en parallèle.
- **Voir le rendu en local — trois commandes**, que Claude fournit systématiquement :
  1. `pnpm db:up`
  2. `pnpm --filter api dev`
  3. `pnpm --filter back-office dev`
  puis `http://localhost:3000`.
- **Après une migration ou un changement de seed** : `pnpm db:reset` (confirmation `y`, que Cursor ne peut pas fournir) puis `pnpm db:seed`. **`db:reset` ne rejoue pas le seed.**
- **`pnpm db:reset` change l'identifiant utilisateur de développement.** Reporter `NEXT_PUBLIC_PAYMARH_USER_ID` dans `apps/back-office/.env`, puis **arrêter et relancer** le back-office.
- **`pnpm db:seed` échoue sans `prisma generate`** après modification du schéma.
- **Le seed crée quatre dossiers de démonstration** dans DEMO-001 : **Youssef Bennani** (complet — **deux emplois dont un terminé**, deux personnes à charge, deux comptes bancaires, un prêt, deux saisies, lignes dans les trois tableaux d'emploi, un statut propagé, champs héritables vides), **Said Tazi** (minimal, sans emploi), **Amina El Fassi** (sortie, nationalité étrangère).
- **Le paramétrage de l'établissement `siege` porte trois mois d'effet** : 2022-01, 2025-01, 2025-07. **Le premier existe pour que l'héritage soit observable** sur Youssef Bennani (mois en cours 2022-03). **Ne pas le supprimer.**
- **Quand un écran refuse de s'afficher**, la vraie erreur est dans le **terminal du back-office**.
- **Environnement PowerShell** : `curl.exe`, `Remove-Item -Recurse -Force`, chemins avec crochets entre guillemets, `git --no-pager diff`.
- **Commit manuel** : `git checkout -- apps/back-office/next-env.d.ts` (et `navigation-en-tete.tsx` si besoin) → `git add -A <chemins>` → **`git status --short`** → `git commit` → `git push`.
- **Claude annonce le nombre de lignes attendu** avant chaque `git status --short`. *Attention : un dossier neuf compte pour autant de lignes qu'il contient de fichiers.*

---

## 17. Rappels de méthode

- Claude **cadre et décide avec le porteur d'abord**, puis fournit **un prompt Cursor complet**, **dans un bloc de code d'un seul tenant, sans clôture imbriquée**.
- Le prompt Cursor doit toujours : donner le contexte, **lister les fichiers à lire avant d'écrire**, rappeler le socle à réutiliser, délimiter le périmètre strict (à faire / à NE PAS faire), poser des **critères d'acceptation vérifiables par un non-codeur**, exiger la **liste nominale des tests avec fichier et numéro de ligne**, exiger **« Décisions prises seul »**, **« Ce que je n'ai pas pu tester honnêtement »**, **« Ce qui m'a surpris »**, la **sortie brute de `pnpm verify` sans ellipse ni redirection**, une **preuve d'échec** pour tout test de non-régression, et demander à Cursor de **s'arrêter et poser la question** si un choix n'est pas couvert.
- **Ouvrir le prompt par un point d'arrêt** dès qu'une décision dépend d'un fait du dépôt, ou par un **rappel de faits à contredire**.
- **Quand la cause d'un défaut est inconnue, découper en deux prompts : diagnostic, puis correction.**
- **Après chaque prompt livré : vérification visuelle à l'écran**, avec une liste de points numérotés fournie par Claude, **et les trois commandes de lancement**. **Les points qui portent la raison d'être du temps doivent être signalés comme tels.**
- **Vérifier systématiquement les rapports de Cursor** : arithmétique, tests annoncés contre tests exigés, chemin réellement emprunté par une preuve d'échec, contrôles déclenchables, mécanismes sans appelant, fichiers hors périmètre, sortie brute contre résumé.
- **Claude signale au porteur quand ouvrir une nouvelle conversation** est optimal, et fournit ce document mis à jour à ce moment-là.
- **Claude indique le modèle et l'effort à paramétrer à la fin de CHAQUE message, sans exception** (§2.1).
