# PaymaRH — Document de contexte (reprise de conversation)

> **Comment m'en servir :** téléverse ce fichier au début d'une nouvelle conversation avec Claude, avec le message d'ouverture fourni à part.
>
> **Version :** remplace intégralement la v5 et la v6. Dernière mise à jour : fin du **temps 2.b de la sous-étape 2.1.c-2** (rubrique Comptes bancaires livrée, vérifiée à l'écran, commitée, poussée). **525 tests, 76 fichiers, `pnpm verify` vert, arbre propre.**

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
- **Écrire pour un non-développeur.** Les questions de cadrage doivent partir d'une situation concrète à l'écran, pas d'un mécanisme technique. **Si une question ne peut pas s'expliquer par « voilà ce que l'utilisateur fait, voilà ce qui se passe », elle est mal posée.**
- Sorties **complètes et prêtes à copier-coller**. Pas d'esquisse partielle.
- Claude accompagne chaque question d'une **recommandation motivée**, pour que le porteur puisse valider par un simple « ok ».
- **Vérifier que toutes les questions ont été tranchées** avant de rédiger le prompt. Au temps 2.b, une question (E4) a été sautée dans la réponse du porteur ; Claude l'a signalée et a appliqué sa recommandation par défaut, en le disant. **Signaler l'omission, ne jamais la combler en silence.**
- Il conteste et corrige quand c'est nécessaire — **c'est un signal fiable**, ne pas le contourner.
- Quand un point est trop technique, il le dit et on le reporte. Ne pas insister.
- À chaque module validé, produire **un article de base de connaissance** (manuel utilisateur), rédigé par Cursor à partir de ses notes.

### 2.1 Modèle et effort — règle absolue

**Claude indique à la fin de CHAQUE message quel modèle (Sonnet ou Opus) et quel effort de réflexion (faible, moyen, élevé) paramétrer pour le message suivant.**

**Sans exception aucune** : messages courts, instructions git d'une ligne, confirmations, corrections de commande. L'oubli est arrivé une fois au temps 2.b et le porteur l'a relevé. Il n'y a pas de message « trop court » pour cette mention.

Format : une ligne isolée en fin de message, sans justification, sauf si le porteur la demande.

Repères :

| Situation | Modèle et effort |
|---|---|
| Cadrage d'un nouveau temps | **Opus, élevé** |
| Rédaction d'un prompt Cursor | **Opus, élevé** |
| Production du document de contexte | **Opus, élevé** |
| Relecture d'un rapport de Cursor | **Opus, moyen** |
| Relecture d'un point d'arrêt | **Opus, moyen** |
| Instructions git, échanges courts, confirmations | **Opus, faible** |
| Retour de vérification visuelle | **Opus, faible** |

Le porteur signale lui-même l'effort attendu quand il ouvre un sujet : « élevé » pour une phase de cadrage, « moyen » pour une relecture.

### 2.2 Règles de conduite éprouvées

- **Une seule instruction git par message.** Jamais « commite » et « avant de commiter » ensemble.
- **Ne jamais donner une procédure amputée sans le dire.** Au temps 2.b, Claude a donné deux commandes de démarrage sur trois parce que la troisième était déjà satisfaite — sans le préciser. **Donner la procédure complète, ou dire explicitement quelle étape est déjà faite et pourquoi.**
- **`pnpm verify` est le seul critère d'acceptation technique.** Ne jamais écrire « lint vert et test vert ».
- **Docker fonctionne chez Cursor.** Il peut lancer `pnpm verify` en entier. **Cela ne change rien à l'acceptation** : ses résultats ne valent pas acceptation, c'est le porteur qui lance la commande.
- **Exiger la SORTIE BRUTE de `pnpm verify`, collée depuis le terminal, jamais un résumé.** Une sortie reconstituée de mémoire a déjà annoncé « aucun cycle » sur **zéro fichier traité**. **Un résumé de sortie n'est pas une preuve.** Mettre cette exigence dans chaque prompt.
- **Toujours vérifier le rapport de Cursor contre le prompt.** Le motif est constant : le code est écrit, la preuve manque.
- **Vérifier l'arithmétique des tests à chaque livraison.** Total avant, total après, nombre annoncé : les trois doivent se réconcilier. *Nuance du temps 2.b : les totaux peuvent être justes alors que la phrase qui les explique est fausse (double comptage d'un groupe). Vérifier les nombres, pas la prose.*
- **Exiger fichier ET numéro de ligne pour chaque test de la liste nominale.**
- **Exiger la section « Décisions prises seul » dans chaque rapport.** Quand elle disparaît, la redemander. Quand elle est vide, exiger qu'il l'écrive.
- **Un test qui passe sans exercer le défaut qu'il prétend couvrir est un échec, pas un test.** Exiger une **preuve d'échec** : introduire temporairement le défaut, lancer le test, coller la sortie de l'échec, remettre le code correct. Trois cas vécus (T18, T34, puis T18 à nouveau au temps 2.b — voir §13).
- **Se méfier des contrôles qui ne se déclenchent jamais.** Un contrôle correct qu'aucun chemin réel n'atteint est **plus dangereux qu'une absence de contrôle**. Cas vécu au temps 2.b : une branche entière de l'enveloppe générique, testée, sans aucun appelant en production.
- **Se méfier des décorateurs et des exemptions.** La liste d'exemption est une dette qui se vide, jamais qui s'allonge. **Un contrôle de droit se place au plus près de la donnée, jamais sur une route** : la route protège ce qu'on a pensé à annoter, le service protège tous les appelants présents et futurs.
- **Ne jamais relâcher une contrainte de production pour faire passer un test.** Cas vécu au temps 2.b : rendre une prop optionnelle avec un défaut vide « pour ne pas toucher les tests ». Refusé.
- **Distinguer relâchement et adaptation mécanique.** Ajouter une prop nouvelle et obligatoire aux appels d'un composant dans un fichier de test est une adaptation légitime, à déclarer et justifier — pas un relâchement.
- **Un test qui passe une fois sur deux ne prouve rien.** Le rendre déterministe, jamais le relancer.
- **Un nom de test qui contredit une règle est un doute à lever**, pas un détail de rédaction.
- **Quand un mécanisme dépend d'un port provisoire, exiger que les tests doublent ce port.**
- **Un test ignoré n'est pas un test réussi.**
- **Un mécanisme de test ne doit jamais vivre dans le code de production**, et **le code de test ne doit jamais piloter l'environnement** (pas de `execSync('pnpm db:seed')` dans un test).
- **Demander systématiquement pourquoi un fichier hors périmètre a été modifié**, et exiger une explication vérifiable (`git diff --stat` et le commit concerné).
- **Vérifier ce qui est indexé avant de commiter.** `git status --short` avant `git commit`. Cas vécu au temps 2.b : `next-env.d.ts`, généré par Next, indexé par erreur.
- **Exiger la cause avant la correction.** Une hypothèse n'est pas un diagnostic.
- **Quand un comportement ne peut pas être testé honnêtement, préférer l'aveu au faux test.** **La charge bascule alors sur la vérification à l'œil, qui doit être explicitement listée.**
- **Quand Cursor recommande une solution qui heurte une règle gravée, refuser la recommandation, pas le raisonnement.** Cas vécu au temps 2.b : le décorateur pour le contrôle de permission. Sa proposition était techniquement correcte et bien argumentée ; elle contredisait « se méfier des décorateurs ». **Donner la raison de principe, pas un avis.**
- **Quand un refus impose un aller-retour supplémentaire, encadrer la sortie de secours.** Au lieu d'un troisième point d'arrêt complet, demander **une phrase de vérification** avec consigne de s'arrêter seulement si le fait relevé invalide la décision.
- Découper chaque sous-étape en **temps successifs, avec arrêt entre chacun**.
- **Fil Cursor neuf par temps.** Les prompts correctifs restent dans le fil du temps concerné. Un **point d'arrêt** et sa suite restent dans le même fil.
- **Modèles Cursor** : Composer 2.5 pour le développement courant, Opus 5 pour l'architecture et les types partagés.
- **Séparer les commits de nature différente** — sauf quand un même fichier est touché par deux temps.
- **La vérification visuelle est une étape à part entière**, pas un bonus. Les tests couvrent la mécanique ; ils ne disent rien de ce que l'écran donne à voir. **Neuf défauts réels trouvés à l'œil à ce jour, tous avec une suite de tests verte.**

### 2.3 Le point d'arrêt préalable — pratique validée au temps 2.b

Quand un prompt dépend de faits que Claude ne peut pas vérifier (une route existe-t-elle, un champ est-il présent, une écriture est-elle atomique), **le prompt commence par une section « point d'arrêt »** : Cursor relève les faits, avec fichiers et numéros de ligne, **puis s'arrête sans écrire de code**.

Bilan du temps 2.b : deux points d'arrêt, dix faits relevés, dont **trois ont changé le cadrage** — dont une **faille de sécurité réelle** que personne n'aurait vue autrement. Le coût est un aller-retour ; le gain est de ne pas construire sur une supposition.

Règles :
- **N'écris pas de code, ne crée pas de fichier** doit être écrit explicitement.
- Exiger **fichier et numéro de ligne** pour chaque fait.
- Exiger une **preuve par le code** pour tout fait comportemental (« le PUT écrit-il tout ou rien ? » se prouve par le service et par un test qui compte les lignes en base, pas par une lecture rapide).
- **Lire la suite du prompt ne vaut pas autorisation d'écrire.**

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
   - **Corollaire écran** : une action ou une rubrique que l'utilisateur n'a pas le droit d'exercer ou de voir est **absente du DOM**. Jamais grisée, jamais masquée en CSS. **Le grisé reste légitime pour un état sans rapport avec les droits** — Enregistrer inactif tant que rien n'a changé, ligne inactive dans un tableau, bouton Supprimer grisé pendant un aller-retour serveur, **rubrique non modifiable pendant l'enregistrement**.
   - **Corollaire données** : `operations` est une **liste de ce que l'utilisateur peut faire**. Jamais un objet du type `{ supprimer: false }`.
   - **Corollaire API** : une clé masquée est **absente** de la réponse, jamais `null`. Le type partagé les déclare donc **optionnelles**, jamais nullables.
   - **Corollaire écran, ajouté au temps 2.b** : l'écran doit distinguer **clé absente** (pas le droit de voir → rubrique absente du DOM et du sommaire) et **liste vide** (le salarié n'a rien → rubrique affichée, tableau vide). Les confondre est un défaut d'étanchéité dans un sens, et une rubrique injustement masquée dans l'autre.
   - **Corollaire sécurité, ajouté au temps 2.b** : **masquer une rubrique à l'écran ne protège rien** tant que la route d'écriture reste ouverte. Tout masquage d'écran doit avoir son contrôle côté serveur, prouvé par un test qui échoue sans lui.
8. **Tout calcul et tout contrôle côté serveur** — le front n'en rejoue aucun. Deux exceptions documentées (ADR 0009) : confort de saisie, affichage conditionnel.
9. **Aucune chaîne destinée à l'affichage ne sort de l'API.** L'API rend des données, l'écran compose les phrases.
   - **Exception 1** : la liste déroulante des situations familiales accorde ses libellés en genre à partir du sexe saisi localement, parce qu'elle affiche des valeurs **non encore choisies**. Le libellé de la valeur enregistrée vient du serveur et n'est jamais recalculé.
   - **Exception 2** : le champ `message` de l'**aperçu d'impact avant suppression**. Seul le serveur sait si la ligne sera supprimée définitivement ou rendue inactive, et pourquoi. L'écran l'affiche **tel quel**.
   - **Précision du temps 2.b** : cette règle interdit qu'une phrase d'affichage **sorte de l'API**. Elle n'interdit pas à l'écran d'écrire la sienne. La fenêtre de suppression différée des comptes bancaires est **entièrement composée par l'écran** : elle ne relève d'aucune exception.
   - **Réciproque du temps 2.b** : un message technique du serveur (`Internal server error`) affiché tel quel à l'utilisateur est une **fuite**. Une réponse non métier se traduit par le message générique de l'application.
   - Les exceptions sont listées dans `docs/CONVENTIONS.md` **à l'intérieur de la règle elle-même**, pas dans une section séparée : une exception rangée loin de sa règle n'est jamais trouvée.
10. **Le français affiché porte ses accents et ses apostrophes typographiques ( ’ ).** La règle « minuscules, tirets, sans accent » vise **les noms de fichiers et de dossiers techniques**, jamais un texte lu par un humain. Un garde-fou (`francais-affiche.spec.ts`) refuse toute élision ASCII dans un littéral contenant un mot français. Frontière : **si un utilisateur le lit à l'écran, ça porte des accents ; sinon, non**.
11. **Un message d'interface est défini une seule fois.** `apps/back-office/src/lib/messages-interface.ts` porte `MESSAGE_ERREUR_GENERIQUE`. Un message recopié à deux endroits diverge tôt ou tard. *(Ajouté au temps 2.b.)*

---

## 5. Décisions transverses figées

- **Langue du code mixte** : technique en anglais, **termes métier réglementaires en français** (`salarie`, `emploi`, `bulletin`, `cotisation`, `etablissement`). `Company` reste en anglais (ADR 0005).
- **Mois de paie et mois d'effet** : `String` au format `AAAA-MM`, jamais `DateTime` (ADR 0006).
- **Identifiants légaux** en `String`, jamais en nombre, pour les zéros de tête.
- **Aucune valeur de remplacement** type « À compléter ». Un champ vide vaut mieux qu'une donnée fausse. Quand un référentiel ne fournit pas un seuil, l'alerte n'est simplement pas émise — jamais de seuil inventé. **Corollaire du temps 2.b** : une part de virement vide s'affiche vide, jamais « 100 % », même quand la règle métier le sous-entend. L'explication va dans une phrase d'aide, pas dans la donnée.
- **Vocabulaire des états** : « archivé » n'existe pas. Active / inactive / supprimée. **Le mot « état » désigne un état métier** : ne pas l'employer pour une mention d'écran passagère (« non enregistrée », « en erreur »). *Leçon du temps 2.b : une colonne « État » a été retirée pour cette raison.*
- **L'ordre d'un référentiel est porté par la DONNÉE**, jamais par un tri alphabétique, jamais par un tri d'écran. Un champ `ordre` dans la table. Vaut pour `Pays` (Maroc en tête) et pour `LienParente` (Enfant = 1, Conjoint = 2).
- **L'ordre des rubriques d'un écran est porté par une DÉCLARATION STABLE**, jamais par l'ordre d'inscription au registre. `apps/back-office/src/lib/fiche/ordre-rubriques-fiche-salarie.ts`. **Même famille de règle que l'ordre d'un référentiel.** *(Défaut réel corrigé au temps 2.b : le sommaire et l'ordre d'envoi se réordonnaient au premier clic.)*
- **Suppressions** : aperçu d'impact, puis `DELETE` avec jeton de confirmation en paramètre d'URL (`confirmationJeton`) ; refus `CONFIRMATION_OBSOLETE` (409) si le contexte a changé, `CONFIRMATION_REQUISE` (400) si le jeton manque. **Ce modèle ne vaut que pour les tableaux ligne à ligne** — voir §11.8.
- **Le jeton de confirmation ne porte que des FAITS**, jamais un texte d'affichage. Ligne de tableau : `{ salarieId, ligneId, mode }`. Société : les quantités. Fiche salarié : `{ id }`.
  - **Raison** : quand le message entrait dans le hash, corriger une virgule invalidait toutes les confirmations en cours.
  - **Conséquence assumée** : sur la **fiche salarié**, le jeton est constant dans le temps. Il prouve qu'un aperçu a eu lieu, **il ne garantit pas la fraîcheur**.
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

### 6.1 Ce que la lecture d'une fiche expose réellement

`GET /salaries/:id` rend une liste `operations` **à la racine de la fiche** (`donnees.operations`) et **sur chaque emploi** (`donnees.emplois[].operations`). **Jamais par rubrique ni par ligne de tableau.**

Racine, valeurs possibles aujourd'hui : `salarie.lire`, `salarie.modifier`, `salarie.supprimer`, `emploi.creer`, `salarie.remuneration.lire`, `salarie.remuneration.ecrire`.

Emploi : `emploi.modifier`, `emploi.supprimer`, `salarie.remuneration.lire`, `salarie.remuneration.ecrire`.

`salarie.remuneration.ecrire` est **indépendante** de `salarie.remuneration.lire` : l'écran peut donc traiter le cas « je vois mais je ne modifie pas » sans rien deviner.

Sans `salarie.remuneration.lire`, la clé `comptesBancaires` est **absente** de la réponse.

### 6.2 Le contrôle d'écriture sur la rémunération — corrigé au temps 2.b

**Ce qui était faux.** L'intercepteur de masquage inspectait les **clés du corps** de la requête via un registre. Seule la clé `comptesBancaires` y était enregistrée. Or le corps du `PUT /salaries/:id/comptes-bancaires` s'appelle `comptes`. **Un utilisateur ayant `salarie.modifier` mais pas `salarie.remuneration.ecrire` pouvait réécrire les comptes bancaires.** Découvert par un point d'arrêt, pas par un test.

**Ce qui a été fait.** Le contrôle a été placé **dans le service qui écrit les comptes bancaires** (`assert-ecriture-comptes-bancaires-salarie.ts`), pas sur la route. **ADR 0024.**

**Pourquoi pas un décorateur de route** : un décorateur protège la route qu'on a pensé à annoter. Un import, une modification en masse (module 6) ou l'écran de création écriraient dans les comptes bancaires **sans passer par cette route**, et la protection ne suivrait pas. Placé au service, le contrôle voyage avec la donnée.

**Ce qui n'a pas été touché** : l'intercepteur existant continue le masquage en lecture et le contrôle par clé de corps sur les PATCH. **Aucune clé `comptes` n'a été ajoutée au registre** — un nom aussi générique attraperait d'autres corps, ou n'en attraperait aucun si la forme change.

**Règle générale à appliquer aux prochains blocs à droits propres** : le contrôle se place au plus près de l'écriture, et un test doit prouver qu'il se déclenche **sur ce chemin précis** et **ne déborde pas** sur les chemins voisins.

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

> **Les comptes bancaires ne sont PAS historisés.** Confirmé par relevé au temps 2.b : le type `CompteBancaireSalarie` ne porte **aucun champ `etat`**. Pas de ligne inactive, pas d'aperçu d'impact, pas de mois de fin. Une suppression est physique.

**Règles de comportement :**
- **Le client n'écrit JAMAIS une version ni une date d'effet.** Le serveur décide seul d'écraser ou de versionner. Le front ne doit jamais savoir ce qui est historisé.
- **On écrase sans créer de version** tant qu'aucun bulletin n'existe pour le mois concerné.
- **Modifier un historique n'est jamais bloqué**, même si un bulletin validé existe. La correction déclenchera une régularisation.
- **Date d'effet** : déduite du mois en cours, **sauf la première version d'un bloc porté par un emploi**, qui prend le mois de la date de début de cet emploi.

**Mois de fin — deux règles distinctes :**
- **Suppression** d'une ligne utilisée par un bulletin : elle devient inactive, mois de fin = **mois en cours**.
- **Modification** d'une ligne avec bulletin existant : l'ancienne est close au **mois précédent**, la nouvelle démarre au **mois en cours**.

**Deux lectures d'une même ligne**, volontairement divergentes au mois de clôture : l'**état affiché** (inactive dès le mois de fin) et la **lisibilité pour un mois donné** (fin incluse). Conséquence : une personne à charge supprimée s'affiche inactive **tout en restant comptée** au mois en cours. C'est correct et figé par un test.

> Cette divergence **n'est pas expliquée à l'écran**, parce que le compteur de personnes à charge n'est pas affiché. Le sujet se rouvre le jour où ce compteur s'affiche, ou au module 4.

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

1. **Fiches** : société ✅, salariés ⏳ (API livrée ; socle, liste, identité et deux tableaux répétables livrés), organismes
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
**402 tests.** `indexLigne` sur `AlerteApi` ; `dateSortie` exposée à la racine ; type `FicheSalarie` unique dans `packages/shared-types`, avec l'alias **`EmploiFicheNonType`** à typer au temps 3.

### ✅ 2.1.c-2, temps 1 — Rubriques d'identité
**446 tests, 69 fichiers.** Quatre blocs réels ; deux routes de référentiel (`pays`, `situations-familiales`) ; temps 1-bis correctif ; restauration des accents dans 182 textes + garde-fou ; trois salariés de démonstration ; unicité du code banque ; trace des erreurs sur `stderr` ; `next build` ajouté à `pnpm verify`.

### ✅ 2.1.c-2, temps 2.a — Enveloppe des tableaux et personnes à charge
**483 tests, 73 fichiers.** Route `GET /referentiels/liens-parente` avec migration `ordre` ; client d'appel complété ; composant d'enveloppe générique ; rubrique Personnes à charge ; propagation de version après écriture hors séquence (**ADR 0022**) ; `CONVENTIONS.md` §13 ; correction du défilement du sommaire ; `.prettierignore`.

### ✅ 2.1.c-2, temps 2.b — Comptes bancaires
**525 tests, 76 fichiers.** Deux points d'arrêt, cinq passages correctifs, vérification visuelle. Contenu :

- **Rubrique Comptes bancaires** : tableau quatre colonnes, formulaire écrit à la main, PUT de la liste entière, alertes rattachées par position, suppression différée, masquage selon les droits.
- **Composant `ChampBanque`** générique (liste + saisie libre), sans connaissance du salarié, destiné à remplacer celui de la fiche société.
- **Correction d'une faille de permission réelle** sur le `PUT` des comptes bancaires — **ADR 0024**, §6.2.
- **ADR 0023** — PUT groupé : reprise intégrale du bloc en réponse et rattachement des alertes par position.
- **Enveloppe générique dépouillée de tout mode de suppression** : le tableau fournit le comportement, l'enveloppe le déclenche. La branche « aperçu serveur », sans appelant en production, a été supprimée.
- **Colonne « État » retirée** des deux tableaux ; les mentions d'état et d'erreur passent sous une colonne métier.
- **Trois défauts graves du temps 2.a corrigés** : saisie perdue avec message de succès, ordre des rubriques réordonné au premier clic, message technique du serveur affiché à l'utilisateur. Voir §13.
- `MESSAGE_ERREUR_GENERIQUE` factorisé dans `lib/messages-interface.ts`.

### ⏭️ Prochaine étape — 2.1.c-2, temps 2.c : prêts et saisies sur salaire

**Cadrage à faire.** Même famille que les personnes à charge : POST/PATCH/DELETE ligne à ligne, aperçu d'impact, jeton, lignes historisées avec état `INACTIVE`. Les deux tableaux ensemble.

L'enveloppe générique est désormais **sans mode de suppression** : ces deux tableaux fourniront chacun leur comportement, ce qui éprouvera la découpe retenue au temps 2.b.

Puis **temps 3** : écran de création, action « Supprimer le salarié » dans le rail, remplacement de `EmploiFicheNonType`, **avertissement de navigation**, généralisation du verrouillage pendant l'enregistrement.

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

- **Sommaire et rail restent visibles au défilement**, dans les deux sens.
- Le sommaire **fait défiler** jusqu'à la rubrique. Repliable complètement.
- **Le défilement est déclenché APRÈS le commit React**, jamais pendant.
- **L'ordre du sommaire vient d'une déclaration stable**, pas de l'ordre d'inscription au registre (§5).
- Les rubriques sont **empilées, toutes visibles, toujours éditables**. Pas de mode lecture.
- Le rail porte Enregistrer et Annuler en tête. **Repliable en colonne d'icônes**, qui restent cliquables avec infobulle.
- L'état replié/déplié est conservé pendant la session.
- La liste des salariés utilise le même squelette **sans la colonne de gauche**.

### 11.3 L'enregistrement — un seul bouton pour une API découpée

L'API modifie **par rubrique** : une rubrique = un appel. L'écran n'a **qu'un seul bouton Enregistrer**.

**Un registre des modifications** partagé par la page. Contrat d'une rubrique (`RubriqueEnregistrable`) : `id`, `libelle`, `estModifiee()`, `envoyer(version)`, **`reinitialiser()`**. Le socle ne connaît le contenu d'aucune rubrique.

Au clic : les rubriques modifiées sont envoyées **une par une, en séquence, dans l'ordre déclaré de la page**. Jamais en parallèle. **Cet ordre est celui de la déclaration stable, pas celui des inscriptions.**

**Le numéro de version circule.** Le verrouillage optimiste est porté par l'entité — `Salarie.version`, `Emploi.version` — pas par la rubrique. Chaque réponse réussie rend le **nouveau numéro**, que le socle propage aux rubriques restantes.

**Deux natures de refus, deux comportements :**

| Refus | Comportement |
|---|---|
| **Métier** (`400` avec code, `403` sans code) | on continue avec les rubriques suivantes ; la rubrique refusée garde sa saisie et affiche le message du serveur |
| **Conflit** (`409` `CONFLIT_VERSION`, `428` `EN_TETE_IF_MATCH_REQUIS`) | on **arrête immédiatement** ; les rubriques non envoyées restent modifiées sans message ; **un seul bandeau, au niveau de la fiche** |
| **Non métier** (`500` et assimilés) | message générique de l'application, **jamais le message du serveur** |

**Des tests protègent cette asymétrie — ne jamais les fusionner.** Il en existe trois : au niveau du socle, au niveau interne d'un tableau ligne à ligne, au niveau d'un tableau à PUT groupé.

**Après un conflit, un seul bouton : « Recharger les valeurs du serveur »**, qui prévient avant d'écraser la saisie. **Ni « Réessayer », ni « Enregistrer quand même », ni fusion.**

**Annuler** abandonne les modifications de toute la fiche, en **nommant les rubriques concernées**. Il appelle `reinitialiser()` sur **toutes** les rubriques et **ne provoque aucun appel serveur**.

`reinitialiser()` ramène aux valeurs du **dernier enregistrement réussi**, pas à celles du chargement de la page.

**Pendant l'enregistrement**, la rubrique Comptes bancaires devient non modifiable (champs, Ajouter, Supprimer). Les autres rubriques ne le sont pas encore — **point ouvert, à généraliser au temps 2.c ou 3**.

### 11.4 Ce que l'écran retient d'une réponse d'écriture — CRITIQUE

**Les routes POST, PATCH, PUT et DELETE des tableaux renvoient LA FICHE ENTIÈRE, relue en base.**

**Règle générale.** L'écran n'applique **jamais** la fiche en bloc. Il n'en retient que **deux choses** :
- le nouveau numéro de version ;
- la ligne portant l'identifiant concerné par l'appel.

Tout le reste est ignoré.

**Raison** : les autres rubriques peuvent porter une saisie non enregistrée. La fiche renvoyée contient les valeurs **en base**, donc les anciennes. L'appliquer en bloc écraserait la saisie en cours, **sans aucun message**.

**Pourquoi garder la ligne** : une suppression ne supprime pas toujours. Si la ligne a servi à un bulletin, elle revient avec l'état `INACTIVE` et un mois de fin, et l'écran doit l'afficher ainsi.

**Exception unique — le PUT groupé des comptes bancaires.** L'écran retient le **numéro de version** et **l'intégralité du bloc `comptesBancaires`**. Rien d'autre. Deux raisons : l'appel a réécrit toute la liste, il n'existe donc pas « une » ligne concernée ; et les lignes nouvellement créées n'ont d'identifiant que dans la réponse. **ADR 0023.** Consignée **à l'intérieur de cette règle** dans `CONVENTIONS.md`.

**Le piège n'est pas seulement dans l'application en bloc.** Défaut réel corrigé au temps 2.b : la rubrique respectait la règle et ne remontait que la version, mais la fonction qui appliquait ce fragment le fusionnait avec une **photo périmée** de la fiche. Résultat identique — une saisie perdue, avec un message de succès. **Toute mise à jour d'état doit partir de l'état courant, jamais d'une capture prise plus tôt.**

Trois tests protègent cette règle, dont un **au niveau de la page**, montant deux rubriques réelles.

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

Identité → Identifiants → Coordonnées → **Personnes à charge** → **Comptes bancaires** → Dates clés → **Prêts** → **Saisies**

**Chaque tableau est une entrée du sommaire.** L'ordre vient de `ordre-rubriques-fiche-salarie.ts`.

Les trois autres tableaux (primes contractuelles, avantages en nature, statuts particuliers) sont portés par l'**emploi** et relèvent de la 2.1.c-3.

### 11.7 Les tableaux répétables — comportement figé

**Le tableau reste un affichage en lecture seule.** Un clic sur une ligne ou sur « Ajouter » déplie le formulaire **juste en dessous, dans la page, sur toute la largeur, en disposition verticale.** Ni saisie dans les cellules, ni panneau latéral.

**Composant générique pour l'enveloppe seulement** — tableau, bouton Ajouter, dépliage, confirmation de suppression — **et un formulaire écrit à la main par tableau.** Pas de générateur de formulaire.

**L'enveloppe ne connaît aucun mode de suppression.** Elle reçoit du tableau appelant de quoi confirmer (`titre`, `corps`, `libelleConfirmer`, `libelleAnnuler`) et une fonction `onConfirmer(ligne)`. **Elle ne sait pas ce que fait ce callback, ni s'il émet un appel serveur.** Un test statique vérifie qu'aucun nom de tableau n'apparaît dans son fichier. *(Forme retenue au temps 2.b après suppression d'une énumération à deux modes dont l'une n'avait aucun appelant.)*

**Pas de colonne « État ».** L'enveloppe reçoit `idColonneMarque` et injecte sous la valeur métier de cette colonne les mentions : « non enregistrée », « inactive depuis MM/AAAA », « en erreur ». Colonne porteuse : **Prénom** pour les personnes à charge, **RIB** pour les comptes bancaires. Le style de ligne reste porté par la ligne entière (grisé pour inactive, italique pour non enregistrée, fond destructif pour en erreur).

**Un seul formulaire ouvert sur toute la page.** Ouvrir un formulaire referme celui qui l'était, **en conservant sa saisie**. Ce mécanisme vit au niveau de la page, pas du tableau.

**Deux boutons dans le formulaire déplié**, aucun appel serveur :
- « Valider la ligne » → replie, retient la saisie localement.
- « Annuler la ligne » → replie, restaure les valeurs d'avant l'ouverture.

**La photo des valeurs de référence est prise à la PREMIÈRE ouverture** d'une ligne et ne change plus jusqu'à Valider ou Annuler. Une fermeture automatique due à l'ouverture d'un autre formulaire ne la renouvelle pas.

**Le bouton Enregistrer global, quand un formulaire est ouvert**, vaut « Valider la ligne » implicite puis enregistre. Il ne refuse jamais au motif qu'une ligne semble incomplète : tous les contrôles sont côté serveur.

**Aucun tri côté écran.** Les lignes arrivent triées par le serveur. **Une ligne ajoutée non encore enregistrée s'affiche en dernier**, avec la mention « non enregistrée ».

**Les lignes inactives sont affichées** en grisé, avec la mention « inactive depuis MM/AAAA », sans filtre ni bascule. Elles se déplient **en lecture seule** : aucun champ modifiable, aucun bouton de suppression — **absents du DOM**, pas grisés.

**Un tableau est UNE SEULE rubrique** au regard du registre, pas une rubrique par ligne.

**Deux familles d'envoi :**

| Famille | Tableaux | `envoyer(version)` |
|---|---|---|
| **Ligne à ligne** | Personnes à charge, prêts, saisies | enchaîne en interne, en séquence : **modifications puis ajouts, chacun dans l'ordre d'affichage**. Le numéro rendu par chaque appel sert au suivant ; le dernier remonte au socle. |
| **PUT groupé** | Comptes bancaires | **un seul appel** portant la liste entière, dans l'ordre d'affichage, lignes nouvelles en dernier. |

**Refus 400 — ligne à ligne : on continue** avec les suivantes. La **première** ligne refusée voit son formulaire s'ouvrir ; les autres restent repliées mais **portent une marque visible**, et leur message serveur apparaît au dépliage. **Aucune alerte n'est perdue.**

**Refus 400 — PUT groupé : rien n'a été écrit** (prouvé côté API : validations bloquantes avant toute écriture, puis transaction). La saisie est intégralement conservée, la séquence continue avec les rubriques suivantes.

**Refus 409 : arrêt immédiat** de la séquence, remontée au socle, dans les deux familles.

### 11.7 bis Les alertes rattachées par position — PUT groupé

`indexLigne` est l'index dans le tableau **envoyé**, à partir de 0, **jamais dans l'affichage**.

- **L'écran conserve le tableau exactement tel qu'il vient de l'envoyer** et rattache les alertes par position dans celui-là.
- Alerte avec `indexLigne` **et** `champ` → sous ce champ, dans le formulaire de la ligne.
- Alerte **sans `champ` ni `indexLigne`** (typiquement : somme des parts ≠ 100 %) → **en tête de la rubrique**, aucun formulaire ouvert.
- Après un refus, **la première ligne portant une alerte ouvre son formulaire** ; les autres sont marquées.
- **Disparition, deux niveaux :** modifier une ligne efface **son** alerte ; **ajouter ou supprimer** une ligne efface **toutes** les alertes de la rubrique, parce que les positions ne veulent plus rien dire.
- **Pendant l'aller-retour, la rubrique est non modifiable.** Sans cela, une ligne ajoutée pendant l'appel décalerait les alertes.

### 11.8 Les suppressions dans les tableaux

**Enregistrement à deux vitesses, assumé :**

| | Ajout et modification | Suppression |
|---|---|---|
| Comptes bancaires | différés, via Enregistrer | **différée aussi** |
| Personnes à charge, prêts, saisies | différés, via Enregistrer | **immédiate**, avec aperçu et jeton |

**Ligne jamais enregistrée** (les deux familles) : retrait local immédiat, **sans confirmation, sans appel serveur**.

**Ligne déjà enregistrée — tableaux ligne à ligne :**
1. Appel de la route d'aperçu (GET, aucune version exigée).
2. Fenêtre de confirmation par-dessus la page :
   - **Titre** fourni par le tableau appelant, jamais codé en dur dans la fenêtre ;
   - le champ `message` du serveur, **tel quel** ;
   - « Cette suppression part tout de suite. Le bouton Annuler de la fiche ne reviendra pas dessus. » ;
   - si la rubrique porte des modifications non enregistrées : « Vos autres modifications de cette rubrique restent à enregistrer. » ;
   - boutons **« Supprimer »** et **« Garder la ligne »**.
3. DELETE avec jeton en paramètre d'URL et en-tête `If-Match`.
4. On applique §11.4, puis on propage la version (ADR 0022).

**Refus 409 `CONFIRMATION_OBSOLETE`** : l'écran **redemande l'aperçu** et réaffiche la fenêtre, précédée de « la situation a changé depuis l'affichage ». **Jamais de renvoi automatique du DELETE.**

**Pendant un aller-retour de suppression**, tous les boutons Supprimer du tableau sont **grisés**. Ici le grisé porte un état passager, pas un droit.

**Ligne déjà enregistrée — comptes bancaires (suppression différée) :**
- **Aucun appel serveur** : ni aperçu, ni DELETE, ni jeton.
- Fenêtre composée **entièrement par l'écran** :
  - titre : « Supprimer ce compte bancaire ? »
  - corps : « Cette ligne sera supprimée lors du prochain enregistrement. Le bouton Annuler de la fiche revient dessus. »
  - boutons « Supprimer » et « Garder la ligne ».
- **Les mots sont volontairement l'inverse** de ceux de l'autre famille. Deux effets différents doivent se dire différemment, sinon l'utilisateur apprend à ne plus lire.
- La ligne **disparaît immédiatement** du tableau, ni barrée ni grisée — le grisé est réservé aux lignes inactives renvoyées par le serveur.
- **Annuler** au niveau de la fiche la fait revenir.

### 11.9 Les comptes bancaires — décisions d'écran

- **Quatre colonnes** : Banque · RIB · Titulaire du compte · Part du virement. **IBAN et BIC n'apparaissent qu'au dépliage.**
- La colonne Part du virement affiche la valeur saisie, **et rien si elle est vide**. Jamais « 100 % ».
- Sous le champ Part du virement, une phrase fixe : « Avec un seul compte, la totalité du virement y est versée. Renseignez ce champ uniquement si vous répartissez le salaire sur plusieurs comptes. »
- **Champ Banque unique**, avec propositions au fil de la frappe et **saisie libre autorisée**. Composant `ChampBanque`, générique, sans connaissance du salarié.
- **Exclusivité `banqueId` / `banqueLibreSaisie`**, portée par la rubrique au moment de l'envoi, pas par le composant : valeur du référentiel → `banqueId` seul ; texte libre → `banqueLibreSaisie` seul ; champ vide → les deux à `null`. **Jamais les deux ensemble.** À l'affichage : libellé du référentiel si `banqueId`, sinon le texte libre.
- **Aucun masque, aucun formatage, aucune troncature** sur RIB, IBAN, BIC. Les formats sont contrôlés par le serveur.
- **Aucun pré-remplissage local de la banque** à partir des trois premiers chiffres du RIB. C'est un contrôle serveur : la banque arrive remplie **après** l'enregistrement.
- **`partVirement` est une chaîne décimale**, envoyée telle que tapée : aucune conversion, aucun arrondi, aucune complétion.
- **Comportement assumé** : deux comptes à 60 et 40, on supprime le second et on enregistre — le serveur force la part du compte restant à `null` et **la valeur se vide toute seule à l'écran**. C'est la règle métier. Ne pas compenser.

### 11.10 Les emplois — 2.1.c-3

**Accordéon : les emplois sont empilés sur la même page.** Un seul emploi → le sélecteur s'efface. Deux ou plus → les emplois clos sont repliés derrière « afficher les emplois terminés ».

### 11.11 La création d'un salarié — temps 3

L'écran de création affiche **toutes les rubriques d'identité**, pas un formulaire réduit. **Un salarié peut être créé sans aucun emploi.** Aucun tableau répétable : on enregistre, on arrive sur la fiche, on ajoute ensuite.

**Différence structurelle à traiter** : la création est **un seul appel** (`POST /salaries` accepte toute l'identité), alors que le registre envoie une rubrique par appel. Le registre devra savoir se comporter en deux modes.

### 11.12 La liste des salariés

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
PUT /salaries/:id/comptes-bancaires     corps : { comptes: [...] }
```

Remplace la **liste entière**. Pas de POST, pas de PATCH, pas de DELETE par ligne. **Aucune route d'aperçu.** La suppression se fait en renvoyant la liste sans la ligne.

### 12.1 Les comptes bancaires — faits vérifiés au temps 2.b

**Forme d'une ligne** (`CompteBancaireSalarie`, `packages/shared-types/src/salarie.ts`) :

| Rôle | Nom exact | Type |
|---|---|---|
| Identifiant | `id` | `Uuid` |
| Banque (référentiel) | `banqueId` | `Uuid \| null` |
| Banque (saisie libre) | `banqueLibreSaisie` | `string \| null` |
| RIB | `rib` | `string \| null` |
| IBAN | `iban` | `string \| null` |
| BIC | `bic` | `string \| null` |
| Titulaire | `titulaire` | `string \| null` |
| Part du virement | `partVirement` | `string \| null` |

**Il n'existe pas de champ `banque`** : deux champs, exclusifs à l'usage.
**Il n'existe pas de champ `etat`** : ce tableau n'est pas historisé.

**Le corps du PUT accepte** une liste **vide** (pas de `@ArrayMinSize`) et des lignes **sans `id`** (création).

**`partVirement`** est une **chaîne décimale** (`"60.00"`), convertie en `Decimal` côté serveur. Un seul compte : la validation ne contrôle rien et le serveur **force la valeur à `null`**. Deux comptes ou plus : `null` compte comme 0, la somme doit valoir **exactement 100**, sinon refus `400 PART_VIREMENT_INVALIDE`.

**Le PUT est tout ou rien.** Ordre du service : validation de la somme des parts → validation des RIB → **puis seulement** la transaction (`deleteMany` + `update`/`create`) → puis l'incrément de version. Prouvé par un test qui compte les lignes en base après un refus.

**Un RIB non numérique** produit `400 CARACTERE_NON_CONFORME` sur le champ `rib`. *(Il produisait un `500` avant le temps 2.b : l'erreur de validation n'était pas relayée. Corrigé.)*

**Contrôle de droit** : `assertEcritureComptesBancairesSalarie` en tête de `remplacerComptesBancaires`, dans le service (§6.2, ADR 0024).

### 12.2 Verrouillage optimiste et alertes

**Verrouillage optimiste** : toutes les écritures l'exigent, DELETE et PUT compris. En-tête `if-match`. La version est **toujours celle du SALARIÉ**, jamais celle de la ligne. **Chaque réponse réussie rend la fiche entière, version comprise** — voir §11.4 pour ce que l'écran en retient. L'aperçu (GET) n'exige aucune version.

**Aperçu d'impact** (tableaux ligne à ligne uniquement) rend :
```
{ donnees: { salarieId, ligneId, mode, message, jetonConfirmation } }
```
`mode` vaut `'supprimer'` ou `'inactiver'`. Le jeton est calculé sur `{ salarieId, ligneId, mode }` — les faits, jamais le message.

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

**Lignes inactives** : champ `etat` valant `'ACTIVE'` ou `'INACTIVE'` sur les lignes des **trois tableaux historisés** — jamais sur les comptes bancaires.

### 12.3 Le référentiel des banques

```
GET /referentiels/banques
```

Enveloppe **module 1** : `{ data: { items, total }, warnings }`. Contrôle de lecture par `referentiel.lire` dans le service, pas de `@RequiertPermission` sur le contrôleur.

Type `Banque` : `id`, `nom`, `ancienNom`, `codeBanque`, `couleur`.

**Pas de champ `ordre`** sur cette table : l'API trie par nom côté serveur. Aucun tri d'écran, donc la règle est respectée sur le fond, mais l'ordre n'est pas porté par la donnée — **point ouvert**, à traiter avec le remplissage des 21 codes de banque.

Client back-office : `listerBanques()`, consommé par la fiche société **et** par la fiche salarié.

---

## 13. Ce que les temps 2.a et 2.b ont appris — à ne pas réapprendre

**Un point d'arrêt trouve ce qu'aucun test ne cherche.** Le temps 2.b a découvert par ce moyen qu'un utilisateur sans droit d'écriture sur la rémunération pouvait réécrire les comptes bancaires. Aucun test n'aurait signalé l'absence d'un contrôle que personne n'avait pensé à écrire. **Faire relever les faits avant d'écrire le code.**

**Masquer à l'écran ne protège pas.** La rubrique était correctement masquée ; la route restait ouverte. Un masquage d'écran sans son pendant serveur est une illusion de sécurité.

**Un contrôle placé sur une route ne protège que cette route.** Le placer au plus près de la donnée. Un décorateur oublié sur un futur chemin d'import ou de modification en masse ne crie pas.

**Une saisie peut être perdue sans que la règle soit violée.** La rubrique respectait §11.4 et ne remontait que la version ; c'est la fonction qui appliquait ce fragment qui le fusionnait avec une **capture périmée** de la fiche. Même dégât, avec un message de succès. **Toute mise à jour d'état part de l'état courant.**

**Un test peut passer sans rien prouver — trois fois maintenant.** Au temps 2.b, le test censé couvrir §11.4 exerçait Identité + PATCH d'une ligne existante, jamais Coordonnées + POST d'une ligne nouvelle. Le chemin du navigateur n'était pas celui du test. **Vérifier quel chemin un test emprunte, pas seulement qu'il existe.**

**Un mécanisme sans appelant est une dette qui se prend pour un acquis.** L'enveloppe générique portait une branche « aperçu serveur » complète et testée, qu'aucune rubrique n'utilisait — la seule concernée gardait son propre dialogue. Le test correspondant avait été écrit pour ce temps, pour un chemin que personne n'empruntait. **Supprimé.**

**Une énumération de modes est le premier pas vers une condition sur le nom d'un tableau.** Au troisième tableau, on ajoute une valeur plutôt que d'injecter un comportement. Faire injecter le comportement dès le deuxième.

**Un ordre d'affichage peut être un ordre d'exécution.** Le sommaire se réordonnait au premier clic ; la même source alimentait l'ordre d'envoi des rubriques. Ce qui ressemblait à un défaut cosmétique en était un grave. **Toujours demander si un ordre visible commande autre chose.**

**Un message technique du serveur n'a rien à faire à l'écran.** `Internal server error` s'affichait en rouge à l'utilisateur. Deux défauts en un : le serveur plantait au lieu de refuser, et l'écran répétait sa réponse mot pour mot.

**Un rapport peut fabriquer une preuve.** Une sortie de `pnpm verify` reconstituée de mémoire annonçait « aucun cycle » sur **zéro fichier traité**.

**Cursor démonte ses propres tests, corrige les diagnostics erronés et déclare ses pansements — quand on le lui demande.** Au temps 2.b : il a écarté de lui-même la mauvaise option d'un choix à trois, corrigé une hypothèse fausse de Claude sur la cause d'un défaut, signalé qu'un composant n'était pas réutilisable, et écrit qu'une de ses corrections était « un pansement, pas l'architecture cible ». **C'est le comportement attendu — le lui dire.**

**Refuser une recommandation n'est pas refuser le raisonnement.** Sa proposition de décorateur était bien argumentée. Elle heurtait une règle gravée. **Donner la raison de principe, pas un avis.**

**Un défaut peut dormir plusieurs temps.** Le défilement du sommaire visait à côté depuis le temps 1. La perte de saisie et le réordonnancement dataient du temps 2.a.

**Une explication invérifiable n'est pas une explication.** Demander le `git diff --stat` et le commit concerné.

**Quand un comportement ne se teste pas honnêtement, le dire.** La charge bascule alors sur la vérification à l'œil, qui doit être listée explicitement.

**`pnpm verify` ne couvrait pas la compilation du front.** `next build` est désormais **en dernière position**.

**Un contrôle testé à la création peut manquer à la modification.**

**Une hypothèse n'est pas un diagnostic.**

**Trois tests instables, trois causes différentes, aucune n'était « la machine ».**

**Une erreur avalée coûte une soirée.** Le helper écrit sur `stderr`, jamais `console.*`.

**Un garde-fou qui crie à tort sera ignoré.**

**Une exemption ne s'allonge jamais.**

**Le principe d'étanchéité peut vider un mécanisme de sa substance.** Le jeton de suppression de fiche ne compare rien.

**Une exception rangée loin de sa règle n'est jamais trouvée.**

**Les tests ne voient pas l'écran. Neuf défauts réels trouvés à l'œil à ce jour.**

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

> **Le nombre de personnes à charge n'est PAS affiché à l'écran au temps 2.** Il est calculé au chargement et deviendrait faux après un ajout. **Ne jamais recharger la fiche automatiquement pour le rafraîchir.**

### Trois unicités, toutes par société

Matricule (toujours) · numéro de pièce d'identité (si renseigné) · numéro CNSS (si renseigné). **Aucun contrôle ne traverse la frontière d'une société**, y compris entre sociétés d'un même cabinet.

**Un matricule attribué n'est jamais réattribué**, même après suppression (ADR 0019).

### Les comptes bancaires — règles métier

- **Un virement peut être réparti sur plusieurs comptes** (R9, Y3).
- **Un seul compte = 100 % implicite**, aucun contrôle. **Plusieurs comptes : la somme doit valoir exactement 100 %, sinon blocage** (E6, B6, C23). La répartition s'applique à **chaque bulletin séparément** : deux emplois = deux bulletins = deux virements, chacun réparti selon les mêmes pourcentages.
- **Alerte non bloquante « RIB partagé »** si le même RIB existe déjà dans la société (C12). Cas légitime : deux membres d'une même famille. Aucune alerte entre sociétés.
- **Formats** : RIB 24 caractères, IBAN 28 avec préfixe MA, BIC 8 ou 11 (C13). Alertes, pas blocages — sauf caractère non conforme, qui est un refus.
- **Le code d'une banque** est constitué des trois premiers chiffres du RIB : c'est l'**identifiant Bank Al-Maghrib**. Contrainte d'unicité en base, champ nullable, résolution par `findUnique`. **Les 21 codes du référentiel sont vides**, donc le pré-remplissage est **inerte en production**.
- **L'emploi désignera le compte à créditer** quand le mode de paiement est le virement (2.1.c-3). Conséquence assumée au temps 2.b : rien n'empêche de supprimer un compte qu'un emploi désignera.

### Une donnée sensible

`situationHandicap` sur les personnes à charge, **visible seulement pour un enfant**. Marquée `sensible`, sans droits propres à ce stade. Quand le lien passe à Conjoint, la case est **absente du DOM** et sa valeur est **conservée** (règle A0).

### Une exception : TAHFIZ

Exonération **portée par la société**, pas un statut saisi salarié par salarié. Son activation propage le statut à tous les salariés **ayant un emploi ouvert**, existants et futurs — jamais aux salariés sortis.

Au **retrait** : ligne jamais utilisée par un bulletin → supprimée ; ligne déjà utilisée → inactivée avec un mois de fin.

Une ligne propagée est en **lecture seule** depuis la fiche salarié. **`operations` n'existe pas au niveau ligne** — il faudra un autre signal (voir §6.1).

---

## 15. Points ouverts

| Réf | Sujet | État |
|---|---|---|
| — | Béquilles de dev `x-paymarh-user-id`, `NEXT_PUBLIC_PAYMARH_USER_ID`, `x-paymarh-permissions-refusees` | **bloquent la mise en production** |
| — | **Béquille des permissions refusées prouvée sur une route sonde uniquement** | à refermer au module d'authentification |
| — | **Les tests d'intégration partagent la base du serveur de développement.** Toute saisie manuelle sur les salariés de démonstration fait échouer `pnpm verify` (test S3). Remède : **`pnpm db:reset` PUIS `pnpm db:seed`** — `db:reset` vide sans rejouer le seed, et `db:seed` seul n'efface pas les lignes existantes. Solution de fond : base dédiée aux tests (`DATABASE_URL` distincte) ou base éphémère | hors module 2 |
| — | **Verrouillage pendant l'enregistrement limité aux comptes bancaires.** Les autres rubriques restent modifiables pendant l'aller-retour | temps 2.c ou 3 |
| — | **Migrer la suppression avec aperçu des personnes à charge vers l'enveloppe**, par injection d'un dialogue et non par un mode | temps 2.c ou 3 |
| — | **Champ Banque de la fiche société à aligner** sur celui de la fiche salarié : la société affiche deux champs séparés, le salarié un champ unique. `ChampBanque` est écrit pour pouvoir remplacer l'ancien | rattaché à Z14 |
| — | **`couleur` sur la table `Banque`** : obligatoire en base, déclarée pouvant être vide dans le type partagé. L'un des deux ment | prochain passage sur les référentiels |
| — | **Pas de champ `ordre` sur `Banque`** : l'API trie par nom. Aucun tri d'écran, mais l'ordre n'est pas porté par la donnée | avec le remplissage des codes (X3) |
| — | **Avertissement de navigation partiel.** Seuls la fermeture d'onglet et le lien de retour sont couverts. Next.js 16 n'offre pas de garde au niveau du routeur. **La solution devra être une contrainte outillée** (règle de lint interdisant le lien standard dans la zone de la fiche) | **temps 3** |
| — | **« Cette fiche est ouverte ailleurs »** : écarté au temps 2 — le serveur ne sait pas qui a une fiche ouverte, et sans authentification on ne peut pas nommer l'autre utilisateur | après le module d'authentification |
| — | **`ordre Int @unique` sur `LienParente`** : plus strict que sur `Pays` | à revoir si la liste s'allonge |
| — | **`operations` n'existe pas au niveau ligne de tableau.** Les lignes de statut particulier propagées par la société devront s'appuyer sur un autre signal | 2.1.c-3 |
| — | **Suppression d'un compte bancaire désigné par un emploi** : rien ne l'empêche aujourd'hui | 2.1.c-3 |
| — | **Personne à charge inactive encore comptée** : plus de contradiction à l'écran tant que le compteur n'est pas affiché | module 4 |
| — | **Ligne inactive non vérifiable à l'œil** tant que les bulletins n'existent pas : couverte par test avec une ligne fabriquée | module 4 |
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
| Z14 | Trois retouches sur la fiche société v7, **plus** l'AuditLog du module 1 sans `accountId` ni `companyId`, **plus** le champ Banque | prochain passage sur le module 1 |
| Z6 | Faire confirmer par la CNSS et la DGI la consolidation en une ligne par salarié | vérification métier |
| Z9 | Référentiels service et département | autre module |
| Y7 | Console d'administration du référentiel | modules 4 et 5 |
| — | Date de sortie **hors intervalle** : alerte et confirmation devraient coexister, non testé | 2.1.c-3 |
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
- **Voir le rendu en local — procédure complète, trois commandes** :
  1. `pnpm db:up`
  2. `pnpm --filter api dev`
  3. `pnpm --filter back-office dev`
  puis `http://localhost:3000`.
  **Ne jamais donner une procédure amputée sans dire quelle étape est déjà satisfaite.**
- **Après une migration ou un changement de seed, rejouer le seed** avant toute vérification visuelle.
- **Après une vérification visuelle sur les salariés de démonstration**, la base contient des lignes saisies à la main qui font échouer `pnpm verify`. Remède avant de relancer la vérification : **`pnpm db:reset` puis `pnpm db:seed`**. `db:reset` demande une confirmation (`y`) et **ne rejoue pas le seed**.
- **`pnpm db:reset` change l'identifiant utilisateur de développement.** Le back-office affiche alors « Impossible de charger les sociétés ». Reporter la nouvelle valeur de `NEXT_PUBLIC_PAYMARH_USER_ID`, affichée par `pnpm db:seed`, dans `apps/back-office/.env`, puis **arrêter et relancer** le back-office : **Next ne relit pas ce fichier à chaud.**
- **Le seed crée trois salariés de démonstration** dans la société DEMO-001 : un complet et actif (Youssef Bennani — deux personnes à charge, deux comptes bancaires, un prêt), un minimal sans emploi, une salariée sortie de nationalité étrangère.
- **Quand un écran refuse de s'afficher**, la vraie erreur est dans le **terminal du back-office** — le helper de trace y écrit sur `stderr`.
- **Environnement PowerShell** : `curl` est un alias — utiliser `curl.exe` ou `Invoke-RestMethod`. `rmdir /s /q` n'existe pas — utiliser `Remove-Item -Recurse -Force`. **Les chemins contenant des crochets doivent être entre guillemets** dans un `git add`.
- **Commit manuel** : `git add <chemins>` → **`git status --short` pour vérifier ce qui est indexé** → `git commit -m "..."` → `git push`. `next-env.d.ts` est généré par Next et ne doit jamais être commité dans un commit fonctionnel.

---

## 17. Rappels de méthode

- Claude **cadre et décide avec le porteur d'abord**, puis fournit **un prompt Cursor complet** par temps.
- Le prompt Cursor doit toujours : donner le contexte, **lister les fichiers à lire avant d'écrire**, rappeler le socle à réutiliser, délimiter le périmètre strict (à faire / à NE PAS faire), lister les `.md` à créer, poser des **critères d'acceptation vérifiables par un non-codeur**, exiger la **liste nominale des tests avec fichier et numéro de ligne**, exiger la section **« Décisions prises seul »**, exiger la section **« Ce que je n'ai pas pu tester honnêtement »**, exiger la **sortie brute de `pnpm verify`**, exiger une **preuve d'échec** pour tout test de non-régression, et demander à Cursor de **s'arrêter et poser la question** si un choix n'est pas couvert.
- **Ouvrir le prompt par un point d'arrêt** dès qu'une décision dépend d'un fait du dépôt (§2.3).
- **Le critère d'acceptation technique est `pnpm verify` vert chez le porteur.**
- **Après chaque temps livré : vérification visuelle à l'écran**, avec une liste de points numérotés fournie par Claude. **Les points qui portent la raison d'être du temps doivent être signalés comme tels.**
- Exiger que Cursor **propose toute dépendance avant installation**.
- Ne jamais introduire de logique métier hors du module en cours.
- **Vérifier systématiquement les rapports de Cursor** : arithmétique des tests, tests annoncés contre tests exigés, contrôles déclenchables contre contrôles théoriques, **mécanismes sans appelant**, contraintes de production contre confort de test, fichiers hors périmètre modifiés, sortie brute contre résumé, **tests qui prouvent réellement ce qu'ils annoncent**.
- **Quand Cursor s'arrête et pose une question, c'est le comportement attendu** — le lui dire. Quand il démonte son propre test, corrige un diagnostic erroné ou déclare qu'une correction est un pansement, aussi.
- **Claude signale au porteur quand ouvrir une nouvelle conversation** est optimal, et fournit ce document mis à jour à ce moment-là.
- **Claude indique le modèle et l'effort à paramétrer à la fin de CHAQUE message, sans exception** (voir §2.1).
