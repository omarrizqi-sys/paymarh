# VECTA — Document de contexte (reprise de conversation)

> **Comment m'en servir :** téléverse ce fichier au début d'une nouvelle conversation avec Claude, avec le message d'ouverture fourni à part.
>
> **Version :** remplace intégralement la v12. Dernière mise à jour : **fin du cadrage TAHFIZ** (sous-étape 2.1.c-3). **818 tests, 110 fichiers, `pnpm verify` vert, arbre propre, tout est poussé** (dernier commit `60b7acc`).
>
> ⚠️ **PROCHAINE ÉTAPE : LE TEMPS 6** — création et suppression d'un emploi, garde de droits sur Contrat et Affectation. Voir **§18**.

---

## 0. Le nom — à lire avant tout le reste

**Le produit s'appelle VECTA.** La marque Adrim, envisagée un temps, est abandonnée.

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
> Pièges déjà rencontrés : le barème kilométrique marocain est celui de la CNSS, distinct de celui de la DGI ; les conventions collectives n'ont pas la même portée.
>
> **Cas du temps 2.c** : la quotité saisissable de l'**article 387 du code du travail** — apportée par le porteur, Claude ne la connaissait pas.
>
> **Cas du temps 3 (2.1.c-2)** : les champs jamais vides et la date de naissance **facultative** — tranchés par le porteur contre l'API.
>
> **Cas de la 2.1.c-3** : les **primes contractuelles ne sont pas historisées**. Claude a reposé la question jusqu'à obtenir la règle.
>
> **Cas du temps 5 (P0)** : la réponse « chevauchement de statuts autorisé » contredisait un contrôle testé. Reposée ; **le refus reste**.
>
> **Cas du cadrage TAHFIZ — le contrat d'insertion.** L'annexe des référentiels affirmait « il n'existe ni contrat d'apprentissage **ni contrat d'insertion** au Maroc ». Le porteur a établi le contraire : **IDMAJ (ANAPEC) s'applique aux contrats d'insertion**. L'annexe est corrigée, un type de contrat `INSERTION` est ajouté (ADR 0033). *Une affirmation de document, même ancienne, peut être fausse : la relire au porteur quand elle heurte une de ses réponses.*
>
> **`INT_CDI` et `OBJ`** restent dans le référentiel des types de contrat (décision du porteur), bien que classés ailleurs comme notions françaises. **TAHFIZ ne s'applique pas à `INT_CDI`.**
>
> **Avertissement du porteur, à retenir : ne pas confondre un statut SOCIÉTÉ (TAHFIZ, exonération portée par l'employeur) et un statut SALARIÉ (IDMAJ, saisi salarié par salarié).**

---

## 2. Profil du porteur et méthode

- Le porteur est **expert paie**, sans background technique. Il ne code pas.
- **Claude sert à réfléchir, cadrer et décider. Cursor sert à développer.**
- Ordre invariable : **on cadre ensemble d'abord** (Claude pose des questions numérotées, le porteur tranche), **puis** Claude rédige le prompt Cursor.
- Le porteur répond **par numéro**. Numéroter les questions et les regrouper par thème.
- **Écrire pour un non-développeur.** Une question de cadrage part d'une situation concrète à l'écran : **« voilà ce que l'utilisateur fait, voilà ce qui se passe »**.
- Sorties **complètes et prêtes à copier-coller**. **Les prompts Cursor sont livrés dans un bloc de code d'un seul tenant**, sans commentaire de Claude à l'intérieur.
- **JAMAIS de clôture de bloc de code à l'intérieur d'un prompt Cursor.** Chemins et extraits de code en texte indenté ou en ligne.
- Claude accompagne chaque question d'une **recommandation motivée**, pour que le porteur puisse valider par « ok ».
- **Quand Claude n'a pas la connaissance métier, il le dit et ne recommande rien.** Si le porteur demande malgré tout une recommandation, Claude la donne **en séparant ce qui relève de l'ergonomie ou de la conception (qu'il peut juger) et ce qui relève de la paie (qu'il ne peut pas juger)**.
- **Quand une réponse du porteur contredit un fait du dépôt, un document OU une décision déjà prise, Claude la lui relit et la repose**, en listant les conséquences.
- **Une réponse du porteur ouvre souvent une question nouvelle.** *(Cadrage TAHFIZ : « nouvel emploi » pour un IDMAJ embauché en CDI a ouvert la question 9 — un contrat d'insertion peut-il changer de type ? ; les règles 10 et 11 ont ouvert la question 13 — propagation sur les emplois terminés.)* Toujours chercher la conséquence avant de rédiger.
- **Vérifier que toutes les questions ont été tranchées** avant de rédiger le prompt.
- Il conteste et corrige quand c'est nécessaire — **c'est un signal fiable**.
- À chaque module validé, produire **un article de base de connaissance**, rédigé par Cursor.
- **Quand le porteur demande une vérification à l'œil, Claude fournit systématiquement les trois commandes de lancement** et **la liste numérotée des points**. **Si le porteur redemande la liste, la redonner complète.**
- **Claude ne donne jamais du contenu de fichier là où une commande est attendue.**
- **Claude ne fait jamais d'affirmation sur ce qu'il a lui-même produit sans vérifier.**
- **Claude n'écrit jamais un marqueur de substitution dans une commande à coller sans le dire.**
- **Un scénario de vérification à l'œil doit être vérifié contre les règles avant d'être donné** : mois en cours du salarié (une ligne peut être clôturée dès l'enregistrement), chevauchements avec des lignes **masquées**, ordre des contrôles serveur. *(Cadrage TAHFIZ : les dates IDMAJ de Karim ont été choisies pour ne pas chevaucher sa ligne TAHFIZ invisible, de sorte que le seul refus possible soit le bon. Pour Youssef, aucune ligne de statut n'est clôturée au mois 2022-03 : il a fallu en créer une datée 2020.)*

### 2.1 Modèle et effort — règle absolue

**Claude indique à la fin de CHAQUE message quel modèle (Sonnet ou Opus) et quel effort de réflexion (faible, moyen, élevé) paramétrer pour le message suivant.** Sans exception. Une ligne isolée en fin de message. **L'effort annoncé est celui du message SUIVANT.**

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

- **Une seule instruction git par message.** `git add` + `git status --short` forment une seule instruction ; le commit vient au message suivant, une fois la sortie relue.
- **Ne jamais donner une procédure amputée sans le dire.**
- **`pnpm verify` est le seul critère d'acceptation technique. C'est le PORTEUR qui le lance**, serveurs arrêtés, et colle la fin de la sortie (à partir de « Test Files »). **Le prompt Cursor dit explicitement « Ne lance pas pnpm verify ».**
- **Séquence avant `pnpm verify`** : serveurs arrêtés → `pnpm db:reset` (`y`) → `pnpm db:seed` → reporter l'identifiant dans `apps/back-office/.env` → `pnpm format` → `pnpm verify`.
- **`pnpm verify` échoue sous contention.** **Un échec par délai dépassé se relance une fois avant toute analyse.** *(Cadrage TAHFIZ : cinq échecs back-office par délai au premier passage, un au deuxième, zéro au troisième.)*
- **Des échecs d'intégration sur les banques de test** (`prisma.banque.deleteMany` en violation de clé étrangère, X3 qui trouve une banque inattendue) **signalent une base polluée**, pas un défaut. Remède : `db:reset` puis `db:seed`.
- **`format:check` qui échoue sur des fichiers non touchés** : lancer `pnpm format`, puis `git --no-pager diff --stat -- <fichiers>`. **Diff vide = seules les fins de ligne différaient** (CRLF sur le disque) ; aucun commit à faire, les fichiers disparaissent du statut au prochain `git add`.
- **Exiger la SORTIE BRUTE**, jamais un résumé ni une redirection dans un fichier. **Écrire dans le prompt : « c'est moi qui juge ce qui est attendu dans cette sortie ».**
- ⚠️ **Une sortie « brute » recopiée à la main par Cursor peut être fausse.** *(Prompt B : une ligne citée `getByTestId(...).toBeNull()`, impossible, était en réalité `queryByTestId` dans le fichier.)* **Quand une ligne de sortie paraît impossible, faire montrer le code du fichier lui-même.**
- **Toujours vérifier le rapport de Cursor contre le prompt.**
- **Vérifier l'arithmétique des tests à chaque livraison**, y compris le décompte des MODIFIÉS. *(Cadrage TAHFIZ : « 13 cas modifiés » pour une liste de 14 — c'était le total qui était faux.)* Un test déplacé n'est ni un ajout ni un retrait ; un test renommé n'est pas un ajout ; un test découpé en deux est **un** ajout. **Distinguer les modifications de harnais des modifications d'un cas de test.**
- **Les totaux 811 / 818 sont ceux du `pnpm test` complet** (API unitaire + API intégration + back-office), pas du seul back-office.
- **Exiger fichier ET numéro de ligne pour chaque test de la liste nominale.**
- **Exiger la section « Décisions prises seul ».**
- **Un test qui passe sans exercer le défaut qu'il prétend couvrir est un échec.** Exiger une **preuve d'échec**, et **vérifier sur quel chemin elle porte**.
  - **Une preuve d'échec « reconstruite » n'est pas une preuve.**
  - **Une preuve impossible est un fait à relever.**
  - **Une preuve qui échoue par PLANTAGE ne prouve pas l'ASSERTION.**
  - **Une preuve qui PASSE malgré la casse révèle un test qui ne protège rien.**
  - **Une preuve « non produite faute de temps » n'est pas acceptable** ; la redemander.
  - ⚠️ **Un test qui vérifie deux chemins (POST puis PATCH, « vers » puis « depuis ») : la preuve qui échoue sur le premier ne prouve JAMAIS le second.** *(T8 et T9 du cadrage TAHFIZ : découpés en T8a/T8b et T9a/T9b, chaque moitié avec sa preuve, en neutralisant un seul chemin à la fois.)*
- **UN HARNAIS DE TEST DOIT REPRODUIRE LA FORME RÉELLE DE L'API — Y COMPRIS LES RÈGLES MÉTIER.** *(Seizième défaut, temps 5 : droits posés au mauvais niveau. Cadrage TAHFIZ : onze tests posaient IDMAJ sur un emploi CDI, ce que la règle interdit ; le contrôle M7 les a tous fait tomber. Les fixtures d'écran posaient TAHFIZ et IDMAJ sur le même emploi ; réalignées.)*
- **Se méfier des contrôles qui ne se déclenchent jamais**, et des **mécanismes sans appelant**.
- **Un contrôle de droit se place au plus près de la donnée, jamais sur une route.**
- **Se méfier d'un contrôle qui reconnaît des NOMS DE CLÉS plutôt que de suivre la donnée** (§6.2).
- **Ne jamais relâcher une contrainte de production pour faire passer un test.** Réécrire le test sur des données conformes.
- **Demander systématiquement pourquoi un fichier hors périmètre a été modifié.** *(Prompt B : Cursor a modifié le document de contexte. Interdit — ce document est celui de Claude. Le prompt doit l'interdire explicitement.)*
- **Vérifier ce qui est indexé avant de commiter.** `git status --short` avant `git commit`.
- **Exiger la cause avant la correction.** Découper diagnostic et correction en deux prompts quand la cause est inconnue.
- **Quand Cursor corrige le prompt de Claude, il a souvent raison.**
- **Quand Cursor s'arrête alors que le prompt l'exigeait, c'est le comportement attendu. Quand il pose une question en cours de route** (outil de questions), Claude répond par lettre, avec la raison.
- **Une correction acceptée peut n'être qu'un masque.** Inscrire le point ouvert explicitement.
- Découper chaque sous-étape en **temps successifs, avec arrêt entre chacun**. **Séparer un prompt d'API/seed d'un prompt d'écran** (cadrage TAHFIZ : prompt A puis prompt B).
- **Fil Cursor neuf par prompt.** Les correctifs et compléments restent dans le fil du prompt concerné.
- **Modèles Cursor** : Composer pour le développement courant ; le modèle le plus fort pour l'architecture, les migrations, les types partagés, la sécurité **et tout composant partagé par plusieurs écrans** (l'enveloppe des tableaux).
- **Séparer les commits de nature différente.**
- **La vérification visuelle est une étape à part entière. SEIZE défauts réels trouvés à l'œil à ce jour, tous avec une suite de tests verte.** *(Aucun nouveau défaut au cadrage TAHFIZ.)*
- **Après une correction trouvée à l'œil, refaire TOUTE la vérification à l'œil.**
- **La vérification à l'œil peut révéler un trou de CADRAGE**, pas seulement un défaut de code.
- **Message de mise à jour de Prisma** (« Update available 7.10.0 -> 8.0.0-rc… ») après `db:reset` ou `db:seed` : **à ignorer**. Stack figée, version de test, et les commandes proposées utilisent `npm`.

### 2.3 Le point d'arrêt préalable

Quand un prompt dépend de faits que Claude ne peut pas vérifier, **le prompt commence par une section « point d'arrêt »** : Cursor relève les faits, avec fichiers et numéros de ligne, **puis s'arrête sans écrire de code**.

Règles :
- **N'écris pas de code, ne crée pas de fichier** doit être écrit explicitement.
- Exiger **fichier et numéro de ligne**, et une **preuve par le code** pour tout fait comportemental.
- Accepter **« NON PROUVÉ »**. Interdire « probablement », « il semble », « en principe », « sans doute », « a priori ».
- **Demander que `git status --short` soit inchangé à la fin.**
- **Un relevé peut se contredire lui-même, ou affirmer un fait sans en montrer le maillon décisif.** *(Cadrage TAHFIZ : Cursor a affirmé que les états des lignes étaient calculés au mois de la SOCIÉTÉ, en citant la fonction mais pas le mois qui lui était passé. Le complément C1, chaîne d'appel complète exigée, a prouvé le contraire : c'est le mois du SALARIÉ. Confronter le relevé aux constats faits à l'écran.)*
- Un relevé peut être complété dans le même fil (« Complément au relevé », mêmes règles).

### 2.4 Reprendre des faits d'un point d'arrêt précédent

Rappeler les faits en tête de prompt : *« N faits que j'affirme. Si l'un est faux, arrête-toi et dis-le. »*

**Un fait affirmé de mémoire est plus fragile qu'un fait relevé.** Au cadrage TAHFIZ, les prompts A et B ne reprenaient que des faits relevés : tous confirmés (les numéros de ligne glissent légèrement, c'est sans gravité).

---

## 3. Stack technique (FIGÉ)

100 % TypeScript, gratuit et open source.

| Couche | Choix |
|---|---|
| Langage | TypeScript 6.0.3, mode strict — ne pas changer la version |
| Runtime | Node.js LTS |
| Paquets | pnpm, monorepo, workspaces |
| Base de données | PostgreSQL 18, Docker en local |
| ORM | Prisma 7.10 — **ne pas monter en version 8** |
| Backend | NestJS 12, API REST, ESM |
| Frontend | Next.js 16.3.3 + React + TypeScript, Turbopack |
| UI | Tailwind CSS + shadcn/ui |
| Tableaux | TanStack Table v8 — **module 1 seulement** |
| Calcul monétaire | decimal.js + type Decimal Prisma — **jamais de flottant** |
| Auth | Auth.js, **pas encore installé** |
| Stockage fichiers | abstraction type S3, interface seulement |
| Outillage | ESLint, Prettier, Vitest 4.1, madge |
| Mobile (plus tard) | React Native / Expo |

**Aucune dépendance d'accordéon.** **`@testing-library/jest-dom` n'est pas installé** — `toHaveClass` indisponible. Les vérifications d'absence s'écrivent `queryBy…(…)` + `toBeNull()` ; `getBy…` lève une erreur si l'élément manque.

### 3.1 Conventions d'import

- **API** : extension `.js` **obligatoire** sur les imports relatifs (ESM Nest).
- **Back-office** : extension `.js` **interdite** — Turbopack ne la résout pas. Règle ESLint `no-restricted-imports`.

### 3.2 `no-restricted-imports` — deux blocs distincts

1. interdiction de `.js` dans le back-office ; 2. interdiction des outils de navigation Next hors du module de navigation gardée. **Aucun plugin ESLint sur mesure.**

### 3.3 Prettier

`docs/PaymaRH-Contexte-Reprise-*.md` est dans `.prettierignore`.

> **`apps/back-office/next-env.d.ts` réapparaît modifié** après un passage du back-office en mode développement : le remettre en état avant chaque commit (`git checkout -- apps/back-office/next-env.d.ts`).
>
> **Fins de ligne** : des fichiers peuvent apparaître modifiés sans différence de contenu (CRLF sur le disque). Voir §2.2.

---

## 4. Principes d'architecture (GRAVÉS)

1. **API d'abord** — aucun calcul de paie dans le front, jamais.
2. **Moteur de paie pur et isolé** — `payroll-engine/`, fonction pure. **Toujours vide.**
3. **Double isolation multi-tenant** — `Account → Company → Salarié`.
4. **Super-admin séparé** — `PLATFORM_ADMIN`, `accountId` nul, chemin `/admin/` tracé.
5. **Décimal exact** — `parseFloat`, `Number.parseFloat`, `Math.round` interdits par ESLint, **front compris**.
6. **Livrables = monde à part** — les PDF vont au stockage d'objets.
7. **Étanchéité de l'information** — doublon → « Cette valeur n'est pas disponible. » ; ressource d'un autre compte → **404, jamais 403**.
   - **Corollaire écran** : une action ou une rubrique interdite est **absente du DOM**. Le grisé reste légitime pour un état sans rapport avec les droits.
   - **Corollaire données** : `operations` est une **liste de ce que l'utilisateur peut faire**.
   - **Corollaire API** : une clé masquée est **absente**, jamais `null`. Type partagé : **optionnelle**, jamais nullable. **L'optionalité n'a qu'UNE signification** (ADR 0027).
   - **Corollaire sécurité** : masquer à l'écran ne protège rien tant que la route d'écriture reste ouverte.
   - **Corollaire refus** : une violation de contrainte de base ne remonte jamais telle quelle.
8. **Tout calcul et tout contrôle côté serveur** — deux exceptions documentées (ADR 0009).
9. **Aucune chaîne destinée à l'affichage ne sort de l'API.**
   - **Exception 1** : accord en genre des situations familiales.
   - **Exception 2** : le `message` de l'aperçu d'impact avant suppression.
   - **Exception 3 (de fait)** : le `message` d'un refus métier (forme unique `{ code, message, champ }`, ADR 0029), affiché tel quel par l'écran.
   - **Un libellé de référentiel est de la DONNÉE.** Il sort de l'API.
   - **Un message composé par l'écran est défini une seule fois.**
10. **Le français affiché porte ses accents et ses apostrophes typographiques** (’). `francais-affiche.spec.ts` refuse l'élision ASCII, **pas les accents manquants**.
11. **Un message d'interface est défini une seule fois.**
12. **Un comportement s'injecte, il ne se déduit jamais de la forme des données.** *(Appliqué au prompt B : les lignes clôturées modifiables passent par une propriété injectée dans l'enveloppe, jamais par le nom du tableau.)*
13. **Toute navigation depuis un écran à saisie passe par le module de navigation gardée** (ADR 0031).
14. **Un calcul utilisé par le service ET par le seed est écrit UNE SEULE FOIS, dans une fonction pure** (ADR 0033 : `calculerLignesTahfiz`). Le seed n'écrit jamais à la main une donnée qu'un service calcule.

---

## 5. Décisions transverses figées

- **Langue du code mixte** : technique en anglais, termes métier réglementaires en français (ADR 0005).
- **Mois de paie et mois d'effet** : `String` `AAAA-MM`, jamais `DateTime` (ADR 0006).
- **Identifiants légaux** en `String`.
- **Aucune valeur de remplacement.** Un champ vide vaut mieux qu'une donnée fausse ; **jamais un tiret**.
- **Vocabulaire des états** : `ACTIVE` / `PAS_ENCORE_EFFECTIVE` / `CLOTUREE` (ADR 0026).
- **Une ligne `PAS_ENCORE_EFFECTIVE` ne porte AUCUNE mention à l'écran**, dans aucun tableau.
- **L'ordre d'un référentiel est porté par la DONNÉE** (champ `ordre`), sans unicité sur les cinq référentiels récents.
- **Un référentiel simple se réfère par son CODE.**
- **L'ordre des rubriques d'un écran est porté par une DÉCLARATION STABLE** (§11.17).
- **Suppressions de lignes** : aperçu d'impact, puis `DELETE` avec jeton ; `CONFIRMATION_OBSOLETE` (409) ou `CONFIRMATION_REQUISE` (400). **Exception : les primes contractuelles** (§11.8).
- **Suppression d'une fiche salarié ou d'un emploi** : aperçu **sans `mode`**, jeton jamais obsolète.
- **Le jeton de confirmation ne porte que des FAITS.**
- **Dossiers et fichiers techniques** : minuscules, tirets, sans accent.
- **Base de connaissance** : `/base-de-connaissance`, un article Markdown par sujet, rédigé par Cursor.
- **Deux enveloppes de réponse** : module 1 `{ data, warnings }`, module 2 `{ donnees, alertes }` (ADR 0021). Les référentiels utilisent celle du module 1.
- **UNE SEULE FORME DE REFUS SORT DE L'API** (ADR 0029).
- **Trois champs jamais vides** : `nom`, `prenom`, `dateEntree` (ADR 0030).
- **Les primes contractuelles ne sont PAS historisées.** Décision métier, ne pas la rediscuter.
- **Un montant affiché passe par `afficherMontant`** (case vide sur valeur vide), distincte d'`afficherNombreDecimal`.
- **Le doublon est AUTORISÉ** sur les primes contractuelles et les avantages en nature. Aucun avertissement à l'écran.
- **Le chevauchement entre deux lignes de statut est REFUSÉ, QUEL QUE SOIT LEUR CODE.** `assertPasChevauchementStatuts` compare toutes les lignes de l'emploi, **lignes propagées comprises**.
- **Les dates s'affichent JJ/MM/AAAA, obtenues en REFORMATANT LE TEXTE reçu de l'API** (`AAAA-MM-JJ`), **jamais par conversion en objet `Date`**.
- **Les lignes de statut PROPAGÉES (TAHFIZ) N'APPARAISSENT PAS sur la fiche salarié.** Elles restent en base et l'API les rend : la paie en a besoin. **Le filtre porte sur le champ `origine`, jamais sur le code.** L'information TAHFIZ n'est visible que sur la fiche société.
- **Les lignes de statut CLÔTURÉES sont corrigeables et supprimables depuis l'écran** — **IMPLÉMENTÉ** (commit `60b7acc`). Elles restent grisées avec « inactive depuis MM/AAAA ». Raison : leurs dates sont saisies par l'utilisateur ; une erreur de frappe ne doit pas devenir définitive. **Seul ce tableau** : les six autres gardent leurs lignes clôturées en lecture seule. **Limite à trancher au module bulletins** : modifier ou supprimer un statut déjà utilisé par un bulletin validé — bloqué ou signalé ? (le serveur ne refuse aujourd'hui aucun PATCH/DELETE lié à l'état de la ligne).

### 5.1 TAHFIZ et IDMAJ — règles tranchées au cadrage TAHFIZ (ADR 0033)

| # | Règle |
|---|---|
| D1 | **TAHFIZ ne vise que les périodes où le type de contrat est exactement `CDI`.** Ni `INT_CDI`, ni aucun autre code. |
| D2 | **IDMAJ ne peut être saisi que sur un emploi en type `INSERTION`** (« Contrat d’insertion »). Refus `STATUT_RESERVE_CONTRAT_INSERTION`. |
| D3 | **L'exclusion IDMAJ / TAHFIZ s'entend PAR EMPLOI.** Un salarié peut avoir un emploi en contrat d'insertion sous IDMAJ et un autre emploi en CDI sous TAHFIZ. *(Nuance la formule initiale « un même salarié ne porte jamais les deux ».)* |
| D4 | **Un jeune en IDMAJ embauché en CDI = un NOUVEL emploi**, pas un changement de type. |
| Q9 | **Le type `INSERTION` est immuable** : tout changement de type **vers ou depuis** `INSERTION` sur un emploi existant est refusé (`CHANGEMENT_TYPE_CONTRAT_INSERTION`), qu'il écrase la version ou en crée une. La **création** d'un emploi directement en `INSERTION` est permise. *Coût accepté : une erreur de saisie du type oblige à supprimer puis recréer l'emploi.* |
| D5 / 11 | **Date de début** d'une ligne TAHFIZ = la plus tardive de : 1er jour du mois d'activation TAHFIZ ; date de début de l'emploi ; 1er jour du mois d'effet de la version où le type devient CDI. |
| D5 / 10 | **Date de fin** = la plus précoce de : dernier jour du mois de fin de TAHFIZ ; **date de sortie de l'emploi** ; veille du 1er jour du mois où le type cesse d'être CDI. Sans aucune de ces bornes : ligne sans fin. |
| 13 | **La propagation s'évalue sur TOUS les emplois de la société, ouverts ou terminés.** Une ligne n'existe que si une période CDI croise la période TAHFIZ. Un emploi terminé avant l'activation n'est jamais touché ; un emploi terminé pendant la période a une ligne close à sa sortie. |
| — | Plusieurs périodes CDI sur un même emploi (CDI → CDD → CDI) donnent **plusieurs lignes**. |
| D6 | **Conditions d'éligibilité de TAHFIZ** (plafond de salaire, effectif, durée) : **hors périmètre**, au module de paie. |
| D7 | Lignes propagées à tort : **retirées** (rien en production). |

---

## 6. Gestion des droits

Modèle à trois niveaux : `famille de droits` → `socle de l'utilisateur (compte)` → `droits par société`. Permissions nommées par opération. **Les droits varient d'une société à l'autre.** **Le socle n'est pas un plafond.** **Aucun effet rétroactif.** **Administrateur principal unique** par compte. **La rémunération forme un bloc à droits propres.**

### 6.1 Ce que la lecture expose — et OÙ l'écran doit le lire

`GET /salaries/:id` rend `operations` **à la racine de la fiche** et **sur chaque emploi**. Jamais par rubrique ni par ligne.

| Niveau | Contenu (`operations-ressource.ts`) |
|---|---|
| **Racine** (`operationsSalarie`) | `salarie.lire`, `salarie.modifier`, `salarie.supprimer`, `emploi.creer`, `salarie.remuneration.lire`, `salarie.remuneration.ecrire` |
| **Chaque emploi** (`operationsEmploi`) | `emploi.modifier`, `emploi.supprimer`, `salarie.remuneration.lire`, `salarie.remuneration.ecrire` |

> ⚠️ **`emploi.modifier` n'existe QU'AU NIVEAU DE L'EMPLOI.** `bloc-emplois.tsx` passe à chaque accordéon **`emploi.operations ?? []`** — **liste vide** si absente, **jamais un repli sur la fiche** (droits de la fiche ignorés : `operations: _operationsFiche`). Aide de harnais partagée : `src/test/operations-harnais-fiche-emploi.ts` (`avecOperationsEmploi`, `OPERATIONS_EMPLOI_COMPLET`).

**`GET /salaries` (la liste) rend `operations` au niveau de la COLLECTION**, avec `salarie.creer`.

Sans `salarie.remuneration.lire`, sont **absentes** : `comptesBancaires`, et sur chaque emploi `remuneration`, `paiement`, `primesContractuelles`, `avantagesEnNature`, plus les deux résolutions de télétravail. **`statutsParticuliers` n'est JAMAIS masqué.**

> **`operations` n'est posé que sur `GET /salaries/:id`. C'est définitif.**

> ⚠️ **Contrat et Affectation n'ont AUCUNE garde de droit à l'écran** : ils sont toujours modifiables, même sans `emploi.modifier`. Le serveur refuse l'écriture, mais l'écran ne le montre pas. **À traiter au temps 6.**

### 6.2 Le contrôle d'écriture sur la rémunération — QUATRE occurrences du même défaut

**Le mécanisme d'interception reconnaît des NOMS DE CLÉS dans le corps de la requête.**

| Occurrence | Chemin | Correction |
|---|---|---|
| **2.1.b** | `PUT /salaries/:id/comptes-bancaires` (clé `comptes`) | ADR 0024 |
| **2.1.c-3** | `PATCH /emplois/:id/remuneration` (corps plat) | ADR 0032 |
| **2.1.c-3** | écritures des avantages en nature (`montant`) | ADR 0032 |
| **Temps 5** | écritures des primes contractuelles (aucun contrôle) | ADR 0032, note datée |

**Pourquoi le registre n'est JAMAIS étendu** : il protège une **forme de corps HTTP**, pas une **donnée**. **Le contrôle est unique** : `assertEcritureRemunerationSalarie`, appelé depuis **neuf** méthodes.

---

## 7. Héritage et historisation

### Héritage — modèle Silae

**Case vide = valeur héritée. Case remplie = valeur propre.** Résolution **`SAL > ETB > SOC > NAT`**. Un champ héritable est **toujours nullable** ; `null` = hérité. La valeur résolue s'affiche **sous le champ, avec son origine**. **Vider un champ héritable envoie `null` explicite.** Exception : jours fériés travaillés, booléen `suivreJoursFeriesEtablissement`. **Le moteur de paie ne lit jamais la fiche société.**

**Champs héritables** (liste close) : durée contractuelle, repos hebdomadaire, télétravail autorisé, indemnité de télétravail, montant de l'indemnité, grille horaire, jours fériés travaillés.

> **PIÈGE MAJEUR.** **L'héritage est résolu AU MOIS EN COURS DU SALARIÉ** — souvent très ancien sans bulletin. **Le seed pose un paramétrage d'établissement à 2022-01 pour que l'héritage soit observable. NE PAS LE SUPPRIMER.**

**Les résolutions de télétravail sont masquées sans `salarie.remuneration.lire`** : clé supprimée, jamais `null`.

### Historisation — deux mécanismes

**Critère :** *le moteur a-t-il besoin de cette valeur telle qu'elle était pour recalculer un bulletin passé ?*

| Bloc | Porté par | Mécanisme |
|---|---|---|
| `CONTRAT`, `REMUNERATION` (paiement inclus), `AFFECTATION_TEMPS_DE_TRAVAIL` | Emploi | table de versions datées |
| `PERSONNES_A_CHARGE`, `RETENUES` (prêts, saisies) | Salarié | lignes à validité temporelle |
| `AVANTAGES_EN_NATURE` | Emploi | `moisEffetDebut` / `moisEffetFin` |
| `STATUTS_PARTICULIERS` | Emploi | `dateDebut` / `dateFin` **saisies par l'utilisateur** |

> **Comptes bancaires et primes contractuelles : NON historisés.**

- **Le client n'écrit JAMAIS une version ni une date d'effet** (`CHAMP_INTERDIT` + `forbidNonWhitelisted`).
- **À la création d'un avantage, le serveur impose `moisEffetDebut` = mois en cours.**
- **On écrase sans créer de version** tant qu'aucun bulletin n'existe pour le mois concerné (`HistorisationEmploiService.deciderEcritureContrat`, `bulletinExistePourMois`). **Conséquence pour TAHFIZ** : sans bulletin, un changement de type écrase la version courante, et le « mois du changement » devient le début de cette version.
- **Modifier un historique n'est jamais bloqué côté API.**
- **Deux lectures d'une même ligne, volontairement divergentes au mois de clôture.** Ne jamais les aligner (ADR 0011).
- **Lire le contrat à un mois donné** : `resoudreLigneHistorique(emploi.contratVersions, mois)` (`contratAuMois`). Les dates de début et de sortie d'un emploi sont lues sur la version de plus grand mois d'effet.

---

## 8. Le mois en cours et les états du bulletin

Le mois en cours est **déduit**, au niveau **salarié**. **Cinq états** (trois stockés) : 0 non calculable · 1 calculable · 2 calculé · 3 validé · 4 édité.

**Cascade** (`MoisEnCoursService.calculerPourSalarie`) : (1) mois le plus récent avec un bulletin à l'état 2 ou 3 ; (2) sinon, si tous à l'état 4, le mois suivant le plus récent ; (3) sinon le mois de début de l'**emploi actif le plus ancien**, ou le **mois calendaire** (`Africa/Casablanca`).

> **`Company.moisEnCours` (2025-07 dans le seed) ne pilote PAS la résolution de la fiche salarié.** Chaîne prouvée (relevé C1) : `SalariesService.lire` → `calculerPourSalarie` → `listerEmploisPourFicheSalarie` → `versEmploiComplet` → `mapperCollectionsEmploi` → `versStatutParticulier` / `versAvantageEnNature` → `deduireEtatLigne(…, moisEnCours)`.
>
> **`Company.moisEnCours` sert en revanche à la propagation TAHFIZ** : choix du paramétrage applicable (`resoudreLigneHistorique(lignes, societe.moisEnCours)`) et date de clôture au retrait. Non modifié, à surveiller.
>
> Mois en cours du seed : **Youssef 2022-03**, **Karim 2024-01**. Une ligne saisie avec une date de fin antérieure au mois en cours est **clôturée dès son enregistrement**.

---

## 9. Cartographie des modules

1. **Fiches** : société ✅, salariés ⏳, organismes
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

### ✅ Module 0 — Fondations · ✅ Module 1 — Fiche société
Article publié en brouillon, **non relu**. ADR 0005 à 0010.

### ✅ Module 2, phase 2 — Cadrage de la fiche salarié : CLOS
`PaymaRH_Fiche_salarie_v5.xlsx` et `docs/specification-fiche-salarie-v5.md` — **modèle de données uniquement**.

### ✅ 2.1.a · ✅ 2.1.b · ✅ 2.1.c-1 · ✅ 2.1.c-2 (644 tests, ADR 0022 à 0031)

### ⏳ 2.1.c-3 — Les emplois — temps 1 à 5 livrés, cadrage TAHFIZ livré

**Temps 1 à 4** : aperçus d'impact manquants ; socle multi-version ; trois référentiels d'emploi ; accordéon ; Contrat, Affectation, Rémunération modifiables ; ADR 0032.

**✅ Temps 5 — les trois tableaux portés par l'emploi.** 722 → 790 tests. P1 avantages en nature (`e398d8a`), P2 primes contractuelles (`9162bae`), P3 statuts particuliers, lignes propagées masquées, droits lus sur l'emploi (`973fd33`).

**✅ Cadrage TAHFIZ — CLOS.** 790 → 818 tests, 108 → 110 fichiers.

| Étape | Objet | Commit |
|---|---|---|
| — | Contexte v12 dans `docs/` | `05420a8` |
| Point d'arrêt + complément | Relevé de la propagation, des contrôles, du seed, du verrouillage des lignes clôturées (R1–R14, C1–C3) | — |
| **Prompt A** | API + seed + docs : type `INSERTION`, TAHFIZ limité aux périodes CDI (fonction pure partagée), IDMAJ réservé au contrat d'insertion, type `INSERTION` immuable, synchronisation à la création d'emploi et au PATCH contrat, seed cohérent, ADR 0033 | `47e1e83` |
| **Prompt B** | Écran : lignes de statut clôturées modifiables et supprimables (propriété `lignesInactivesModifiables` de l'enveloppe), harnais réalignés sur les règles | `60b7acc` |

**Décompte prompt A** : 790 + 9 (T1, unitaires de la fonction pure) + 10 (T2–T7, T8a, T8b, T9a, T9b) + 2 (T10) = 811 ; 14 cas modifiés ; 2 fichiers créés.
**Décompte prompt B** : 811 + 7 (TB04, TB05, TB06, SP23, SP24, SP25, AN18) = 818 ; 6 cas modifiés (SP01, SP03, SP05 inversé, SP11, SP16, SP18).

### ⏭️ Reste à faire — dans cet ordre, validé par le porteur

1. **Temps 6** (§18) — création et suppression d'un emploi, extension de `RubriqueCreable` aux emplois, **garde de droits sur Contrat et Affectation**.
2. **Traitement à la racine du motif parent/enfant** (sept occurrences).
3. **Empêcher la suppression d'un compte bancaire désigné par un emploi.**
4. **Article de base de connaissance** de la fiche salarié — clôture de la 2.1.c-3.

---

## 11. Les écrans — décisions figées

### 11.1 Routes et contexte société

```
/societes/[id]/salaries              liste des salariés
/societes/[id]/salaries/nouveau      création d'un salarié
/societes/[id]/salaries/[salarieId]  fiche d'un salarié
```

**La société est portée par l'URL, jamais par un état applicatif.**

### 11.2 Le squelette

**Sommaire à gauche · rubriques au centre · rail d'actions à droite.** Rubriques empilées, toutes visibles, toujours éditables. Pas de mode lecture.

### 11.3 L'enregistrement — un seul bouton pour une API découpée

Un **registre des modifications** partagé. Contrat `RubriqueEnregistrable` : `id`, `libelle`, **`entite`**, `estModifiee()`, `envoyer(version)`, `reinitialiser()`.

Envoi **une par une, en séquence, dans l'ordre déclaré**. **La version circule PAR ENTITÉ** ; un succès ne met à jour que le numéro de son entité.

| Refus | Comportement |
|---|---|
| **Métier** (`400` avec code, `403`) | on continue ; la rubrique garde sa saisie et affiche le message du serveur — **sous le champ désigné** quand `champ` correspond à un champ de la rubrique (constaté pour `typeContratCode`), sinon en tête de rubrique |
| **Conflit** (`409` `CONFLIT_VERSION`, `428`) | on **arrête** ; **un seul bandeau au niveau de la fiche** |
| **Non métier** (`500`) | message générique, **jamais le message du serveur** |

**Ne jamais fusionner ces tests.** **Annuler** nomme les rubriques concernées et ne provoque aucun appel. **`reinitialiser()` ramène au DERNIER ENREGISTREMENT RÉUSSI.**

| Verrouillage | Effet |
|---|---|
| Enregistrement en cours | TOUTES les rubriques non modifiables |
| Écriture hors séquence | Supprimer du tableau **et** Enregistrer du rail inactifs |
| Suppression de la fiche | Enregistrer **et** Annuler inactifs |

**Le signal de fin est émis au succès COMME À L'ÉCHEC.**

> **Les tableaux d'emploi appellent `notifierSommaire()` dans `validerLigne`.** Sans cet appel, le bouton Enregistrer reste inactif après la validation locale d'une ligne. **Personnes à charge n'en a pas besoin — cause NON ÉLUCIDÉE**, rattachée à la dette parent/enfant.

### 11.4 Ce que l'écran retient d'une réponse d'écriture — CRITIQUE

**Les routes des tableaux du salarié renvoient la fiche entière ; les routes d'emploi renvoient l'emploi complet.** L'écran n'applique **jamais** la réponse en bloc. Il n'en retient **que** le nouveau numéro de version et **la ligne portant l'identifiant concerné** (après une création : l'identifiant **serveur** remplace l'identifiant local). **Exception unique** : le PUT groupé des comptes bancaires (ADR 0023).

**Toute mise à jour d'état part de l'état courant, jamais d'une capture** — **y compris la remontée d'une rubrique d'emploi vers la page** (forme fonctionnelle).

### 11.5 La découpe des rubriques d'identité — quatre blocs

Identité (`PATCH /salaries/:id/identite`), Identifiants et immatriculations (`/identifiants-legaux`), Coordonnées (`/coordonnees`), Dates clés (`/dates`). Alertes avec champ → sous le champ ; sans champ → **en tête de son bloc**, jamais de bandeau global. Astérisques : nom, prénom, sexe, date d'entrée.

> **Écart connu** : le bloc Identité passe un `onServeurChange` inerte. Ne pas le reproduire.

### 11.6 Ordre dans la page

Identité → Identifiants → Coordonnées → Personnes à charge → Comptes bancaires → Dates clés → Prêts → Saisies sur salaire → **Emplois**

### 11.6 bis Les quatre chemins d'écriture d'un tableau

1. modification locale ; 2. enregistrement ; 3. **suppression immédiate hors séquence** ; 4. suppression locale d'une ligne jamais enregistrée. **LES QUATRE ÉCRIVENT L'ÉTAT *ET* LA COPIE `ref`.** Au chemin 3, l'écriture est **synchrone, avant le signal de fin**.

### 11.7 Les tableaux répétables — comportement figé

Tableau en lecture seule ; un clic déplie le formulaire **juste en dessous, pleine largeur, disposition verticale**. **Composant générique pour l'enveloppe seulement, formulaire écrit à la main par tableau.** L'enveloppe porte la suppression via un **contrat injecté** (`preparer`, `confirmer`) et ne connaît ni code de refus, ni client HTTP, ni nom de tableau (**TB03**). Pas de colonne « État » : `idColonneMarque`. **Un seul formulaire ouvert sur toute la page.** **Aucun tri** ; une ligne non enregistrée s'affiche en dernier. **Les lignes CLÔTURÉES sont grisées** (« inactive depuis MM/AAAA ») et se déplient **en lecture seule, sans Supprimer** — **sauf dans la rubrique Statuts particuliers**, où elles restent grisées mais se déplient **modifiables, avec Supprimer** (§11.7 bis). **Un tableau = une rubrique.**

### 11.7 bis Le contrat de l'enveloppe

`apps/back-office/src/components/salaries/fiche/enveloppe-tableau-repetable.tsx`

**Obligatoires** : `colonnes`, `lignes`, `getLigneId`, `estInactive`, `estNonEnregistree`, `libelleEtatLigne`, `idColonneMarque`, `formulaireOuvertId`, `onOuvrirFormulaire`, `onValiderLigne`, `onAnnulerLigne`, `renderFormulaire`, `onAjouter`, `onSupprimer`, `peutModifier`.
**Facultatives** : `ligneEnErreur`, `suppression`, `onAttenteSuppressionChange`, `verrouille`, `testId`, **`lignesInactivesModifiables`** (ajoutée au prompt B, fausse par défaut).

- **Elle ne suppose RIEN du salarié.** **TB03 le prouve** — nuance : TB03 interdit tout import `@/lib/api/` et les codes de refus, mais **ne cherche que deux noms de tableau** (personnes à charge, comptes bancaires), pas les sept.
- **Règle de lecture seule** : `figeeParInactivite = inactive && !lignesInactivesModifiables` ; une ligne est en lecture seule si `figeeParInactivite || saisieBloquee || !peutModifier`. Le bouton Supprimer est masqué si `figeeParInactivite`. **Le grisé dépend toujours de `inactive` seul.**
- **Sans droit de modification, la colonne d'actions n'existe pas** (`peutModifier ? <TableCell>… : null`).
- **`libelleEtatLigne` rendant `null` n'affiche rien de parasite** — c'est ce qui permet aux primes de passer une colonne marque sans effet.
- **Seule la rubrique Statuts particuliers passe `lignesInactivesModifiables`.** Tests : TB04 (propriété vraie : grisée, mention, modifiable, Supprimer), TB05 (sans droit : lecture seule, sans Supprimer), TB06 (saisie bloquée : lecture seule, Supprimer présent mais inactif), T09 (sans la propriété : comportement d'origine), AN18 (avantages : ligne clôturée B03 sans Supprimer malgré tous les droits).
- Documenté dans `docs/CONVENTIONS.md` (note datée du 2026-10-06).

**Sept rubriques l'utilisent** : personnes à charge, comptes bancaires, prêts, saisies sur salaire, **primes contractuelles, avantages en nature, statuts particuliers**.

Le formulaire ouvert est tenu par `contexte-formulaire-tableau.tsx`, **portée page entière**. Les harnais qui montent `BlocEmplois` doivent fournir `FormulaireTableauProvider`.

### 11.8 Les suppressions dans les tableaux

| | Ajout et modification | Suppression |
|---|---|---|
| Comptes bancaires | différés | **différée aussi** |
| Personnes à charge, prêts, saisies | différés | immédiate, aperçu et jeton |
| Avantages en nature, statuts particuliers | différés | immédiate, aperçu et jeton (**y compris une ligne de statut clôturée** : aperçu `mode: 'supprimer'`, « La ligne sera supprimée définitivement. ») |
| **Primes contractuelles** | différés | **immédiate, SANS aperçu** : fenêtre composée par l'écran — « Supprimer la prime « *libellé* » ? La suppression est immédiate et définitive. » — boutons Annuler et Supprimer ; `DELETE` avec `If-Match`, **sans jeton** |

### 11.9 à 11.12

*(Comptes bancaires, prêts, saisies sur salaire, liste des salariés : inchangés depuis la v9.)*

### 11.13 L'écran de création d'un salarié

Route `/societes/[id]/salaries/nouveau`. **Les quatre blocs d'identité sont RÉUTILISÉS** via `RubriqueCreable`. **Un seul POST.** ADR 0028. **Contrat non étendu aux emplois — temps 6.**

### 11.14 Supprimer le salarié

Clic → aperçu → fenêtre → DELETE avec jeton et `If-Match` → retour à la liste.

### 11.15 Le garde de navigation (ADR 0031)

Module unique `components/navigation/`, règle de lint. Les écrans à saisie se déclarent au montage et **se retirent au démontage**. **Le bloc Emplois est un écran à saisie.** Non gardés, assumé : bouton Retour du navigateur, barre d'URL, liste des salariés.

### 11.16 Les emplois — décisions d'écran

**Bloc en bas de page.** **Une seule entrée « Emplois » au sommaire.** **Un seul emploi déplié à la fois** ; à l'ouverture, aucun si plusieurs, le seul s'il n'y en a qu'un. Ligne repliée : poste · type de contrat · date de début · date de sortie. **Le corps replié reste monté, masqué — ne jamais revenir à un démontage.** Emplois terminés derrière « afficher les emplois terminés » (bascule absente s'il n'y en a pas), **modifiables**. Salarié sans emploi : une phrase sobre.

**Rubriques par emploi, dans cet ordre — TOUTES LIVRÉES** :

| # | Rubrique | Droit d'affichage | Droit de modification |
|---|---|---|---|
| 1 | Contrat | toujours | ⚠️ **aucune garde à l'écran** (temps 6) |
| 2 | Affectation | toujours | ⚠️ **aucune garde à l'écran** (temps 6) |
| 3 | Rémunération (+ paiement) | `salarie.remuneration.lire` | `salarie.remuneration.ecrire` |
| 4 | Primes contractuelles | clé `primesContractuelles` présente | `salarie.remuneration.ecrire` |
| 5 | Avantages en nature | clé `avantagesEnNature` présente | `salarie.remuneration.ecrire` |
| 6 | Statuts particuliers | **toujours** | **`emploi.modifier`** |

**Tous ces droits sont lus sur `emploi.operations`**, jamais sur la fiche.

**Champs déduits non modifiables** : durée de la période d'essai, état d'ouverture, durée dans l'autre base. **Le compte bancaire est une liste déroulante des comptes du salarié.** **Le type de contrat est une liste déroulante de huit entrées** (« Contrat d’insertion » après « Convention de stage »).

### 11.17 L'ordre des rubriques

Une **fonction** prend les emplois affichés et rend l'ordre : les **huit rubriques du salarié**, puis pour chaque emploi ses rubriques dans l'ordre `ORDRE_RUBRIQUES_EMPLOI` (`contrat`, `affectation`, `remuneration`, `primes-contractuelles`, `avantages-en-nature`, `statuts-particuliers`). **L'identifiant est composé en un seul endroit** (`idRubriqueEmploi`). Le sommaire : huit rubriques + « Emplois ». **Une rubrique inscrite mais absente de l'ordre lève une erreur visible.** Un seul endroit compose les libellés qualifiés (« Contrat — Responsable paie »).

> **Un salarié à deux emplois porte 20 rubriques** (8 + 6 + 6).

### 11.18 Les trois tableaux d'emploi — décisions d'écran

| Tableau | Colonnes | `idColonneMarque` | Formulaire |
|---|---|---|---|
| Primes contractuelles | Prime · Mois d'application | Prime (sans effet) | Prime (liste) · mois |
| Avantages en nature | Nature · Montant · Mois d'application | Nature | Nature (liste) · montant · mois |
| Statuts particuliers | Statut · Date de début · Date de fin | Statut | Statut (liste — **IDMAJ seul, voulu**) · début · fin facultative (vidée → `null`) |

- **Mois** : « Tous les mois » si les douze ; sinon liste abrégée calendaire (« Juin, Déc. ») ; **case vide** si aucun. Saisie : douze cases + « Tous les mois » qui reflète l'état réel.
- **Les libellés viennent des référentiels, jamais les codes bruts.**
- **Le formulaire n'affiche jamais** `moisEffetDebut`, `moisEffetFin`, `etat`, `origine`.
- **Lignes propagées (TAHFIZ) : absentes de l'écran.** Un seul filtre, sur `origine`, appliqué avant tout. **La remontée au parent conserve les lignes propagées de l'emploi courant**, suivies des lignes de la référence (SP16).
- **Lignes de statut clôturées : grisées, modifiables, supprimables** (prompt B). Après une réponse, l'état se recalcule depuis la ligne renvoyée (une ligne dont on recule la fin peut redevenir active — SP23).
- **Sur un emploi en CDI portant TAHFIZ, la rubrique Statuts n'a rien de modifiable en réalité** (IDMAJ y est refusé, TAHFIZ masqué). Pour garder SP16 utile, les harnais utilisent un **code saisissable fictif `FICTIF_CDI`** ajouté au seul référentiel du test.
- **Aucun contrôle serveur n'est rejoué côté écran.**

---

## 12. L'API — relevé vérifié

Contrôleurs : `salaries.controller.ts` et `emplois.controller.ts`. Aucun préfixe global.

### 12.0 Création et suppression d'une fiche salarié

```
POST   /salaries
GET    /salaries/:id/impact-suppression
DELETE /salaries/:id?confirmationJeton=
```

Le POST n'exige pas `If-Match`. Obligatoires : `nom`, `prenom`, `sexe`, `dateEntree`. **Le POST n'accepte pas d'emploi.**

### 12.1 Les quatre tableaux du salarié

`personnes-a-charge`, `prets`, `saisies-sur-salaire` : POST / PATCH / DELETE / impact-suppression. **Comptes bancaires** : `PUT` groupé `{ comptes: [...] }`, tout ou rien.

### 12.2 L'API des emplois

```
POST   /salaries/:salarieId/emplois            création (emploi.creer) — synchronise TAHFIZ dans la transaction
GET    /emplois/:id                             lecture (aucun écran ne l'appelle)
GET    /emplois/:id/versions/...                historiques
PATCH  /emplois/:id/contrat                     emploi.modifier, If-Match — synchronise TAHFIZ dans la transaction
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

**La version exigée est celle de L'EMPLOI.** **Une route PATCH d'emploi renvoie l'emploi complet.** Écritures des statuts : **`emploi.modifier`**. Écritures des primes et avantages : `emploi.modifier` sur la route **+ `assertEcritureRemunerationSalarie` dans le service**. **Le DELETE d'une prime n'exige pas de jeton.** Le refus de suppression d'un emploi pour cause de bulletins est inactif tant que le port bulletin rend une liste vide.

**Refus ajoutés au cadrage TAHFIZ** (forme `{ code, message, champ }`, statut 400) :

| Code | Champ | Message | Où |
|---|---|---|---|
| `STATUT_RESERVE_CONTRAT_INSERTION` | `statutCode` | « Le statut IDMAJ ne peut être saisi que sur un emploi en contrat d’insertion. » | création, et modification **quand le code passe à IDMAJ** (`assertStatutReserveContratInsertion`, `validation-tableaux-emploi.ts`) |
| `CHANGEMENT_TYPE_CONTRAT_INSERTION` | `typeContratCode` | « Un contrat d’insertion ne peut pas changer de type : créez un nouvel emploi. » | `PATCH /emplois/:id/contrat` (`assertTypeContratInsertionImmuable`, `validation-emploi.ts`) ; compare avec **toutes** les versions existantes |

Les deux codes figurent dans `docs/modules/module-2-fiche-salarie/04-api-tableaux-repetables.md`. Constantes : `codes-type-contrat.ts` (`CDI`, `INSERTION`, `IDMAJ`).

### 12.2 bis Les trois tableaux d'emploi — champs exacts

- **`PrimeContractuelle`** : `id`, `emploiId`, `primeRef` (FK `Restrict`), `moisApplication` (`Int[]`). Pas de date, pas d'état, pas d'unicité.
- **`AvantageEnNature`** : `id`, `emploiId`, `natureRef` (FK `Restrict`), `montant` (`Decimal(14,2)`), `moisApplication`, `moisEffetDebut`, `moisEffetFin`.
- **`StatutParticulierLigne`** : `id`, `emploiId`, `statutCode` (FK `Restrict`), `dateDebut`, `dateFin` (nullable), `origine` (`SAISIE_MANUELLE` par défaut).

**Dates de statut** : DTO `@IsDateString()` ; rendues `AAAA-MM-JJ` ; un PATCH accepte `dateFin: null`.

**Le client écrit** : `primeRef`, `natureRef`, `montant`, `moisApplication`, `statutCode`, `dateDebut`, `dateFin`. **Jamais** `moisEffetDebut`, `moisEffetFin`, `origine`.

**Validations des statuts, dans l'ordre** : `refuserStatutNonSaisissable` (TAHFIZ → `CHAMP_INTERDIT`) ; `assertStatutCodeConnu` (`VALEUR_INDISPONIBLE`) ; **`assertStatutReserveContratInsertion`** ; `dateFin ≥ dateDebut` ; **chevauchement refusé tous codes confondus, lignes propagées comprises**. Ces contrôles sont **distincts, jamais fusionnés**. Aucun refus lié à l'état (`CLOTUREE`) de la ligne.

**Autres validations** : mois 1–12, liste non vide, montant strictement positif. Aucun refus de doublon sur primes et natures.

**Alertes non bloquantes** : statut hors de l'intervalle de l'emploi (C7) — affichée en tête de rubrique.

### 12.3 La propagation TAHFIZ (ADR 0018, réécrite par l'ADR 0033)

**Côté société** : `CompanyParametrageHistorique` (`typeExonerationId` → `TypeExoneration` code `TAHFIZ`, `exonerationDateDebut`, `exonerationDateFin` en `AAAA-MM`), daté par `moisEffet`. Écrite par `PUT /societes/:id/parametrage` → `SocietesService.ecrireParametrage`.

**Calcul** : **`calculerLignesTahfiz`** (`tahfiz/periodes-tahfiz.ts`), **fonction pure, sans Prisma ni Nest**, utilisée par le service **et par le seed**. Règles : §5.1.

**Service** (`propagation-tahfiz.service.ts`) :
- `synchroniserDansTransaction` — tous les emplois de la société, dans la transaction du paramétrage société ;
- `synchroniserEmploiDansTransaction` (remplace `poserSurNouvelEmploi`) — un emploi, à sa création et à chaque `PATCH /emplois/:id/contrat` (type, date de début, date de sortie).
- **Synchroniser rend les lignes propagées égales au calcul** : création, mise à jour des dates, retrait. Deux synchronisations successives ne changent rien (T7). Appariement : une ligne existante est rattachée à la ligne calculée qu'elle chevauche.
- **Protection des bulletins conservée** : une ligne n'est jamais rétrécie en deçà d'un bulletin ; au retrait, elle est supprimée si aucun bulletin ne la couvre, close sinon. **Quand un bulletin couvre une période qui n'est plus en CDI, les lignes ne sont donc pas strictement égales au calcul** (assumé, ADR 0033).

**Refus serveur** : `STATUT_PROPAGE_LECTURE_SEULE` (409) sur PATCH et DELETE d'une ligne propagée — **conservé, même si l'écran ne montre pas ces lignes**. Le client ne peut pas imposer `origine`.

### 12.4 Le champ `etat`

`'ACTIVE' | 'PAS_ENCORE_EFFECTIVE' | 'CLOTUREE'`, **déduit** par `deduireEtatLigne` (cinq tableaux ; pas les primes), **au mois en cours du salarié** (§8). Pour les statuts, l'écran dérive le mois de fin de `dateFin` pour composer « inactive depuis MM/AAAA » via `libelleEtatLigneHistorise`.

### 12.5 Verrouillage optimiste et alertes

Aperçu : `{ salarieId, ligneId, mode, message, jetonConfirmation }` (sans `mode` pour une fiche ou un emploi). `AlerteApi` : `code`, `champ?`, `indexLigne?` (PUT comptes uniquement), `message`, `salarieExistantId?`.

> ⚠️ **L'écriture d'un statut et le verrou de l'emploi ne sont pas dans une même transaction** (`verrouillage-optimiste.service.ts`) : le contrôle de chevauchement est fait hors transaction. Deux écritures simultanées pourraient passer. **Dette, hors périmètre.**

### 12.6 `EmploiFiche`

`id`, `version`, `numeroOrdre`, `contrat`, `remuneration?`, `paiement?`, `affectation`, `primesContractuelles?`, `avantagesEnNature?`, `statutsParticuliers`, `resolutions`, `operations?`. **Optionnels = masqués faute de droit**, sauf `operations` (présent sur `GET /salaries/:id` seulement).

### 12.7 `ResolutionsEmploi`

Sept champs ; `| null` = aucune valeur héritée. Deux optionnels (télétravail) = masqués faute de droit.

### 12.8 Une seule forme de refus (ADR 0029)

`{ code, message, champ }`, global, `whitelist` + `forbidNonWhitelisted`. Aucune chaîne anglaise. Un seul champ désigné.

### 12.9 Les trois champs jamais vides (ADR 0030)

`nom`, `prenom`, `dateEntree`. **Interdire le vide n'est pas interdire l'absence.** `NOT NULL` n'interdit pas la chaîne vide.

### 12.10 Les référentiels

| Référentiel | Route | Ordre par la donnée |
|---|---|---|
| Pays | `GET /referentiels/pays` | oui (Maroc en tête) |
| Situations familiales | `/situations-familiales` | oui |
| Liens de parenté | `/liens-parente` | oui |
| Types de saisie sur salaire | `/types-saisie-sur-salaire` | oui |
| Types de contrat | `/types-contrat` | oui — **8 entrées** : CDI, CDD, CTT, INT_CDI, OBJ, STAGE, **INSERTION (ordre 7)**, MANDAT (ordre 8) |
| Motifs de sortie | `/motifs-sortie` | oui |
| Statuts particuliers | `/statuts-particuliers` | oui — **IDMAJ seul, TAHFIZ exclu** |
| Primes | `/primes` | oui — 15 entrées, **provisoire** |
| Natures d'avantage | `/natures-avantage-en-nature` | oui — 3 entrées, **provisoire** |
| Banques | `/banques` | **non** — point ouvert |

`TypeContrat` est une **table** (pas un enum) : extensible sans migration. Seed : `TYPES_CONTRAT` (`reference-data-fiche-salarie.ts`). Annexe `docs/referentiels-fiche-salarie.md` corrigée.

Enveloppe module 1, contrôle `referentiel.lire` dans le service (qui ne se déclenche jamais — §15). **`reposHebdomadaire` n'est PAS un référentiel.**

> **Libellés affichés** : « IDMAJ — ANAPEC » ; « Contrat d’insertion ».

### 12.11 Les deux référentiels provisoires

Structure plate : `code`, `libelle`, `ordre`. **Aucune règle de paie.**

**Primes (15)** : A04 Prime de panier · A15 Indemnité de transport · A24 Indemnité de représentation · A36 Prime d'ancienneté · A38 Prime d'assiduité · A39 Prime de fin d'année · A40 Prime de 13e mois · A41 Prime de vacances · A42 Prime de polyvalence · A43 Prime de production · A44 Prime de rendement · A45 Prime de responsabilité · A47 Prime de qualité · A49 Prime d'astreinte · A50 Prime de risque (ordre 10 à 150).

**Natures (3)** : B01 Logement de fonction · B02 Voiture de fonction · B03 Nourriture.

> **PROVISOIRES, ILS SERONT DÉMOLIS** au module Primes (table à trois niveaux : national, compte, société). **Les lignes saisies devront être reprises.** Le porteur détient le catalogue complet des 58 primes ; il faudra un marqueur « rattachable contractuellement ».

---

## 13. Ce que les temps ont appris — à ne pas réapprendre

**Un relevé trouve ce qu'aucun test ne cherche.** **Un relevé peut être faux, se contredire, ou affirmer sans montrer le maillon décisif** — le confronter à ce qu'on a vu à l'écran.

**Un fait affirmé de mémoire par Claude est plus fragile qu'un fait relevé.**

**Une décision métier peut réécrire une API déjà livrée — ou révéler qu'elle est fausse.** *(TAHFIZ : une question d'écran a révélé une propagation sans filtre de contrat et un seed incohérent.)*

**Un document de référence peut être faux** (l'annexe « pas de contrat d'insertion »). Le relire au porteur.

**Une réponse du porteur peut contredire le code, un document ou une décision passée.** La relire, la reposer avec ses conséquences. **Une réponse ouvre souvent une nouvelle question** : chercher la conséquence avant d'écrire.

**Masquer à l'écran ne protège pas. Un contrôle sur une route ne protège que cette route. Un contrôle par noms de clés ne protège que ces noms.**

**Un harnais qui fabrique ses droits — ou ses données hors des règles — ne prouve pas le câblage réel.**

**Un test qui ne donne aucun des deux droits concurrents ne distingue pas le bon du mauvais.**

**Une preuve qui échoue par plantage ne prouve pas l'assertion.** **Une preuve qui échoue sur la première moitié d'un test ne prouve pas la seconde.**

**Une sortie « brute » recopiée peut être fausse.**

**Un état capturé au rendu et renvoyé au parent écrase ce qu'une autre rubrique vient d'écrire.**

**Une ligne masquée à l'écran peut toujours faire refuser une écriture** — et revenir par la réponse du serveur si l'extraction prend « la ligne inconnue » par défaut.

**Un seed qui écrit à la main ce qu'un service calcule finit incohérent.** Partager la fonction de calcul.

**Un champ date du navigateur rend une valeur VIDE sur une date impossible** (31/11), sans prévenir.

**Un scénario de vérification mal choisi fait perdre du temps** : le vérifier contre les règles avant de le donner.

**Les tests ne voient pas l'écran. Seize défauts réels trouvés à l'œil.**

**Un décompte faux dans un rapport est un signal, même quand le total est juste.**

**Un échec qui ne touche pas ce qu'on a modifié a d'abord une cause d'environnement** : contention, base polluée, fins de ligne. Les éliminer avant d'analyser.

---

## 14. Le modèle de la fiche salarié — l'essentiel

**Structure : identité (1) + emplois (N).** Le type de contrat est un champ de l'emploi. Un CDD transformé en CDI reste **le même emploi** ; une rupture suivie d'une réembauche crée un **nouvel emploi** ; **un contrat d'insertion suivi d'un CDI crée un nouvel emploi** (type `INSERTION` immuable). Plusieurs emplois peuvent coexister, sans limite.

| Porté par le **salarié** | Porté par l'**emploi** |
|---|---|
| Identité, état civil, coordonnées | Poste, dates, type de contrat, période d'essai |
| Immatriculations (CNSS, CIMR) | Établissement, service, département |
| Personnes à charge | Temps de travail, grille horaire, repos hebdomadaire |
| Comptes bancaires | Jours fériés travaillés, télétravail |
| Date d'entrée, date d'ancienneté | Rémunération, paiement |
| Prêts, saisies sur salaire | Primes, avantages en nature, statuts particuliers |

**Deux sorties** : d'emploi (STC) et du salarié (déduite). **Une seule ancienneté par salarié.**

**Emplois multiples** : deux emplois = deux bulletins ; plafonds et barèmes sur le total des assiettes ; tout au prorata ; jours plafonnés à 26 ; déclarations consolidées par salarié (**à faire confirmer**).

**Chaîne de calcul** : fiche → éléments variables → bulletin **pour les primes seulement** ; le reste alimente le bulletin directement.

**Valeurs déduites, jamais stockées** : type de pièce, date de sortie du salarié, actif/inactif, solde d'un prêt, durée dans l'autre base, durée d'essai, nombre de personnes à charge, libellé accordé, mois en cours, état d'une ligne, état d'ouverture d'un emploi.

**Trois unicités par société** : matricule ; pièce d'identité (si renseignée) ; numéro CNSS (si renseigné).

### TAHFIZ et IDMAJ — l'état réel

| | IDMAJ | TAHFIZ |
|---|---|---|
| Nature | **Statut SALARIÉ** — dispositif d'insertion (ANAPEC) | **Statut SOCIÉTÉ** — exonération portée par l'employeur |
| Saisie | sur la fiche salarié, ligne par ligne | sur la fiche société ; **propagé** aux emplois |
| Emplois concernés | **uniquement type `INSERTION`** | **uniquement les périodes en `CDI`** |
| Visible sur la fiche salarié | oui | **non** |
| Coexistence | **jamais sur un même emploi** ; possible sur deux emplois distincts d'un même salarié | idem |

---

## 15. Points ouverts

### Refermés au cadrage TAHFIZ — ne plus les chercher

- ~~Propagation TAHFIZ à tous les emplois ouverts~~ → périodes CDI seulement (ADR 0033).
- ~~Seed incohérent (Youssef IDMAJ + TAHFIZ)~~ → Youssef en contrat d'insertion, Karim en CDI sous TAHFIZ, ligne calculée par la fonction partagée.
- ~~Refus de chevauchement provoqué par une ligne TAHFIZ invisible~~ → impossible désormais (IDMAJ et TAHFIZ jamais sur un même emploi) ; refus IDMAJ dédié.
- ~~Lignes de statut clôturées verrouillées à l'écran~~ → modifiables et supprimables.
- ~~Ligne TAHFIZ jamais close à la sortie de l'emploi~~ → close à la date de sortie.
- ~~Ligne TAHFIZ commençant avant l'emploi~~ → début = plus tardive des trois dates.
- ~~Annexe « pas de contrat d'insertion »~~ → corrigée.

### LA DETTE À TRAITER — motif parent/enfant

| Réf | Sujet | État |
|---|---|---|
| **★** | **Un état calculé par le parent avant que l'enfant ait rafraîchi ses copies. SEPT occurrences.** **Seuil largement dépassé.** Y rattacher `notifierSommaire()` dans `validerLigne` (nécessaire pour les tableaux d'emploi, inutile pour personnes à charge, cause non élucidée). | **après le temps 6** |

### Ouverts — nés du cadrage TAHFIZ

| Sujet | État |
|---|---|
| **Chemin « nouvelle version de contrat » non testé en HTTP** (M8 et bornes de M3 sur un emploi à plusieurs versions) : il exige un bulletin au mois en cours. Couvert seulement par les tests unitaires de la fonction pure et par construction. | **module bulletins** |
| **Retrait d'une période qui cesse d'être CDI alors qu'un bulletin la couvre** : aucun test dédié | **module bulletins** |
| **Ligne de statut clôturée couverte par un bulletin** : mode de l'aperçu d'impact inconnu ; faut-il bloquer ou signaler sa modification ? | **module bulletins** |
| **Contrôle de chevauchement des statuts hors transaction** avec le verrou de l'emploi | dette |
| **`Company.moisEnCours` choisit le paramétrage TAHFIZ applicable** (pas le mois du salarié) | à surveiller |
| **SP16 repose sur un code fictif `FICTIF_CDI`** (référentiel du test seulement) | assumé |
| **Titre du test « 8 et 10 »** : le scénario « 10 » est ailleurs (`fiche-tableaux-api-http.spec.ts`, test 10) | cosmétique |
| **Vérifications de présence `expect(getByTestId(…)).toBeTruthy()`** : le `toBeTruthy` est inutile (TB04 l. 285, TB06 l. 299, SP05 l. 438, AN18 l. 925) — l'échec sort en erreur Testing Library, pas en assertion | cosmétique |
| **TB03 ne cherche que deux noms de tableau sur sept** | à renforcer |
| **Tests back-office instables sous charge** : « une creation complete n emet qu un seul appel reseau » (`ecran-creation-salarie.spec.tsx` l. 114) a dépassé son délai deux fois sur trois ; quatre échecs non identifiés vus par Cursor lors d'un lancement combiné | à surveiller |
| **Conditions d'éligibilité de TAHFIZ** (plafond, effectif, durée) | **module de paie** |

### Ouverts — autres

| Sujet | État |
|---|---|
| **Contrat et Affectation sans garde de droit à l'écran** | **temps 6** |
| **Les trois rubriques d'emploi LÈVENT UNE ERREUR quand un code est absent du référentiel** (`libelleReferentielParCode`, `libelles-emploi.ts` l. 52) → **toute la fiche plante** | dette |
| **Une date impossible tapée au clavier devient VIDE sans avertissement** — tous les champs date | ergonomie, plus tard |
| **Les alertes en tête de rubrique s'empilent sans désigner la ligne** | à surveiller |
| **Le test statique d'ordre est tautologique** (`ordre-rubriques-fiche-salarie.spec.ts` l. 28–34) | à retirer ou réécrire |
| Les deux référentiels provisoires seront **démolis** ; lignes à reprendre | module Primes |
| Catalogue des 58 primes à répartir entre trois niveaux ; marqueur « rattachable contractuellement » | module Primes |
| **`referentiel.lire` dans le service ne se déclenche JAMAIS** ; le `403` vient du garde de route | module d'authentification |
| Refus des champs facultatifs OMIS non prouvé sur les quatre DTO d'emploi | à surveiller |
| Message de tenant sans accents, mot « tenant » exposé | module d'authentification |
| Béquilles de dev `x-paymarh-user-id`, `NEXT_PUBLIC_PAYMARH_USER_ID`, `x-paymarh-permissions-refusees` | **bloquent la production** |
| Prêts et saisies sans contrôle de droit au-delà de `salarie.modifier` | module d'authentification |
| Grille horaire et jours fériés hérités non détaillés ; `departementRef`, `serviceRef`, `repartitionHoraireRef` sans référentiel | module 3 |
| `declarerCleRubrique` sans appelant | à retirer |
| La page charge dix choses en parallèle ; 26 requêtes SQL par lecture | à mesurer |
| Tous les emplois restent montés (corps masqué) | à surveiller |
| `ordre Int @unique` sur `Pays`, `LienParente`, `TypeSaisieSurSalaire` | à aligner |
| Refus des champs d'historisation garanti seulement pour les saisies | à aligner |
| Un filet du client HTTP interprète l'ancienne forme de refus ; seul appelant : un test | à surveiller |
| La coquille racine n'est pas couverte par la règle de lint de navigation | prochain passage |
| Fiche société et création de société : saisie perdable, **aucun garde** | reprise module 1 |
| Écart de câblage du bloc Identité | à surveiller |
| **Les tests d'intégration partagent la base du serveur de développement** (banques de test résiduelles). Remède : `pnpm db:reset` PUIS `pnpm db:seed` | hors module 2 |
| Quotité saisissable (article 387) | module 4 |
| Le salarié « complet » du seed a deux emplois — des tests s'appuient sur lui | à surveiller |
| Suppression d'un compte bancaire désigné par un emploi | **après le temps 6** |
| `couleur` sur `Banque`, pas d'`ordre`, codes vides | référentiels |
| Personne à charge inactive encore comptée | module 4 |
| Page d'accueil du back-office | production |
| Liste d'exemption du module 1 : 35 routes. **Ne jamais l'allonger** | reprise module 1 |
| Compilation de l'API absente de `pnpm verify` | à discuter |
| `BulletinPort` et `ReferentielNationalPort` provisoires | modules 2, 4, 5 |
| Premier mois de gestion : ancrage du chaînage | module 2 |
| Articles de base de connaissance non relus ; captures (Playwright absent) | relecture / fin 2.1.c |
| Z14 — Retouches fiche société v7 + AuditLog + champ Banque + champs mois + garde | module 1 |
| Z6 — Faire confirmer par la CNSS et la DGI la consolidation par salarié | vérification métier |
| Vérifications OMPIC et noms de domaine pour VECTA | en attente |

---

## 16. Environnement

- **GitHub** : `https://github.com/omarrizqi-sys/paymarh.git`, branche `main`. **Le dépôt garde son nom PaymaRH.**
- **Cursor ne peut pas lire un `.xlsx`** — toujours fournir la version Markdown.
- **`pnpm verify`** = `lint && format:check && typecheck && test && check:circular && back-office build`. **Lancé par le porteur.** Durée : 60 à 110 secondes.
- **`pnpm format`** avant un `verify`. **ARRÊTER LES SERVEURS DE DÉVELOPPEMENT avant `pnpm verify`.**
- **Vérifier que les serveurs sont arrêtés** : `netstat -ano | findstr "LISTENING" | findstr ":3000 :3001"`. Aucune ligne = arrêtés. Sinon `Stop-Process -Id` suivi du numéro de processus (dernier nombre de la ligne), ou Ctrl+C dans le terminal du serveur.
- `madge` rapporte **2 avertissements** (imports CSS), bénins.
- **Voir le rendu — trois commandes**, fournies systématiquement : `pnpm db:up` · `pnpm --filter api dev` · `pnpm --filter back-office dev`, puis `http://localhost:3000`.
- **Interroger l'API au navigateur rend `401`** : utiliser `curl.exe -s -H "x-paymarh-user-id: …" "http://localhost:3001/..."`. **Jamais de chevrons dans une commande à coller.**
- **Après une migration, un changement de seed, des essais manuels ou une suite de tests** : `pnpm db:reset` (confirmation `y`) puis `pnpm db:seed`. **`db:reset` change l'identifiant utilisateur de développement** : reporter `NEXT_PUBLIC_PAYMARH_USER_ID` dans `apps/back-office/.env`, puis relancer le back-office.
- **`pnpm db:seed` échoue sans `prisma generate`** après modification du schéma. Le seed est un script `tsx prisma/seed.ts` **sans Nest** : il ne peut appeler aucun service, seulement des fonctions pures.
- **Seed — quatre dossiers de démonstration dans DEMO-001** :
  - **Youssef Bennani** — complet, deux emplois.
    - Emploi ouvert (`numeroOrdre` 1), poste « Responsable paie », **type `INSERTION`**, début 01/03/2022, **mois en cours 2022-03** :
      - prime : `A15` Indemnité de transport, mois 6 et 12 ;
      - avantages : `B02` Voiture 1 200,00 (ACTIVE) · `B01` Logement 2 500,00, fin 2024-12 (ACTIVE) · `B03` Nourriture 300,00, fin 2022-02 (**CLOTUREE**) ;
      - statuts : `IDMAJ` 01/06/2021 → 31/12/2022 (ACTIVE) · `IDMAJ` 01/01/2023 sans fin (PAS_ENCORE_EFFECTIVE) · **aucune ligne TAHFIZ**.
      - **Aucune ligne de statut n'est clôturée au mois 2022-03** : pour tester une ligne clôturée à l'œil, en créer une (ex. 01/01/2020 → 31/12/2020, avec alerte C7 « hors intervalle », normale).
    - Emploi terminé (`numeroOrdre` 2), « Gestionnaire paie junior », CDI, sortie 28/02/2022, sans ligne dans les trois tableaux, sans TAHFIZ.
  - **Said Tazi** — minimal, sans emploi.
  - **Amina El Fassi** — sortie, nationalité étrangère, emploi CDI clos.
  - **Karim Alaoui** — entrée 01/01/2024, ancienneté 01/01/2024, un emploi **CDI ouvert**, poste « Comptable », 9 000,00 brut mensuel, siège de Casablanca, base hebdomadaire, durée et repos hérités ; **mois en cours 2024-01** ; **ligne TAHFIZ propagée du 01/07/2025, sans fin, invisible à l'écran** (calculée par `calculerLignesTahfiz`).
- **Activation TAHFIZ de DEMO-001** : paramétrage 2025-07, `exonerationDateDebut` 2025-07, sans fin.
- **Le paramétrage de l'établissement `siege` porte trois mois d'effet** : 2022-01, 2025-01, 2025-07. **Le premier ne doit pas être supprimé.**
- **Fixtures de test API** : `creerEmploiOuvert` (CDI), **`creerEmploiInsertion`**, `creerEmploiAvecTypeContrat`, `assurerTypesContrat` (`test/support/fiche-salarie-fixtures.ts`). **Toute ligne IDMAJ de test se pose sur un emploi `INSERTION`.**
- **Quand un écran refuse de s'afficher**, la vraie erreur est dans le **terminal du back-office**.
- **PowerShell** : `curl.exe`, `Remove-Item -Recurse -Force`, chemins à crochets entre guillemets, `git --no-pager diff`, pas de `&&` (séparateur invalide). Les blocs « node.exe : … NativeCommandError » autour d'une sortie de tests sont l'habillage par PowerShell de ce qui est écrit sur stderr, pas des erreurs. Une réécriture de fichier par PowerShell peut **corrompre les accents** (« — » devenu « â€” »).
- **Commit manuel** : `git checkout -- apps/back-office/next-env.d.ts` → `git add -A <chemins>` → **`git status --short`** (Claude annonce le nombre de lignes attendu) → message suivant : `git commit` → `git push`. Les avertissements CRLF sont bénins. Git peut afficher un remplacement de fichier comme un renommage (`R`).

---

## 17. Rappels de méthode

- Claude **cadre et décide avec le porteur d'abord**, puis fournit **un prompt Cursor complet, d'un seul tenant, sans clôture imbriquée**.
- Le prompt Cursor : contexte, **faits à contredire** ou **point d'arrêt**, **fichiers à lire avant d'écrire**, socle à réutiliser, périmètre strict (à faire / à NE PAS faire — **y compris « ne modifie pas `docs/PaymaRH-Contexte-Reprise-*.md` »**), **critères d'acceptation vérifiables par un non-codeur**, **liste nominale des tests avec fichier et ligne**, **preuves d'échec en sortie brute, une par chemin**, **« Décisions prises seul »**, **« Ce que je n'ai pas pu tester honnêtement »**, **« Ce qui m'a surpris »**, **« Ne lance pas pnpm verify »**, et l'ordre de **s'arrêter et poser la question** si un choix n'est pas couvert.
- **Pour un prompt d'écran : exiger que les harnais reproduisent la forme RÉELLE de l'API et ses règles métier** (niveau des droits, clés masquées, lignes propagées, types de contrat compatibles avec les statuts).
- **Quand la cause d'un défaut est inconnue : diagnostic, puis correction, en deux prompts.**
- **Après chaque prompt livré : `pnpm verify` par le porteur, vérification visuelle**, liste numérotée, trois commandes, points ★ signalés, **scénarios vérifiés contre les règles**, puis commit.
- **Vérifier systématiquement les rapports de Cursor.**
- **Claude signale quand ouvrir une nouvelle conversation** et fournit ce document à ce moment-là.
- **Modèle et effort en fin de CHAQUE message** (§2.1).

---

## 18. PROCHAINE ÉTAPE — le temps 6

**Objet** (validé par le porteur) :
1. **Créer un emploi depuis la fiche salarié** (`POST /salaries/:salarieId/emplois`, droit `emploi.creer` sur la racine de la fiche).
2. **Supprimer un emploi** (`GET /emplois/:id/impact-suppression` sans `mode`, puis `DELETE /emplois/:id?confirmationJeton=` avec `If-Match`, droit `emploi.supprimer` sur l'emploi).
3. **Étendre `RubriqueCreable` aux emplois** (ADR 0028), si la création passe par les rubriques existantes.
4. **Garde de droits sur Contrat et Affectation** : sans `emploi.modifier` sur l'emploi, ces deux rubriques doivent être en lecture seule (aujourd'hui toujours modifiables à l'écran).

**Ce qui existe déjà côté API** : la création synchronise TAHFIZ dans sa transaction (`synchroniserEmploiDansTransaction`) ; un emploi peut être créé directement en `INSERTION` ; le type `INSERTION` ne peut plus changer ensuite ; `EmploisService.creer` appelle `assertEcritureRemunerationSalarie` (RE5) ; le POST de la fiche salarié **n'accepte pas d'emploi**.

**À commencer par un point d'arrêt** : relever le DTO de création d'un emploi (champs obligatoires, blocs contrat / rémunération / affectation, valeurs par défaut), les refus possibles, ce que rend la réponse, le contenu de l'aperçu d'impact d'un emploi, comment `bloc-emplois.tsx` et la page gèrent la liste des emplois (ajout, retrait, ordre, emploi déplié), comment `RubriqueCreable` fonctionne sur l'écran de création, et comment Contrat et Affectation lisent (ou non) leurs droits.

**Questions de cadrage probables** (à reformuler à partir de situations concrètes, §2) :
- Où se trouve le bouton « Ajouter un emploi » (en tête du bloc Emplois, dans le rail) ? Que voit l'utilisateur ensuite : un nouvel emploi déplié vide dans le bloc, ou un écran séparé ?
- Quels champs sont exigés à la création (poste, date de début, type de contrat, établissement…) ? La rémunération est-elle saisie à la création ou après ?
- La création d'emploi passe-t-elle par le bouton Enregistrer de la fiche (séquence) ou par un enregistrement propre ?
- Peut-on créer un emploi depuis l'écran de création d'un salarié (même POST ou deux appels) ?
- Supprimer un emploi : depuis l'accordéon (bouton dans l'en-tête de l'emploi) ? Que montre la fenêtre ?
- Contrat et Affectation sans droit : lecture seule de tout le bloc, ou rubrique absente ?

**Ensuite** : traitement à la racine du motif parent/enfant (§15), compte bancaire désigné par un emploi, article de base de connaissance.
