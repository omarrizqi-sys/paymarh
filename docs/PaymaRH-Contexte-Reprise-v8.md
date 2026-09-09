# PaymaRH — Document de contexte (reprise de conversation)

> **Comment m'en servir :** téléverse ce fichier au début d'une nouvelle conversation avec Claude, avec le message d'ouverture fourni à part.
>
> **Version :** remplace intégralement la v7. Dernière mise à jour : fin du **temps 2.c de la sous-étape 2.1.c-2** (rubriques Prêts et Saisies sur salaire livrées, vérifiées à l'écran, commitées, poussées). **566 tests, 83 fichiers, `pnpm verify` vert, arbre propre.**

---

## 1. Le projet

**PaymaRH** — logiciel de paie marocain pour le **secteur privé**, distribué en **SaaS multi-société**.

Objectif : générer des **bulletins de paie** et des **déclarations sociales et fiscales** conformes à la législation marocaine, plus une couche SIRH liée à la paie.

Deux publics : **entreprises** qui gèrent leurs propres salariés, **cabinets** qui gèrent plusieurs sociétés clientes.

Déclarations visées : **CNSS**, **AMO**, **SIMPL-IR**.

> **Nom commercial.** La marque **Adrim** a été retenue pour remplacer PaymaRH, sous réserve des vérifications OMPIC et des noms de domaine. **Le renommage n'est PAS appliqué** : le dépôt, le code, les fichiers de spécification et ce document parlent de PaymaRH. Ne rien renommer sans instruction explicite.

> ⚠️ **Ne pas confondre avec PayloRH**, marque française d'externalisation de paie, entité totalement distincte.

> ⚠️ **Ne jamais transposer le droit français.** Le porteur maîtrise les deux droits et corrige systématiquement. En cas de doute sur une règle marocaine, **poser la question plutôt que supposer**. Pièges déjà rencontrés : le CDI intérimaire et le contrat à objet défini sont des notions françaises ; le barème kilométrique marocain est celui de la CNSS, distinct de celui de la DGI ; il n'existe ni contrat d'apprentissage ni contrat d'insertion au Maroc ; les conventions collectives n'ont pas la même portée. **Cas du temps 2.c** : le montant prélevé au titre d'une saisie à tiers détenteur dépend de la **quotité saisissable de l'article 387 du code du travail marocain**. Claude ne connaît pas cette règle et ne l'a pas inventée — le porteur l'a apportée, et elle a modifié la spécification.

---

## 2. Profil du porteur et méthode

- Le porteur est **expert paie**, sans background technique. Il ne code pas.
- **Claude sert à réfléchir, cadrer et décider. Cursor sert à développer.**
- Ordre invariable : **on cadre ensemble d'abord** (Claude pose des questions numérotées, le porteur tranche), **puis** Claude rédige le prompt Cursor.
- Le porteur répond **par numéro**. Numéroter les questions et les regrouper par thème.
- **Écrire pour un non-développeur.** Les questions de cadrage doivent partir d'une situation concrète à l'écran, pas d'un mécanisme technique. **Si une question ne peut pas s'expliquer par « voilà ce que l'utilisateur fait, voilà ce qui se passe », elle est mal posée.**
- Sorties **complètes et prêtes à copier-coller**. Pas d'esquisse partielle.
- Claude accompagne chaque question d'une **recommandation motivée**, pour que le porteur puisse valider par un simple « ok ».
- **Quand Claude n'a pas la connaissance métier, il le dit et ne recommande rien.** Cas du temps 2.c : trois questions sur le droit des saisies ont été posées sans recommandation, en demandant une réponse binaire. C'est la bonne conduite, à reproduire.
- **Vérifier que toutes les questions ont été tranchées** avant de rédiger le prompt. Deux cas vécus : une question sautée au temps 2.b, et au temps 2.c un « ok » posé sur une question **sans recommandation**, donc sans branche désignée. **Signaler l'omission ou l'ambiguïté, ne jamais la combler en silence.** Quand Claude applique sa recommandation par défaut, il l'écrit.
- Il conteste et corrige quand c'est nécessaire — **c'est un signal fiable**, ne pas le contourner.
- Quand un point est trop technique, il le dit et on le reporte. Ne pas insister.
- À chaque module validé, produire **un article de base de connaissance** (manuel utilisateur), rédigé par Cursor à partir de ses notes.

### 2.1 Modèle et effort — règle absolue

**Claude indique à la fin de CHAQUE message quel modèle (Sonnet ou Opus) et quel effort de réflexion (faible, moyen, élevé) paramétrer pour le message suivant.**

**Sans exception aucune** : messages courts, instructions git d'une ligne, confirmations, corrections de commande. L'oubli est arrivé au temps 2.b et le porteur l'a relevé. Il n'y a pas de message « trop court » pour cette mention.

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
- **Ne jamais donner une procédure amputée sans le dire.** Donner la procédure complète, ou dire explicitement quelle étape est déjà faite et pourquoi.
- **`pnpm verify` est le seul critère d'acceptation technique.** Ne jamais écrire « lint vert et test vert ».
- **Docker fonctionne chez Cursor.** Il peut lancer `pnpm verify` en entier. **Cela ne change rien à l'acceptation** : ses résultats ne valent pas acceptation, c'est le porteur qui lance la commande. *Cas du temps 2.c : Cursor a rendu un `pnpm verify` vert alors que trois fichiers échouaient au contrôle de formatage chez le porteur.*
- **Exiger la SORTIE BRUTE de `pnpm verify`, collée depuis le terminal, jamais un résumé.** Une sortie reconstituée de mémoire a déjà annoncé « aucun cycle » sur **zéro fichier traité**. **Interdire explicitement la redirection dans un fichier** : au temps 2.c, Cursor a laissé trois `verify-*.txt` dans l'arbre et rendu une sortie tronquée par des points de suspension. **Écrire dans le prompt : « c'est moi qui juge ce qui est attendu dans cette sortie ».**
- **Toujours vérifier le rapport de Cursor contre le prompt.** Le motif est constant : le code est écrit, la preuve manque.
- **Vérifier l'arithmétique des tests à chaque livraison.** Total avant, total après, nombre annoncé : les trois doivent se réconcilier. *Nuances vécues : les totaux peuvent être justes alors que la phrase qui les explique est fausse ; un déplacement de tests d'un fichier à un autre n'est pas « 0 retiré » ; un test créé sans identifiant, glissé en note de bas de page, ne doit pas être accepté.*
- **Exiger fichier ET numéro de ligne pour chaque test de la liste nominale.** *Au temps 2.c, Cursor a répondu par la commande permettant d'obtenir la liste. Ce n'est pas la liste. Préciser « la liste, pas la commande » et borner la demande aux tests touchés par le prompt.*
- **Un identifiant ne désigne qu'un seul test.** Deux tests nommés T22 sont apparus au temps 2.c. **Un nom qui en désigne deux est un doute à lever.**
- **Exiger la section « Décisions prises seul » dans chaque rapport.** Quand elle disparaît, la redemander. Quand elle est vide, exiger qu'il l'écrive. **C'est la section la plus rentable du rapport** : au temps 2.c, elle a révélé une inférence déguisée et un trou de test.
- **Un test qui passe sans exercer le défaut qu'il prétend couvrir est un échec, pas un test.** Exiger une **preuve d'échec**. **Et vérifier sur quel chemin porte la preuve** : au temps 2.c, la preuve du critère le plus important a été fournie sur un test préexistant exerçant l'ancien chemin, alors que le test du nouveau chemin venait d'être écrit.
- **Se méfier des contrôles qui ne se déclenchent jamais.** Cas du temps 2.c : le contrôle C17 comparait deux montants qui ne coexistent plus jamais sur une même ligne. Retiré, avec son code et son test.
- **Se méfier des décorateurs et des exemptions.** **Un contrôle de droit se place au plus près de la donnée, jamais sur une route.**
- **Ne jamais relâcher une contrainte de production pour faire passer un test.**
- **Distinguer relâchement et adaptation mécanique.** Ajouter une prop nouvelle et obligatoire aux appels d'un composant dans un fichier de test est une adaptation légitime, à déclarer et justifier.
- **Un test qui passe une fois sur deux ne prouve rien.**
- **Un nom de test qui contredit une règle est un doute à lever.**
- **Quand un mécanisme dépend d'un port provisoire, exiger que les tests doublent ce port.**
- **Un test ignoré n'est pas un test réussi.**
- **Un mécanisme de test ne doit jamais vivre dans le code de production**, et **le code de test ne doit jamais piloter l'environnement**.
- **Demander systématiquement pourquoi un fichier hors périmètre a été modifié**, et exiger une explication vérifiable (`git diff --stat` et le commit concerné).
- **Vérifier ce qui est indexé avant de commiter.** `git status --short` avant `git commit`. `next-env.d.ts` réapparaît à chaque `next build` : le retirer par `git checkout --` avant chaque commit.
- **Exiger la cause avant la correction. Une hypothèse n'est pas un diagnostic.** *Au temps 2.c, exiger la preuve a fait tomber la bonne cause : le seed n'écrivait pas d'état inactif, c'est l'écran qui lisait mal.*
- **Quand un comportement ne peut pas être testé honnêtement, préférer l'aveu au faux test.** **La charge bascule alors sur la vérification à l'œil, qui doit être explicitement listée.**
- **Quand Cursor recommande une solution qui heurte une règle gravée, refuser la recommandation, pas le raisonnement.** **Donner la raison de principe, pas un avis.**
- **Quand Cursor corrige le prompt de Claude, il a souvent raison.** Au temps 2.c, le prompt nommait un champ `typeSaisieId` tout en exigeant l'alignement sur un référentiel existant qui utilise un code. Cursor a suivi l'instruction de principe contre l'instruction littérale, et l'a déclaré. **C'est le comportement attendu.**
- **Une correction acceptée peut n'être qu'un masque.** Au temps 2.c, la correction du champ `etat` est juste côté écran mais laisse une ambiguïté côté API. **Accepter, et inscrire le point ouvert explicitement — jamais laisser une dette silencieuse.**
- Découper chaque sous-étape en **temps successifs, avec arrêt entre chacun**. **Et découper un temps en plusieurs prompts quand il mélange des natures de travail différentes** : le temps 2.c a été découpé en 2.c-0 (API et base), 2.c-1 (socle d'écran), 2.c-2 (écrans neufs). Mélanger une migration de base et un refactor d'écran dans un même rapport, c'est se priver de savoir qui a cassé quoi.
- **Fil Cursor neuf par prompt.** Les prompts correctifs restent dans le fil du prompt concerné. Un **point d'arrêt** et sa suite restent dans le même fil.
- **Modèles Cursor** : Composer 2.5 pour le développement courant, Opus 5 pour l'architecture, les migrations de base et les types partagés.
- **Séparer les commits de nature différente** — sauf quand un même fichier est touché par deux temps.
- **La vérification visuelle est une étape à part entière**, pas un bonus. Les tests couvrent la mécanique ; ils ne disent rien de ce que l'écran donne à voir. **Onze défauts réels trouvés à l'œil à ce jour, tous avec une suite de tests verte.**
- **Après une correction trouvée à l'œil, refaire une vérification à l'œil.** Les corrections d'affichage se prouvent où le défaut a été vu.

### 2.3 Le point d'arrêt préalable

Quand un prompt dépend de faits que Claude ne peut pas vérifier (une route existe-t-elle, un champ est-il présent, une écriture est-elle atomique), **le prompt commence par une section « point d'arrêt »** : Cursor relève les faits, avec fichiers et numéros de ligne, **puis s'arrête sans écrire de code**.

Bilan cumulé : trois points d'arrêt, une vingtaine de faits relevés, dont **plusieurs ont changé le cadrage** — une **faille de sécurité réelle** au temps 2.b, et au temps 2.c la découverte que la spécification décidée avec le porteur contredisait sur cinq points l'API déjà livrée. **Sans ce relevé, le temps 2.c aurait été cadré comme un temps d'écran et se serait écrasé sur une API incompatible.**

Règles :
- **N'écris pas de code, ne crée pas de fichier** doit être écrit explicitement.
- Exiger **fichier et numéro de ligne** pour chaque fait.
- Exiger une **preuve par le code** pour tout fait comportemental.
- **Lire la suite du prompt ne vaut pas autorisation d'écrire.**
- Accepter **« NON PROUVÉ »** comme réponse : c'est mieux qu'une supposition présentée comme un fait.

### 2.4 Reprendre des faits d'un point d'arrêt précédent

Quand un prompt suit un point d'arrêt déjà exploité, **ne pas en refaire un**. Rappeler les faits en tête de prompt sous la forme : *« N faits que j'affirme. Si l'un est faux, arrête-toi et dis-le. »*

Pratique validée aux prompts 2.c-1 et 2.c-2. Coût nul, et Cursor a confirmé les faits avant d'écrire à chaque fois.

**Attention** : un fait relevé peut être **périmé par un prompt intermédiaire**. Les faits sur les saisies relevés au point d'arrêt du temps 2.c ont été entièrement réécrits par le prompt 2.c-0.

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
   - **Corollaire écran** : une action ou une rubrique que l'utilisateur n'a pas le droit d'exercer ou de voir est **absente du DOM**. Jamais grisée, jamais masquée en CSS. **Le grisé reste légitime pour un état sans rapport avec les droits** — Enregistrer inactif tant que rien n'a changé, ligne inactive dans un tableau, bouton Supprimer grisé pendant un aller-retour serveur, **rubrique non modifiable pendant l'enregistrement**, **bouton Enregistrer inactif pendant une suppression**.
   - **Corollaire données** : `operations` est une **liste de ce que l'utilisateur peut faire**. Jamais un objet du type `{ supprimer: false }`.
   - **Corollaire API** : une clé masquée est **absente** de la réponse, jamais `null`. Le type partagé les déclare donc **optionnelles**, jamais nullables.
   - **Corollaire écran** : l'écran doit distinguer **clé absente** (pas le droit de voir → rubrique absente du DOM et du sommaire) et **liste vide** (le salarié n'a rien → rubrique affichée, tableau vide).
   - **Corollaire sécurité** : **masquer une rubrique à l'écran ne protège rien** tant que la route d'écriture reste ouverte. Tout masquage d'écran doit avoir son contrôle côté serveur, prouvé par un test qui échoue sans lui.
   - **Extension du temps 2.c** : un champ **sans objet pour la forme de donnée en cours** est également **absent du DOM**, pas grisé. Ce n'est pas une question de droit, mais le traitement est le même : ce qui n'a pas lieu d'être n'est pas montré. Cas : le montant total sur une pension alimentaire.
8. **Tout calcul et tout contrôle côté serveur** — le front n'en rejoue aucun. Deux exceptions documentées (ADR 0009) : confort de saisie, affichage conditionnel.
   - **Précision du temps 2.c** : quand le serveur abandonne silencieusement une donnée devenue incompatible, **l'écran prévient sans juger**. Il ne décide pas ce qui est compatible ; il dit ce qu'il voit disparaître de sa propre saisie. La règle reste au serveur, l'avertissement à l'écran.
9. **Aucune chaîne destinée à l'affichage ne sort de l'API.** L'API rend des données, l'écran compose les phrases.
   - **Exception 1** : la liste déroulante des situations familiales accorde ses libellés en genre à partir du sexe saisi localement, parce qu'elle affiche des valeurs **non encore choisies**. Le libellé de la valeur enregistrée vient du serveur et n'est jamais recalculé.
   - **Exception 2** : le champ `message` de l'**aperçu d'impact avant suppression**. Seul le serveur sait si la ligne sera supprimée définitivement ou rendue inactive, et pourquoi. L'écran l'affiche **tel quel**.
   - Cette règle interdit qu'une phrase d'affichage **sorte de l'API**. Elle n'interdit pas à l'écran d'écrire la sienne.
   - **Réciproque** : un message technique du serveur (`Internal server error`) affiché tel quel à l'utilisateur est une **fuite**. Une réponse non métier se traduit par le message générique de l'application.
   - Les exceptions sont listées dans `docs/CONVENTIONS.md` **à l'intérieur de la règle elle-même**, pas dans une section séparée.
10. **Le français affiché porte ses accents et ses apostrophes typographiques ( ’ ).** La règle « minuscules, tirets, sans accent » vise **les noms de fichiers et de dossiers techniques**, jamais un texte lu par un humain. Un garde-fou (`francais-affiche.spec.ts`) refuse toute élision ASCII dans un littéral contenant un mot français.
11. **Un message d'interface est défini une seule fois.** `apps/back-office/src/lib/messages-interface.ts` porte `MESSAGE_ERREUR_GENERIQUE`.
12. **Un comportement s'injecte, il ne se déduit jamais de la forme des données.** *(Ajouté au temps 2.c.)* Un composant générique qui devine à quelle famille il a affaire en regardant si un champ est présent ou absent a réintroduit une condition sur le nom du tableau, par un autre chemin. La variante doit être **déclarée explicitement** par l'appelant. Cas réel : le dialogue de suppression décidait sa structure et l'état de son bouton selon la présence d'un message serveur.

---

## 5. Décisions transverses figées

- **Langue du code mixte** : technique en anglais, **termes métier réglementaires en français** (`salarie`, `emploi`, `bulletin`, `cotisation`, `etablissement`). `Company` reste en anglais (ADR 0005).
- **Mois de paie et mois d'effet** : `String` au format `AAAA-MM`, jamais `DateTime` (ADR 0006). **Vaut aussi pour les mois métier saisis par l'utilisateur** (mois de début de prélèvement, mois de fin d'une pension).
- **Identifiants légaux** en `String`, jamais en nombre, pour les zéros de tête.
- **Aucune valeur de remplacement** type « À compléter ». Un champ vide vaut mieux qu'une donnée fausse. Quand un référentiel ne fournit pas un seuil, l'alerte n'est simplement pas émise — jamais de seuil inventé. **Corollaires** : une part de virement vide s'affiche vide, jamais « 100 % » ; un mois de fin vide s'affiche vide, jamais « en cours » ; **un solde restant devenu douteux s'affiche vide, jamais périmé**. L'explication va dans une phrase d'aide, pas dans la donnée.
- **Vocabulaire des états** : « archivé » n'existe pas. Active / inactive / supprimée. **Le mot « état » désigne un état métier** : ne pas l'employer pour une mention d'écran passagère.
- **L'ordre d'un référentiel est porté par la DONNÉE**, jamais par un tri alphabétique, jamais par un tri d'écran. Un champ `ordre` dans la table. Vaut pour `Pays` (Maroc en tête), `LienParente` (Enfant = 1, Conjoint = 2) et `TypeSaisieSurSalaire` (Pension alimentaire = 1, Saisie à tiers détenteur = 2).
- **Un référentiel simple se réfère par son CODE, pas par un identifiant technique.** Modèle : `lienParenteCode`, `typeSaisieCode`. *(Fixé au temps 2.c : le prompt disait `typeSaisieId`, Cursor a suivi l'alignement demandé sur l'existant et eu raison.)*
- **L'ordre des rubriques d'un écran est porté par une DÉCLARATION STABLE**, jamais par l'ordre d'inscription au registre. `apps/back-office/src/lib/fiche/ordre-rubriques-fiche-salarie.ts`. **Même famille de règle que l'ordre d'un référentiel.** Cette déclaration commande **le sommaire ET l'ordre d'envoi**.
- **Suppressions** : aperçu d'impact, puis `DELETE` avec jeton de confirmation en paramètre d'URL (`confirmationJeton`) ; refus `CONFIRMATION_OBSOLETE` (409) si le contexte a changé, `CONFIRMATION_REQUISE` (400) si le jeton manque. **Ce modèle ne vaut que pour les tableaux ligne à ligne** — voir §11.8.
- **Le jeton de confirmation ne porte que des FAITS**, jamais un texte d'affichage. Ligne de tableau : `{ salarieId, ligneId, mode }`. Fiche salarié : `{ id }`.
- **Dossiers et fichiers techniques** : minuscules, tirets, sans accent.
- **Base de connaissance** : `/base-de-connaissance`, un article Markdown par sujet, front-matter SEO. **Les articles sont rédigés par Cursor**, à partir de `docs/notes-base-de-connaissance-salarie.md`, sur un prompt écrit par Claude. Le porteur relit.
- **Deux enveloppes de réponse coexistent volontairement** : le module 1 rend `{ data, warnings }`, le module 2 rend `{ donnees, alertes }`. **Deux clients API distincts, jamais un client générique.** ADR 0021.
- **TanStack Table** : réservé au module 1. Dans le module 2, une table qui ne trie ni ne pagine côté client utilise directement `shadcn/ui` (`docs/CONVENTIONS.md` §12).
- **Un mois saisi par l'utilisateur utilise le champ mois natif du navigateur** (`type="month"`), qui rend exactement `AAAA-MM`. Aucun masque, aucun formatage maison. *(Fixé au temps 2.c. Les écrans société utilisent encore un champ texte avec un placeholder — à aligner, voir Z14.)*

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

`salarie.remuneration.ecrire` est **indépendante** de `salarie.remuneration.lire`.

Sans `salarie.remuneration.lire`, la clé `comptesBancaires` est **absente** de la réponse.

**Les prêts et les saisies sur salaire ne portent AUCUN masquage ni contrôle de droit propre.** Le registre des clés masquées (`REGISTRE_CLE_RUBRIQUE`) contient `remuneration`, `paiement`, `primesContractuelles`, `avantagesEnNature`, `comptesBancaires` — **ni `prets` ni `saisiesSurSalaire`**. Conforme à la spécification, confirmé par le porteur au cadrage du temps 2.c. **Mais c'est exactement la configuration qui a produit la faille des comptes bancaires** : point ouvert, à revoir au module d'authentification.

### 6.2 Le contrôle d'écriture sur la rémunération

**Ce qui était faux.** L'intercepteur de masquage inspectait les **clés du corps** de la requête via un registre. Seule la clé `comptesBancaires` y était enregistrée. Or le corps du `PUT /salaries/:id/comptes-bancaires` s'appelle `comptes`. **Un utilisateur ayant `salarie.modifier` mais pas `salarie.remuneration.ecrire` pouvait réécrire les comptes bancaires.** Découvert par un point d'arrêt, pas par un test.

**Ce qui a été fait.** Le contrôle a été placé **dans le service qui écrit les comptes bancaires** (`assert-ecriture-comptes-bancaires-salarie.ts`), pas sur la route. **ADR 0024.**

**Pourquoi pas un décorateur de route** : un décorateur protège la route qu'on a pensé à annoter. Un import, une modification en masse (module 6) ou l'écran de création écriraient dans les comptes bancaires **sans passer par cette route**, et la protection ne suivrait pas. Placé au service, le contrôle voyage avec la donnée.

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
| `RETENUES` (prêts et saisies) | Salarié | lignes à validité temporelle |

> **Les comptes bancaires ne sont PAS historisés.** Le type `CompteBancaireSalarie` ne porte **aucun champ `etat`**. Pas de ligne inactive, pas d'aperçu d'impact, pas de mois de fin. Une suppression est physique.

**Règles de comportement :**
- **Le client n'écrit JAMAIS une version ni une date d'effet.** Le serveur décide seul d'écraser ou de versionner. Le front ne doit jamais savoir ce qui est historisé. **Les champs `moisEffetDebut` et `moisEffetFin` envoyés par le client sont REFUSÉS** (`CHAMP_INTERDIT`).
- **On écrase sans créer de version** tant qu'aucun bulletin n'existe pour le mois concerné.
- **Modifier un historique n'est jamais bloqué**, même si un bulletin validé existe. La correction déclenchera une régularisation.
- **Date d'effet** : déduite du mois en cours, **sauf la première version d'un bloc porté par un emploi**, qui prend le mois de la date de début de cet emploi.

**Mois de fin — deux règles distinctes :**
- **Suppression** d'une ligne utilisée par un bulletin : elle devient inactive, mois de fin = **mois en cours**.
- **Modification** d'une ligne avec bulletin existant : l'ancienne est close au **mois précédent**, la nouvelle démarre au **mois en cours**.

**Deux lectures d'une même ligne**, volontairement divergentes au mois de clôture : l'**état affiché** (inactive dès le mois de fin) et la **lisibilité pour un mois donné** (fin incluse).

Les lignes inactives sont **renvoyées par la lecture**, reconnaissables au champ `etat` valant `'INACTIVE'` — **mais voir l'avertissement du §12.4 : ce champ porte deux significations différentes.**

> **`moisEffetFin` (historisation, écrit par le serveur) et `moisFin` (donnée métier saisie sur une pension alimentaire) sont deux champs distincts qui ne doivent jamais être confondus.** *(Fixé au temps 2.c.)*

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

> **Conséquence découverte au temps 2.c** : sans aucun bulletin, le mois en cours d'un salarié est le mois de début de son emploi le plus ancien — donc souvent **très ancien** (2022-03 pour le salarié de démonstration). Toute ligne de tableau commençant après ce mois est alors déclarée « pas encore effective » et renvoyée avec `etat: 'INACTIVE'`. **Ce n'est pas une clôture.** Voir §12.4.

**Règle de chaînage à porter au module 2** : le bulletin d'un mois n'est calculable que si le mois précédent est à l'état 4. Cela **exige un point d'ancrage** — un « premier mois de gestion » qui reste à définir.

> Le mois en cours **n'est jamais utilisé pour un affichage de liste**.

---

## 9. Cartographie des modules

1. **Fiches** : société ✅, salariés ⏳ (API livrée ; socle, liste, identité et **les quatre tableaux portés par le salarié** livrés), organismes
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
`PaymaRH_Fiche_salarie_v5.xlsx` (8 onglets) et `docs/specification-fiche-salarie-v5.md` (fait foi pour Cursor). **111 champs, 96 décisions tracées, 70 règles.** *Modifié au temps 2.c pour les saisies sur salaire.*

### ✅ 2.1.a — Modèle de données
Schéma Prisma, migrations, seed de six référentiels, compteurs atomiques, ADR 0011.

### ✅ 2.1.b — API REST
**330 tests.** Cinq prompts, treize passages correctifs. **ADR 0012 à 0020.**

### ✅ 2.1.c-1 — Socle des écrans et liste des salariés
**391 tests.** Trois temps. **ADR 0021** — enregistrement global et échec partiel.

### ✅ 2.1.c-2, temps 0 — Extensions d'API
**402 tests.** `indexLigne` sur `AlerteApi` ; `dateSortie` exposée à la racine ; type `FicheSalarie` unique dans `packages/shared-types`, avec l'alias **`EmploiFicheNonType`** à typer au temps 3.

### ✅ 2.1.c-2, temps 1 — Rubriques d'identité
**446 tests, 69 fichiers.** Quatre blocs réels ; deux routes de référentiel ; restauration des accents dans 182 textes + garde-fou ; trois salariés de démonstration ; `next build` ajouté à `pnpm verify`.

### ✅ 2.1.c-2, temps 2.a — Enveloppe des tableaux et personnes à charge
**483 tests, 73 fichiers.** Route `GET /referentiels/liens-parente` ; composant d'enveloppe générique ; rubrique Personnes à charge ; propagation de version après écriture hors séquence (**ADR 0022**) ; `CONVENTIONS.md` §13.

### ✅ 2.1.c-2, temps 2.b — Comptes bancaires
**525 tests, 76 fichiers.** Deux points d'arrêt, cinq passages correctifs. Rubrique Comptes bancaires (PUT groupé, **ADR 0023**) ; composant `ChampBanque` ; **correction d'une faille de permission réelle** (**ADR 0024**) ; enveloppe dépouillée de tout mode de suppression ; trois défauts graves du temps 2.a corrigés.

### ✅ 2.1.c-2, temps 2.c — Prêts et saisies sur salaire
**566 tests, 83 fichiers.** Un point d'arrêt, trois prompts, quatre passages correctifs, deux vérifications visuelles. **ADR 0025.**

**2.c-0 — API et base.** Référentiel `TypeSaisieSurSalaire` (2 valeurs, référence par code) ; refonte du modèle des saisies (type obligatoire, montants nullables, `moisFin` métier) ; **obligations conditionnelles selon le type**, appréciées sur l'état résultant, à la création comme à la modification ; codes `CHAMP_OBLIGATOIRE` et `CHAMP_INTERDIT` avec nom du champ ; **retrait du contrôle C17**, devenu impossible à déclencher ; alerte d'incohérence du prêt dotée du champ `mensualite` ; deux saisies de démonstration au seed.

**2.c-1 — Socle d'écran.** **Suppression unifiée** : un contrat unique injecté dans l'enveloppe (`preparer` / `confirmer`), pour les deux familles ; textes partagés avec **variante déclarée explicitement** ; **deux composants de dialogue supprimés** ; test statique étendu. **Verrouillage généralisé** : toutes les rubriques pendant l'enregistrement ; **bouton Enregistrer inactif pendant une suppression**, signal de fin émis au succès **comme à l'échec** — défaut trouvé en refusant une hypothèse non prouvée.

**2.c-2 — Les deux tableaux.** Mécanique d'envoi ligne à ligne **mutualisée** (`envoi-lignes-tableau.ts`) et adoptée par les personnes à charge ; rubrique **Prêts** (cinq colonnes, solde restant déduit) ; rubrique **Saisies sur salaire** (formulaire à deux formes selon le type, avertissement au changement de type) ; intégration au sommaire et à l'ordre d'envoi ; `CONVENTIONS.md` §13 mis à jour.

**Deux défauts trouvés à l'œil et corrigés :**
- les lignes du seed s'affichaient grisées — l'écran confondait « clôturée » et « pas encore effective » (§12.4) ;
- **Annuler faisait disparaître des lignes déjà enregistrées** : `reinitialiser()` repartait des valeurs du chargement de la page au lieu de celles du dernier enregistrement réussi. Touchait Prêts, Saisies **et Personnes à charge**.

### ⏭️ Prochaine étape — 2.1.c-2, temps 3

**Cadrage à faire.** Contenu prévu :
- **écran de création d'un salarié** (§11.11) — le registre devra savoir se comporter en deux modes ;
- action **« Supprimer le salarié »** dans le rail ;
- remplacement de **`EmploiFicheNonType`** ;
- **avertissement de navigation** interne, qui exige une **règle de lint** (Next.js 16 n'offre pas de garde au niveau du routeur).

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

Au clic : les rubriques modifiées sont envoyées **une par une, en séquence, dans l'ordre déclaré de la page**. Jamais en parallèle.

**Le numéro de version circule.** Le verrouillage optimiste est porté par l'entité — `Salarie.version`, `Emploi.version` — pas par la rubrique. Chaque réponse réussie rend le **nouveau numéro**, que le socle propage aux rubriques restantes.

**Deux natures de refus, deux comportements :**

| Refus | Comportement |
|---|---|
| **Métier** (`400` avec code, `403` sans code) | on continue avec les rubriques suivantes ; la rubrique refusée garde sa saisie et affiche le message du serveur |
| **Conflit** (`409` `CONFLIT_VERSION`, `428` `EN_TETE_IF_MATCH_REQUIS`) | on **arrête immédiatement** ; les rubriques non envoyées restent modifiées sans message ; **un seul bandeau, au niveau de la fiche** |
| **Non métier** (`500` et assimilés) | message générique de l'application, **jamais le message du serveur** |

**Des tests protègent cette asymétrie — ne jamais les fusionner.**

**Après un conflit, un seul bouton : « Recharger les valeurs du serveur »**, qui prévient avant d'écraser la saisie. **Ni « Réessayer », ni « Enregistrer quand même », ni fusion.**

**Annuler** abandonne les modifications de toute la fiche, en **nommant les rubriques concernées**. Il appelle `reinitialiser()` sur **toutes** les rubriques et **ne provoque aucun appel serveur**.

> **`reinitialiser()` ramène aux valeurs du DERNIER ENREGISTREMENT RÉUSSI, jamais à celles du chargement de la page.** *Défaut réel corrigé au temps 2.c : les trois tableaux ligne à ligne repartaient des données reçues à l'ouverture. Une ligne créée puis enregistrée disparaissait de l'écran au clic sur Annuler, alors qu'elle existait en base — l'écran mentait sur l'état du serveur jusqu'au prochain F5.* La photo de référence de chaque rubrique doit être **rafraîchie après chaque enregistrement réussi**, et c'est elle que `reinitialiser()` lit.

**LE VERROUILLAGE — deux situations distinctes, toutes deux généralisées au temps 2.c :**

| Situation | Effet |
|---|---|
| **Enregistrement en cours** | **TOUTES les rubriques** deviennent non modifiables — champs, Ajouter, Supprimer, ouverture d'un formulaire de ligne. Du clic sur Enregistrer jusqu'à la fin de la séquence, **y compris en cas d'échec ou de conflit**. |
| **Écriture hors séquence en cours** (suppression immédiate) | les boutons Supprimer du tableau concerné **et le bouton Enregistrer du rail** deviennent inactifs. Les autres rubriques restent modifiables. |

**Le signal de fin d'écriture hors séquence est émis au succès COMME À L'ÉCHEC.** Sans cela, une suppression qui échoue laisse le bouton Enregistrer grisé pour le reste de la session, et la fiche devient inenregistrable sans le moindre message.

**Annuler reste actif pendant une suppression**, puisqu'il ne déclenche aucun appel serveur.

Ces grisés portent des **états passagers**, pas des droits : ils sont donc légitimes (principe 7).

### 11.4 Ce que l'écran retient d'une réponse d'écriture — CRITIQUE

**Les routes POST, PATCH, PUT et DELETE des tableaux renvoient LA FICHE ENTIÈRE, relue en base.**

**Règle générale.** L'écran n'applique **jamais** la fiche en bloc. Il n'en retient que **deux choses** :
- le nouveau numéro de version ;
- la ligne portant l'identifiant concerné par l'appel.

Tout le reste est ignoré.

**Raison** : les autres rubriques peuvent porter une saisie non enregistrée. La fiche renvoyée contient les valeurs **en base**, donc les anciennes. L'appliquer en bloc écraserait la saisie en cours, **sans aucun message**.

**Pourquoi garder la ligne** : une suppression ne supprime pas toujours. Si la ligne a servi à un bulletin, elle revient avec l'état `INACTIVE` et un mois de fin, et l'écran doit l'afficher ainsi.

**Exception unique — le PUT groupé des comptes bancaires.** L'écran retient le **numéro de version** et **l'intégralité du bloc `comptesBancaires`**. Rien d'autre. **ADR 0023.**

**Le piège n'est pas seulement dans l'application en bloc.** Défaut réel corrigé au temps 2.b : la rubrique respectait la règle et ne remontait que la version, mais la fonction qui appliquait ce fragment le fusionnait avec une **photo périmée** de la fiche. Résultat identique — une saisie perdue, avec un message de succès. **Toute mise à jour d'état doit partir de l'état courant, jamais d'une capture prise plus tôt.**

Des tests protègent cette règle sur **chacun** des chemins réels — un tableau ligne à ligne, un tableau à PUT groupé, et depuis le temps 2.c les rubriques Prêts et Saisies. *Leçon : la preuve doit porter sur le chemin qu'emprunte le navigateur, pas sur un chemin voisin.*

### 11.5 La découpe des rubriques d'identité — quatre blocs

**Une rubrique d'écran = une rubrique d'API, sans exception.**

| Bloc | Route | Contenu |
|---|---|---|
| **Identité** | `PATCH /salaries/:id/identite` | « Identification » : nom, prénom, sexe · « État civil » : date, ville et pays de naissance, nationalité, situation familiale |
| **Identifiants et immatriculations** | `PATCH /salaries/:id/identifiants-legaux` | matricule · type de pièce (déduit) · numéro de pièce, CNSS, CIMR |
| **Coordonnées** | `PATCH /salaries/:id/coordonnees` | « Adresse », « Contact », « Contact d'urgence » |
| **Dates clés** | `PATCH /salaries/:id/dates` | date d'entrée, date d'ancienneté · date de sortie (déduite) |

**Les valeurs déduites ne bougent pas avant l'enregistrement.** L'écran ne recalcule jamais une règle métier.

**Les alertes** : avec un nom de champ → sous le champ ; sans nom de champ → en tête de son bloc. **Jamais de bandeau global.** Elles disparaissent dès que l'utilisateur modifie un champ **de ce bloc**.

**Les refus affichent le message du serveur tel quel.**

### 11.6 Les tableaux répétables — ordre dans la page

Identité → Identifiants → Coordonnées → **Personnes à charge** → **Comptes bancaires** → Dates clés → **Prêts** → **Saisies sur salaire**

**Chaque tableau est une entrée du sommaire.** L'ordre vient de `ordre-rubriques-fiche-salarie.ts`, qui commande aussi l'ordre d'envoi.

Les trois autres tableaux (primes contractuelles, avantages en nature, statuts particuliers) sont portés par l'**emploi** et relèvent de la 2.1.c-3.

### 11.7 Les tableaux répétables — comportement figé

**Le tableau reste un affichage en lecture seule.** Un clic sur une ligne ou sur « Ajouter » déplie le formulaire **juste en dessous, dans la page, sur toute la largeur, en disposition verticale.** Ni saisie dans les cellules, ni panneau latéral.

**Composant générique pour l'enveloppe seulement** — tableau, bouton Ajouter, dépliage, fenêtre de confirmation — **et un formulaire écrit à la main par tableau.** Pas de générateur de formulaire.

**L'ENVELOPPE PORTE LA SUPPRESSION POUR LES DEUX FAMILLES, À TRAVERS UN CONTRAT UNIQUE INJECTÉ** *(forme retenue au temps 2.c)*. Le tableau appelant lui fournit :

- **`preparer(ligne)`** : rend, éventuellement de façon asynchrone, les textes de la fenêtre. L'enveloppe **ne sait pas** si cette fonction émet un appel serveur.
- **`confirmer(ligne)`** : exécute la suppression, et rend soit *terminé*, soit **recommencer** avec un préambule à afficher. L'enveloppe rappelle alors `preparer` et réaffiche la fenêtre. Elle **ne sait pas** ce que « recommencer » signifie.

L'enveloppe porte, et elle seule : l'attente, le grisage des boutons Supprimer pendant l'attente, le retrait local immédiat d'une ligne jamais enregistrée, et le montage de la fenêtre. **Elle ne connaît aucun code de refus, aucun client d'appel, aucun nom de tableau.** Un test statique le vérifie sur les trois points.

**Les textes vivent hors de l'enveloppe.** Un fichier partagé porte les phrases communes aux trois tableaux historisés ; seul le titre est propre à chaque tableau. Les textes des comptes bancaires sont différents et le restent.

**La variante (historisée / différée) est DÉCLARÉE explicitement dans les textes injectés**, jamais déduite de la présence d'un champ. *(Défaut corrigé au temps 2.c : le dialogue devinait la famille à la présence d'un message serveur, et en tirait la structure de son corps et l'état de son bouton — une condition sur le nom du tableau par un autre chemin.)*

**Pas de colonne « État ».** L'enveloppe reçoit `idColonneMarque` et injecte sous la valeur métier de cette colonne les mentions : « non enregistrée », « inactive depuis MM/AAAA », « en erreur ». Colonnes porteuses : **Prénom** (personnes à charge), **RIB** (comptes bancaires), **Libellé / objet** (prêts), **Référence de la décision** (saisies). Le style de ligne reste porté par la ligne entière.

**Un seul formulaire ouvert sur toute la page**, tous tableaux confondus. Ouvrir un formulaire referme celui qui l'était, **en conservant sa saisie**. Ce mécanisme vit au niveau de la page, pas du tableau.

**Deux boutons dans le formulaire déplié**, aucun appel serveur :
- « Valider la ligne » → replie, retient la saisie localement.
- « Annuler la ligne » → replie, restaure les valeurs d'avant l'ouverture.

**La photo des valeurs de référence est prise à la PREMIÈRE ouverture** d'une ligne et ne change plus jusqu'à Valider ou Annuler.

**Le bouton Enregistrer global, quand un formulaire est ouvert**, vaut « Valider la ligne » implicite puis enregistre. Il ne refuse jamais au motif qu'une ligne semble incomplète : tous les contrôles sont côté serveur.

**Aucun tri côté écran.** Les lignes arrivent triées par le serveur (par mois de début pour les prêts et les saisies). **Une ligne ajoutée non encore enregistrée s'affiche en dernier**, avec la mention « non enregistrée ».

**Les lignes CLÔTURÉES sont affichées** en grisé, avec « inactive depuis MM/AAAA », sans filtre ni bascule. Elles se déplient **en lecture seule** : aucun champ modifiable, aucun bouton de suppression — **absents du DOM**, pas grisés.
> **Une ligne est clôturée si `etat === 'INACTIVE'` ET `moisEffetFin` est renseigné.** Le seul champ `etat` ne suffit pas — voir §12.4.

**Un tableau est UNE SEULE rubrique** au regard du registre, pas une rubrique par ligne.

**Deux familles d'envoi :**

| Famille | Tableaux | `envoyer(version)` |
|---|---|---|
| **Ligne à ligne** | Personnes à charge, prêts, saisies | enchaîne en interne, en séquence : **modifications puis ajouts, chacun dans l'ordre d'affichage**. Le numéro rendu par chaque appel sert au suivant ; le dernier remonte au socle. **Mécanique mutualisée dans `envoi-lignes-tableau.ts` depuis le temps 2.c** — elle ne prend aucune décision de comportement propre à un tableau. |
| **PUT groupé** | Comptes bancaires | **un seul appel** portant la liste entière, dans l'ordre d'affichage, lignes nouvelles en dernier. |

**Refus 400 — ligne à ligne : on continue** avec les suivantes. La **première** ligne refusée voit son formulaire s'ouvrir ; les autres restent repliées mais **portent une marque visible**, et leur message serveur apparaît au dépliage. **Aucune alerte n'est perdue.**

**Refus 400 — PUT groupé : rien n'a été écrit.** La saisie est intégralement conservée, la séquence continue.

**Refus 409 : arrêt immédiat** dans les deux familles.

**Alerte de SUCCÈS portant un nom de champ** *(cas apparu au temps 2.c avec l'alerte d'incohérence des prêts)* : la ligne est **enregistrée**, elle n'est pas en erreur. L'alerte s'affiche **sous le champ désigné, dans le formulaire de la ligne**, et le formulaire de la première ligne concernée **s'ouvre automatiquement** — sans quoi l'utilisateur ne la verrait jamais. Les alertes **sans** champ restent en tête de rubrique.

### 11.7 bis Les alertes rattachées par position — PUT groupé

`indexLigne` est l'index dans le tableau **envoyé**, à partir de 0, **jamais dans l'affichage**.

- **L'écran conserve le tableau exactement tel qu'il vient de l'envoyer** et rattache les alertes par position dans celui-là.
- Alerte avec `indexLigne` **et** `champ` → sous ce champ, dans le formulaire de la ligne.
- Alerte **sans `champ` ni `indexLigne`** → **en tête de la rubrique**.
- Après un refus, **la première ligne portant une alerte ouvre son formulaire** ; les autres sont marquées.
- **Disparition, deux niveaux :** modifier une ligne efface **son** alerte ; **ajouter ou supprimer** une ligne efface **toutes** les alertes de la rubrique.
- **Pendant l'aller-retour, la rubrique est non modifiable.**

### 11.8 Les suppressions dans les tableaux

**Enregistrement à deux vitesses, assumé :**

| | Ajout et modification | Suppression |
|---|---|---|
| Comptes bancaires | différés, via Enregistrer | **différée aussi** |
| Personnes à charge, prêts, saisies | différés, via Enregistrer | **immédiate**, avec aperçu et jeton |

**Ligne jamais enregistrée** (les deux familles) : retrait local immédiat, **sans confirmation, sans appel serveur**.

**Ligne déjà enregistrée — tableaux ligne à ligne :**
1. `preparer` appelle la route d'aperçu (GET, aucune version exigée).
2. Fenêtre de confirmation par-dessus la page :
   - **Titre** fourni par le tableau appelant : « Supprimer cette personne à charge ? », « Supprimer ce prêt ? », « Supprimer cette saisie ? » ;
   - le champ `message` du serveur, **tel quel** ;
   - « Cette suppression part tout de suite. Le bouton Annuler de la fiche ne reviendra pas dessus. » ;
   - si la rubrique porte des modifications non enregistrées : « Vos autres modifications de cette rubrique restent à enregistrer. » ;
   - boutons **« Supprimer »** et **« Garder la ligne »**.
3. `confirmer` émet le DELETE avec jeton en paramètre d'URL et en-tête `If-Match`.
4. On applique §11.4, puis on propage la version (ADR 0022).

**Refus 409 `CONFIRMATION_OBSOLETE`** : `confirmer` rend **recommencer** avec le préambule « La situation a changé depuis l'affichage. » ; l'enveloppe redemande l'aperçu et réaffiche la fenêtre. **Jamais de renvoi automatique du DELETE.**

**Pendant un aller-retour de suppression**, tous les boutons Supprimer du tableau **et le bouton Enregistrer du rail** sont grisés.

**Ligne déjà enregistrée — comptes bancaires (suppression différée) :**
- **Aucun appel serveur** : ni aperçu, ni DELETE, ni jeton.
- Fenêtre composée **entièrement par l'écran** :
  - titre : « Supprimer ce compte bancaire ? »
  - corps : « Cette ligne sera supprimée lors du prochain enregistrement. Le bouton Annuler de la fiche revient dessus. »
- **Les mots sont volontairement l'inverse** de ceux de l'autre famille. Deux effets différents doivent se dire différemment, sinon l'utilisateur apprend à ne plus lire.
- La ligne **disparaît immédiatement** du tableau, ni barrée ni grisée.
- **Annuler** au niveau de la fiche la fait revenir.

### 11.9 Les comptes bancaires — décisions d'écran

- **Quatre colonnes** : Banque · RIB · Titulaire du compte · Part du virement. **IBAN et BIC n'apparaissent qu'au dépliage.**
- La colonne Part du virement affiche la valeur saisie, **et rien si elle est vide**. Jamais « 100 % ».
- Sous le champ Part du virement, une phrase fixe : « Avec un seul compte, la totalité du virement y est versée. Renseignez ce champ uniquement si vous répartissez le salaire sur plusieurs comptes. »
- **Champ Banque unique**, avec propositions au fil de la frappe et **saisie libre autorisée**. Composant `ChampBanque`, générique.
- **Exclusivité `banqueId` / `banqueLibreSaisie`**, portée par la rubrique au moment de l'envoi. **Jamais les deux ensemble.**
- **Aucun masque, aucun formatage, aucune troncature** sur RIB, IBAN, BIC.
- **Aucun pré-remplissage local de la banque** à partir des trois premiers chiffres du RIB. C'est un contrôle serveur.
- **`partVirement` est une chaîne décimale**, envoyée telle que tapée.
- **Comportement assumé** : deux comptes à 60 et 40, on supprime le second et on enregistre — le serveur force la part du compte restant à `null` et **la valeur se vide toute seule à l'écran**.

### 11.10 Les prêts — décisions d'écran (temps 2.c)

- **Cinq colonnes** : Libellé / objet · Mois de début · Mensualité · Nombre d'échéances · **Solde restant**. Colonne porteuse des mentions : **Libellé / objet**.
- **Formulaire déplié** : libellé/objet · libellé sur le bulletin · montant total · mois de début · mensualité · nombre d'échéances.
- **Le solde restant est une valeur DÉDUITE, calculée par le serveur, jamais stockée, JAMAIS recalculée par l'écran.** Il n'apparaît pas dans le formulaire : il n'est pas saisissable.
- **Sur une ligne portant une modification locale non enregistrée, la cellule Solde restant est VIDE.** La valeur du serveur porterait sur les anciennes données ; vide vaut mieux que faux.
- **Il vaut aujourd'hui le montant total**, parce que le port des bulletins est provisoire et rend une liste vide. **Ne pas compenser.** La colonne deviendra juste au module 4 sans retoucher l'écran.
- **Alerte non bloquante `MENSUALITE_ECHEANCES_INCOHERENTE`** (mensualité × échéances ≠ montant total) : la ligne **est enregistrée**, l'alerte s'affiche sous le champ `mensualite` et le formulaire s'ouvre. **Aucun contrôle équivalent côté écran.**

### 11.11 Les saisies sur salaire — décisions d'écran (temps 2.c)

- **Quatre colonnes** : Référence de la décision · Créancier demandeur · Type de saisie · Mois de début. Colonne porteuse : **Référence de la décision**. **Les montants n'apparaissent qu'au dépliage** : ils diffèrent selon le type, une colonne serait vide une ligne sur deux.
- **Le type de saisie est une liste déroulante alimentée par le référentiel** (`GET /referentiels/types-saisie-sur-salaire`). Les libellés viennent du serveur, aucun n'est codé en dur.
- **Formulaire à deux formes.** Champs communs : type · référence de la décision · créancier · libellé sur le bulletin · mois de début.

| | Pension alimentaire | Saisie à tiers détenteur |
|---|---|---|
| Montant mensuel | **obligatoire** (fixé par le jugement) | **absent** — calculé au bulletin selon la quotité |
| Montant total | **absent** | **obligatoire** — la saisie s'arrête quand les bulletins l'ont consommé |
| Mois de fin | **facultatif** — vide = elle court sans terme | **absent** |

- **Les champs de l'autre forme sont ABSENTS du formulaire, pas grisés.**
- **L'écran n'envoie jamais un champ qui ne relève pas du type choisi.** Le serveur le refuserait.
- Sous le mois de fin, une phrase d'aide fixe : « Laissez vide si la pension est due sans terme fixé. »
- **AVERTISSEMENT AU CHANGEMENT DE TYPE.** Quand l'utilisateur change le type alors qu'un montant de l'autre forme est renseigné, l'écran prévient **au moment du choix** :
  - « Le montant total saisi ne s'applique pas à une pension alimentaire et sera abandonné lors de l'enregistrement. »
  - « Le montant mensuel et le mois de fin saisis ne s'appliquent pas à une saisie à tiers détenteur et seront abandonnés lors de l'enregistrement. »
  **Raison** : le serveur met ces valeurs à `null` sans refuser la requête (ADR 0025). Sans avertissement, l'utilisateur voit un message de succès et une donnée disparue — le défaut exact du temps 2.a.
- **Conservation locale (règle A0)** : tant que la ligne n'est pas enregistrée, une valeur rendue invisible par un changement de type est **conservée**. Revenir au type précédent la fait réapparaître. C'est l'enregistrement, et lui seul, qui l'abandonne.

### 11.12 Les emplois — 2.1.c-3

**Accordéon : les emplois sont empilés sur la même page.** Un seul emploi → le sélecteur s'efface. Deux ou plus → les emplois clos sont repliés derrière « afficher les emplois terminés ».

### 11.13 La création d'un salarié — temps 3

L'écran de création affiche **toutes les rubriques d'identité**, pas un formulaire réduit. **Un salarié peut être créé sans aucun emploi.** Aucun tableau répétable : on enregistre, on arrive sur la fiche, on ajoute ensuite.

**Différence structurelle à traiter** : la création est **un seul appel** (`POST /salaries` accepte toute l'identité), alors que le registre envoie une rubrique par appel. Le registre devra savoir se comporter en deux modes.

### 11.14 La liste des salariés

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

En-tête `if-match` (minuscules) exigé sur POST, PATCH et DELETE. **L'aperçu (GET) n'exige aucune version.**

**Comptes bancaires** — un seul verbe :

```
PUT /salaries/:id/comptes-bancaires     corps : { comptes: [...] }
```

Remplace la **liste entière**. Pas de POST, pas de PATCH, pas de DELETE par ligne. **Aucune route d'aperçu.**

### 12.1 Les prêts — forme d'une ligne

`PretSalarie` (`packages/shared-types/src/salarie.ts`) : `id` · `libelleObjet` · `libelleBulletin` · `montantTotal` · `moisDebut` · `mensualite` · `nombreEcheances` (nombre entier) · **`soldeRestant`** (chaîne, jamais nulle) · `moisEffetDebut` · `moisEffetFin` · `etat`.

Tous les champs sont **obligatoires à la création**. `nombreEcheances` est le seul champ numérique (entier, minimum 1) ; tous les montants sont des **chaînes décimales**.

**`soldeRestant` est calculé à chaque lecture** par `deduireSoldeRestantPret`, à partir du montant total, de la mensualité, du nombre d'échéances, du mois de début et de la **liste des bulletins**. Le port bulletin provisoire rendant `[]`, **le solde vaut aujourd'hui le montant total**.

**Alerte `MENSUALITE_ECHEANCES_INCOHERENTE`** : émise à la création et à la modification quand mensualité × échéances ≠ montant total. **La ligne est enregistrée quand même.** Porte `champ: 'mensualite'` depuis le temps 2.c.

### 12.2 Les saisies sur salaire — forme d'une ligne (refondue au temps 2.c)

`SaisieSurSalaire` : `id` · **`typeSaisieCode`** · `referenceDecision` · `creancier` · `libelleBulletin` · `montantTotal` (nullable) · `montantMensuel` (nullable) · `moisDebut` · **`moisFin`** (nullable) · `moisEffetDebut` · `moisEffetFin` · `etat`.

**Obligations conditionnelles**, appréciées **sur l'état résultant** (corps fusionné avec la ligne existante), à la **création comme à la modification** :

| Champ | Pension alimentaire | Saisie à tiers détenteur |
|---|---|---|
| `typeSaisieCode` | obligatoire | obligatoire |
| `referenceDecision`, `creancier`, `libelleBulletin`, `moisDebut` | obligatoires | obligatoires |
| `montantMensuel` | **obligatoire** | **interdit** |
| `montantTotal` | **interdit** | **obligatoire** |
| `moisFin` | **facultatif** | **interdit** |

- Champ **interdit** envoyé → `400 CHAMP_INTERDIT`, avec le nom du champ. **Jamais ignoré en silence.**
- Champ **obligatoire** absent → `400 CHAMP_OBLIGATOIRE`, avec le nom du champ.
- `moisEffet`, `moisEffetDebut`, `moisEffetFin` envoyés par le client → `400 CHAMP_INTERDIT` (règle antérieure, conservée).

**Nettoyage silencieux au changement de type.** Quand le type change, le serveur met à `null` les montants et le `moisFin` devenus incompatibles, **sans refuser la requête**, dès lors que le client ne les a pas renvoyés. Décision assumée : l'API reste seule juge de la compatibilité, **l'avertissement est à la charge de l'écran** (§11.11). **ADR 0025.**

**Le contrôle C17** (montant mensuel > montant total) **a été supprimé** : les deux montants ne coexistent plus jamais sur une même ligne, le contrôle était devenu impossible à déclencher. Code, fonction et test retirés. **Aucun contrôle de plafond ne le remplace** : la quotité saisissable de l'article 387 relève du calcul du bulletin, donc du module 4.

### 12.3 Le tri

Les prêts et les saisies sont triés **côté serveur par `moisDebut`**, puis par date de création. Aucun tri d'écran.

### 12.4 ⚠️ Le champ `etat` porte DEUX significations

`etat` vaut `'ACTIVE'` ou `'INACTIVE'` sur les lignes des **trois tableaux historisés** — jamais sur les comptes bancaires.

Mais `'INACTIVE'` recouvre **deux situations sans rapport** :

| Situation | `moisEffetFin` | Sens |
|---|---|---|
| Ligne **clôturée** par historisation | renseigné | la ligne a vécu, elle est terminée → grisée, lecture seule |
| Ligne **pas encore effective** au mois en cours | `null` | la ligne commence plus tard que le mois en cours du salarié → **parfaitement normale et modifiable** |

**Comment le second cas survient sans bulletin** : le mois en cours d'un salarié sans bulletin est le mois de début de son emploi le plus ancien (§8) — souvent très ancien. Toute ligne créée après ce mois est alors marquée `INACTIVE`.

**L'écran teste donc les DEUX champs** : `estLigneTableauCloturee(ligne)` = `etat === 'INACTIVE' && moisEffetFin !== null`. Fonction partagée par les trois tableaux, documentée dans `CONVENTIONS.md` §13 et commentée à sa définition.

> **Défaut réel corrigé au temps 2.c** : sans cette distinction, le prêt et les deux saisies du seed s'affichaient grisés et non modifiables. Les personnes à charge portaient le même défaut, latent — invisible sur le jeu de démonstration par une coïncidence de dates.

> **C'est une ambiguïté d'API, masquée côté écran.** Un import, un export ou le module de déclarations lira `etat` un jour et se trompera de la même façon. **Point ouvert.**

### 12.5 Verrouillage optimiste et alertes

**Verrouillage optimiste** : toutes les écritures l'exigent, DELETE et PUT compris. En-tête `if-match`. La version est **toujours celle du SALARIÉ**, jamais celle de la ligne. **Chaque réponse réussie rend la fiche entière, version comprise** — voir §11.4 pour ce que l'écran en retient.

**Aperçu d'impact** (tableaux ligne à ligne uniquement) rend :
```
{ donnees: { salarieId, ligneId, mode, message, jetonConfirmation } }
```
`mode` vaut `'supprimer'` ou `'inactiver'`. Le jeton est calculé sur `{ salarieId, ligneId, mode }` — les faits, jamais le message.

Messages serveur possibles : « La ligne sera close et restera visible en état inactive pour justifier les bulletins passés. » ou « La ligne sera supprimée définitivement. »

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

### 12.6 Les comptes bancaires — faits vérifiés

**Forme d'une ligne** (`CompteBancaireSalarie`) : `id` · `banqueId` · `banqueLibreSaisie` · `rib` · `iban` · `bic` · `titulaire` · `partVirement`. **Il n'existe pas de champ `banque`** ni de champ `etat`.

**Le corps du PUT accepte** une liste **vide** et des lignes **sans `id`** (création).

**`partVirement`** est une **chaîne décimale**. Un seul compte : le serveur **force la valeur à `null`**. Deux comptes ou plus : `null` compte comme 0, la somme doit valoir **exactement 100**, sinon `400 PART_VIREMENT_INVALIDE`.

**Le PUT est tout ou rien** : validations bloquantes avant toute écriture, puis transaction.

**Contrôle de droit** : `assertEcritureComptesBancairesSalarie` en tête de `remplacerComptesBancaires`, dans le service (§6.2, ADR 0024).

### 12.7 Les référentiels du module 2

| Référentiel | Route | Ordre porté par la donnée |
|---|---|---|
| Pays | `GET /referentiels/pays` | oui (Maroc en tête) |
| Situations familiales | `GET /referentiels/situations-familiales` | oui |
| Liens de parenté | `GET /referentiels/liens-parente` | oui (`ordre Int @unique`) |
| **Types de saisie sur salaire** | `GET /referentiels/types-saisie-sur-salaire` | **oui** |
| Banques | `GET /referentiels/banques` | **non** — tri par nom côté serveur, point ouvert |

**`TypeSaisieSurSalaire`** *(créé au temps 2.c)* : deux entrées, `PENSION_ALIMENTAIRE` (« Pension alimentaire », ordre 1) et `TIERS_DETENTEUR` (« Saisie à tiers détenteur », ordre 2). **Liste close à ce stade, table extensible sans migration.** Référencée par **code**, jamais par identifiant technique.

Les référentiels du module 2 utilisent l'**enveloppe module 1** (`{ data, warnings }`) et un contrôle de lecture par `referentiel.lire` **dans le service**, pas de décorateur sur le contrôleur.

---

## 13. Ce que les temps 2.a, 2.b et 2.c ont appris — à ne pas réapprendre

**Un point d'arrêt trouve ce qu'aucun test ne cherche.** Au temps 2.b, il a découvert une faille de permission réelle. Au temps 2.c, il a découvert que la spécification décidée avec le porteur contredisait l'API livrée sur **cinq points** — le temps entier aurait été cadré de travers.

**Une décision métier peut réécrire une API déjà livrée.** La quotité saisissable de l'article 387 a supprimé un champ obligatoire, rendu deux montants conditionnels, ajouté un référentiel et supprimé un contrôle. **Ce n'était plus un temps d'écran.** Le reconnaître à temps a évité de faire écrire un écran sur une API incompatible.

**Masquer à l'écran ne protège pas.** Un masquage d'écran sans son pendant serveur est une illusion de sécurité.

**Un contrôle placé sur une route ne protège que cette route.** Le placer au plus près de la donnée.

**Une saisie peut être perdue sans que la règle soit violée.** Toute mise à jour d'état part de l'état courant, jamais d'une capture prise plus tôt.

**Une saisie peut être perdue APRÈS avoir été enregistrée.** Défaut du temps 2.c : `reinitialiser()` repartait des données du chargement de la page. Une ligne créée, enregistrée, puis « annulée » disparaissait de l'écran alors qu'elle existait en base. **L'écran mentait sur l'état du serveur, sans aucun message.** Trouvé à l'œil, invisible pour 561 tests.

**Un test peut passer sans rien prouver — et la preuve d'échec peut porter sur le mauvais chemin.** Au temps 2.c, la preuve du critère le plus important a d'abord été fournie sur un test préexistant exerçant l'ancien chemin, alors que le test du nouveau chemin venait d'être écrit. **Vérifier quel chemin la preuve emprunte, pas seulement qu'une preuve existe.**

**Un mécanisme sans appelant est une dette qui se prend pour un acquis.** Deux composants de dialogue sont devenus sans appelant au temps 2.c : supprimés.

**Une énumération de modes est le premier pas vers une condition sur le nom d'un tableau — et l'inférence en est le second.** Après avoir supprimé l'énumération au temps 2.b, la condition est revenue au temps 2.c sous forme de déduction : le dialogue devinait sa famille à la présence d'un champ. **La variante se déclare, elle ne se devine pas.**

**Un contrôle correct peut devenir impossible à déclencher.** C17 comparait deux montants qui ne coexistent plus. Retiré — mais **la trace du retrait reste dans l'ADR** : sans elle, un lecteur trouvant deux montants nullables croira à un relâchement.

**Une documentation qui décrit un contrôle supprimé envoie quelqu'un le chercher.** Vérifier par recherche sur tout le dépôt qu'aucune occurrence ne subsiste — **sauf dans l'ADR, où elle doit rester**.

**Un ordre d'affichage peut être un ordre d'exécution.**

**Un message technique du serveur n'a rien à faire à l'écran.**

**Un rapport peut fabriquer une preuve.** Une sortie de `pnpm verify` reconstituée annonçait « aucun cycle » sur zéro fichier. Au temps 2.c, une sortie a été rendue tronquée, et trois fichiers de redirection ont été laissés dans l'arbre.

**Un `pnpm verify` vert chez Cursor ne l'est pas toujours chez le porteur.** Au temps 2.c, trois fichiers échouaient au contrôle de formatage. `pnpm format` règle ce cas.

**Cursor démonte ses propres tests, corrige les diagnostics erronés, contredit le prompt quand celui-ci se contredit, et déclare ses pansements — quand on le lui demande.** Au temps 2.c : il a corrigé le nom d'un champ contre l'instruction littérale du prompt, reconnu que son inférence sur la famille de dialogue allait plus loin qu'il ne l'avait dit, et vérifié spontanément si les rubriques déjà livrées portaient les mêmes défauts. **C'est le comportement attendu — le lui dire.**

**Une hypothèse défendue n'est pas une preuve.** Au temps 2.c, Cursor a justifié l'absence d'un test par une hypothèse sur le comportement. En exigeant la vérification, on a trouvé que **le chemin d'erreur ne refermait pas le verrou** : une suppression échouée rendait la fiche inenregistrable pour le reste de la session.

**Refuser une recommandation n'est pas refuser le raisonnement.**

**Un défaut peut dormir plusieurs temps, et un défaut peut être latent dans une rubrique livrée.** Les personnes à charge portaient le défaut du champ `etat`, invisible par coïncidence de dates. **Toujours demander si les rubriques déjà livrées partagent le mécanisme corrigé.**

**Une correction acceptée peut n'être qu'un masque.** La distinction entre « clôturée » et « pas encore effective » est réglée côté écran ; l'ambiguïté reste côté API. **Accepter et inscrire, jamais accepter et oublier.**

**Une explication invérifiable n'est pas une explication.**

**Quand un comportement ne se teste pas honnêtement, le dire.**

**`pnpm verify` ne couvrait pas la compilation du front.** `next build` est désormais en dernière position.

**Un contrôle testé à la création peut manquer à la modification.**

**Une erreur avalée coûte une soirée.** Le helper écrit sur `stderr`, jamais `console.*`.

**Un garde-fou qui crie à tort sera ignoré.**

**Une exemption ne s'allonge jamais.**

**Une exception rangée loin de sa règle n'est jamais trouvée.**

**Les tests ne voient pas l'écran. Onze défauts réels trouvés à l'œil à ce jour.**

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
- **Tout au prorata des assiettes** : IR, abattement, charges de famille, plafond CNSS, **prêts, saisies**.
- Jours plafonnés à **26**. Écart d'arrondi sur le bulletin de l'assiette la plus élevée.
- **Déclarations** : une seule ligne consolidée par salarié. **À faire confirmer auprès des administrations.**
- **Le moteur est appelé au niveau salarié × mois** et rend N bulletins.

### Chaîne de calcul

**Fiche → éléments variables → bulletin, pour les PRIMES SEULEMENT.** Le salaire de base, les avantages en nature, les prêts et les saisies alimentent le bulletin directement — d'où leur historisation.

La fiche porte le **rattachement** d'une prime (code + mois d'application), jamais un montant. Les avantages en nature portent un montant.

### Valeurs déduites — jamais stockées

Type de pièce d'identité · date de sortie du salarié · état actif/inactif · **solde restant d'un prêt** · durée du travail dans l'autre base · durée de la période d'essai · nombre de personnes à charge · libellé accordé en genre de la situation familiale · mois en cours.

> **Le nombre de personnes à charge n'est PAS affiché à l'écran au temps 2.** Ne jamais recharger la fiche automatiquement pour le rafraîchir.

### Trois unicités, toutes par société

Matricule (toujours) · numéro de pièce d'identité (si renseigné) · numéro CNSS (si renseigné). **Aucun contrôle ne traverse la frontière d'une société.**

**Un matricule attribué n'est jamais réattribué**, même après suppression (ADR 0019).

### Les prêts — règles métier

- Portés par le **salarié**. Alimentent le bulletin directement → historisés dans le bloc `RETENUES`.
- Emplois multiples : **échéance répartie au prorata des assiettes**.
- Deux libellés distincts : l'objet du prêt (pour distinguer deux prêts à l'écran) et le libellé porté sur le bulletin.
- **Le solde restant est déduit**, jamais stocké, recalculé à chaque consultation.
- Mensualité × nombre d'échéances peut différer du montant total : **alerte, jamais blocage** — le dernier versement est souvent un solde.
- Un mois de début antérieur au mois en cours est **autorisé sans contrôle** : reprise de prêts en cours.

### Les saisies sur salaire — règles métier

- Portées par le **salarié** : une saisie vise la personne, pas un contrat. Historisées dans `RETENUES`. Emplois multiples : **répartition au prorata des assiettes**.
- Le **créancier demandeur** est un texte libre, pas un organisme du référentiel : une saisie peut viser un particulier.
- **Deux formes, selon le type :**
  - **Pension alimentaire** : montant **mensuel fixé par la décision de justice** — c'est une donnée, pas un calcul. Un **mois de fin facultatif** ; vide, elle court sans terme.
  - **Saisie à tiers détenteur** : **montant total** à recouvrer. Le montant prélevé chaque mois dépend de la **quotité saisissable de l'article 387 du code du travail marocain** : il se calcule **au bulletin**, il ne se saisit pas. La saisie s'arrête quand les bulletins ont consommé le montant total.
- **Aucun contrôle de plafond en phase 2.** La quotité relève du module 4.

### Les comptes bancaires — règles métier

- **Un virement peut être réparti sur plusieurs comptes.**
- **Un seul compte = 100 % implicite**, aucun contrôle. **Plusieurs comptes : la somme doit valoir exactement 100 %, sinon blocage.** La répartition s'applique à **chaque bulletin séparément**.
- **Alerte non bloquante « RIB partagé »** si le même RIB existe déjà dans la société. Cas légitime : deux membres d'une même famille.
- **Formats** : RIB 24 caractères, IBAN 28 avec préfixe MA, BIC 8 ou 11. Alertes, pas blocages — sauf caractère non conforme, qui est un refus.
- **Le code d'une banque** est constitué des trois premiers chiffres du RIB : identifiant Bank Al-Maghrib. **Les 21 codes du référentiel sont vides**, donc le pré-remplissage est **inerte en production**.
- **L'emploi désignera le compte à créditer** quand le mode de paiement est le virement (2.1.c-3).

### Une donnée sensible

`situationHandicap` sur les personnes à charge, **visible seulement pour un enfant**. Marquée `sensible`, sans droits propres à ce stade. Quand le lien passe à Conjoint, la case est **absente du DOM** et sa valeur est **conservée** (règle A0).

### Une exception : TAHFIZ

Exonération **portée par la société**, pas un statut saisi salarié par salarié. Son activation propage le statut à tous les salariés **ayant un emploi ouvert**, existants et futurs — jamais aux salariés sortis.

Au **retrait** : ligne jamais utilisée par un bulletin → supprimée ; ligne déjà utilisée → inactivée avec un mois de fin.

Une ligne propagée est en **lecture seule** depuis la fiche salarié. **`operations` n'existe pas au niveau ligne** — il faudra un autre signal.

---

## 15. Points ouverts

| Réf | Sujet | État |
|---|---|---|
| — | Béquilles de dev `x-paymarh-user-id`, `NEXT_PUBLIC_PAYMARH_USER_ID`, `x-paymarh-permissions-refusees` | **bloquent la mise en production** |
| — | **Béquille des permissions refusées prouvée sur une route sonde uniquement** | à refermer au module d'authentification |
| — | **Le champ `etat` porte deux significations** (clôturée / pas encore effective), distinguées par la présence de `moisEffetFin`. Masqué côté écran par `estLigneTableauCloturee`. **Un import, un export ou le module de déclarations se trompera de la même façon que l'écran s'est trompé** | **à trancher côté API**, prochain passage sur les tableaux |
| — | **Prêts et saisies ne portent aucun contrôle de droit en écriture** au-delà de `salarie.modifier`, ni sur la route ni dans le service. Conforme à la spécification, mais c'est la configuration qui a produit la faille des comptes bancaires | module d'authentification |
| — | **Le refus des champs d'historisation n'est garanti que pour les saisies.** Les DTO des prêts et des personnes à charge n'exposent pas `moisEffet*`, donc l'outil de validation les élimine avant tout contrôle métier. Asymétrie non voulue, pas une régression | à aligner |
| — | **Scénario non couvert par un test** : seule la rubrique où l'on supprime est modifiée → après la suppression, le bouton Enregistrer reste grisé. Comportement correct mais **déduit du code**, non prouvé | temps 3 |
| — | **Alerte de succès avec champ sur les personnes à charge** : le mécanisme mutualisé l'afficherait sous le champ ; l'API n'en produit aucune aujourd'hui, donc aucun test ne couvre ce cas | à surveiller |
| — | **Les tests d'intégration partagent la base du serveur de développement.** Toute saisie manuelle sur les salariés de démonstration fait échouer `pnpm verify` (test S3). Remède : **`pnpm db:reset` PUIS `pnpm db:seed`**. Solution de fond : base dédiée aux tests ou base éphémère | hors module 2 |
| — | **Quotité saisissable (article 387)** : aucun contrôle, aucun plafond en phase 2. Le montant prélevé d'une saisie à tiers détenteur se calcule au bulletin | module 4 |
| — | **Champ Banque de la fiche société à aligner** sur celui de la fiche salarié | rattaché à Z14 |
| — | **Champs mois de la fiche société** : champ texte avec placeholder `AAAA-MM`, alors que la fiche salarié utilise le champ mois natif | rattaché à Z14 |
| — | **`couleur` sur la table `Banque`** : obligatoire en base, déclarée pouvant être vide dans le type partagé. L'un des deux ment | prochain passage sur les référentiels |
| — | **Pas de champ `ordre` sur `Banque`** : l'API trie par nom | avec le remplissage des codes (X3) |
| — | **Avertissement de navigation partiel.** Seuls la fermeture d'onglet et le lien de retour sont couverts. Next.js 16 n'offre pas de garde au niveau du routeur. **La solution devra être une contrainte outillée** (règle de lint interdisant le lien standard dans la zone de la fiche) | **temps 3** |
| — | **« Cette fiche est ouverte ailleurs »** : écarté au temps 2 | après le module d'authentification |
| — | **`ordre Int @unique` sur `LienParente`** : plus strict que sur `Pays` | à revoir si la liste s'allonge |
| — | **`operations` n'existe pas au niveau ligne de tableau** | 2.1.c-3 |
| — | **Suppression d'un compte bancaire désigné par un emploi** : rien ne l'empêche aujourd'hui | 2.1.c-3 |
| — | **Personne à charge inactive encore comptée** | module 4 |
| — | **Ligne inactive non vérifiable à l'œil** tant que les bulletins n'existent pas | module 4 |
| — | **Page d'accueil du back-office** : affiche l'adresse de l'API et « authentification non implémentée » | à retirer avant production |
| — | Liste d'exemption du module 1 : 35 routes sur l'ancien mécanisme de droits. **Ne jamais l'allonger.** | à vider à la reprise du module 1 |
| X3 | **Codes des 21 banques du référentiel, tous vides.** Pré-remplissage et alerte prouvés par test mais **inertes en production** | travail de données, par le porteur |
| — | **`EmploiFicheNonType`** : la forme d'un emploi est volontairement opaque | **temps 3** |
| — | **Le jeton de suppression de fiche est constant** : il prouve qu'un aperçu a eu lieu, pas sa fraîcheur | à ne pas prendre pour une garantie |
| — | **Mention « mis à jour à l'enregistrement » absente sous la date de sortie** | 2.1.c-3 |
| — | **Compilation de l'API absente de `pnpm verify`.** `nest build` n'a pas le filet de Turbopack | à discuter |
| — | `BulletinPort` et `ReferentielNationalPort` provisoires : sept mécanismes en dépendent, dont **le solde restant des prêts** | modules 2, 4 et 5 |
| — | Premier mois de gestion : point d'ancrage du chaînage des bulletins | module 2 |
| — | **Articles de base de connaissance non relus** : fiche société, et fiche salarié | relecture par le porteur |
| — | **Captures d'écran des articles** : automatisables avec Playwright (non installé). À mettre en place **en fin de 2.1.c**. Le prompt devra demander à Cursor de poser des marqueurs d'emplacement | fin 2.1.c |
| — | 26 requêtes SQL par lecture d'une fiche | à mesurer sur données réelles |
| — | Divergence des enveloppes de réponse module 1 / module 2 | assumée, ADR 0021 |
| — | **Dérive CRLF sous Windows** : avertissements à chaque `git add`. Un `.gitattributes` réglerait le problème | non fait, son propre commit |
| Z14 | Trois retouches sur la fiche société v7, **plus** l'AuditLog du module 1 sans `accountId` ni `companyId`, **plus** le champ Banque, **plus** les champs mois | prochain passage sur le module 1 |
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
- **`pnpm format`** corrige les écarts de formatage qui bloquent `format:check`.
- `madge` rapporte constamment **2 avertissements** — deux imports CSS. Bénins, à ne pas réinstruire.
- **Lancer les commandes une par une**, jamais en parallèle.
- **Voir le rendu en local — procédure complète, trois commandes** :
  1. `pnpm db:up`
  2. `pnpm --filter api dev`
  3. `pnpm --filter back-office dev`
  puis `http://localhost:3000`.
  **Ne jamais donner une procédure amputée sans dire quelle étape est déjà satisfaite.**
- **Après une migration ou un changement de seed, rejouer le seed** avant toute vérification visuelle.
- **`pnpm db:reset` demande une confirmation interactive (`y`) que Cursor ne peut pas fournir.** Il échoue systématiquement chez lui. **Ne pas le laisser chercher un contournement** : c'est au porteur de lancer cette commande.
- **Après une vérification visuelle sur les salariés de démonstration**, la base contient des lignes saisies à la main qui font échouer `pnpm verify`. Remède : **`pnpm db:reset` puis `pnpm db:seed`**. `db:reset` **ne rejoue pas le seed**.
- **`pnpm db:reset` change l'identifiant utilisateur de développement.** Le back-office affiche alors « Impossible de charger les sociétés ». Reporter la nouvelle valeur de `NEXT_PUBLIC_PAYMARH_USER_ID`, affichée par `pnpm db:seed`, dans `apps/back-office/.env`, puis **arrêter et relancer** le back-office : **Next ne relit pas ce fichier à chaud.**
- **Le seed crée trois salariés de démonstration** dans la société DEMO-001 : un complet et actif (**Youssef Bennani** — deux personnes à charge, deux comptes bancaires, **un prêt, deux saisies dont une de chaque type**), un minimal sans emploi, une salariée sortie de nationalité étrangère.
- **Quand un écran refuse de s'afficher**, la vraie erreur est dans le **terminal du back-office** — le helper de trace y écrit sur `stderr`.
- **Environnement PowerShell** : `curl` est un alias — utiliser `curl.exe` ou `Invoke-RestMethod`. `rmdir /s /q` n'existe pas — utiliser `Remove-Item -Recurse -Force`. **Les chemins contenant des crochets doivent être entre guillemets** dans un `git add`.
- **Commit manuel** : `git checkout -- apps/back-office/next-env.d.ts` → `git add <chemins>` → **`git status --short` pour vérifier ce qui est indexé** → `git commit -m "..."` → `git push`. **`next-env.d.ts` est régénéré par chaque `next build` et ne doit jamais être commité.**

---

## 17. Rappels de méthode

- Claude **cadre et décide avec le porteur d'abord**, puis fournit **un prompt Cursor complet** par prompt.
- Le prompt Cursor doit toujours : donner le contexte, **lister les fichiers à lire avant d'écrire**, rappeler le socle à réutiliser, délimiter le périmètre strict (à faire / à NE PAS faire), lister les `.md` à créer, poser des **critères d'acceptation vérifiables par un non-codeur**, exiger la **liste nominale des tests avec fichier et numéro de ligne**, exiger la section **« Décisions prises seul »**, exiger la section **« Ce que je n'ai pas pu tester honnêtement »**, exiger la **sortie brute de `pnpm verify` sans ellipse ni redirection**, exiger une **preuve d'échec** pour tout test de non-régression, et demander à Cursor de **s'arrêter et poser la question** si un choix n'est pas couvert.
- **Ouvrir le prompt par un point d'arrêt** dès qu'une décision dépend d'un fait du dépôt (§2.3), ou par un **rappel de faits à contredire** quand le point d'arrêt a déjà eu lieu (§2.4).
- **Le critère d'acceptation technique est `pnpm verify` vert chez le porteur.**
- **Après chaque prompt livré : vérification visuelle à l'écran**, avec une liste de points numérotés fournie par Claude. **Les points qui portent la raison d'être du temps doivent être signalés comme tels.** **Et après une correction issue d'une vérification visuelle, refaire une vérification visuelle.**
- Exiger que Cursor **propose toute dépendance avant installation**.
- Ne jamais introduire de logique métier hors du module en cours.
- **Vérifier systématiquement les rapports de Cursor** : arithmétique des tests, tests annoncés contre tests exigés, **chemin réellement emprunté par une preuve d'échec**, contrôles déclenchables contre contrôles théoriques, **mécanismes sans appelant**, **inférences déguisées en injections**, contraintes de production contre confort de test, fichiers hors périmètre modifiés, sortie brute contre résumé.
- **Quand Cursor s'arrête et pose une question, c'est le comportement attendu** — le lui dire. Quand il démonte son propre test, corrige un diagnostic erroné, contredit un prompt contradictoire ou déclare qu'une correction est un pansement, aussi.
- **Claude signale au porteur quand ouvrir une nouvelle conversation** est optimal, et fournit ce document mis à jour à ce moment-là.
- **Claude indique le modèle et l'effort à paramétrer à la fin de CHAQUE message, sans exception** (voir §2.1).
