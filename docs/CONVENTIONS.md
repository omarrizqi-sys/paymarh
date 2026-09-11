# Conventions de code

Ces conventions ne sont pas des préférences esthétiques : chacune existe pour éviter un problème concret. Elles s'appliquent à tout le dépôt.

---

## 1. Nommage mixte : anglais technique, français réglementaire

C'est la règle la plus importante à comprendre, et la plus facile à enfreindre par réflexe.

**Les identifiants techniques sont en anglais.** Tout ce qui relève de l'informatique : `id`, `createdAt`, `findAll`, `TenantContext`, `accountId`, `HealthResponse`.

**Les termes métier réglementaires marocains restent en français, jamais traduits :**

| À écrire                | À ne jamais écrire   |
| ----------------------- | -------------------- |
| `salarie`               | `employee`           |
| `bulletin`              | `payslip`            |
| `cotisationCNSS`        | `socialContribution` |
| `cotisationAMO`         | `healthInsurance`    |
| `IR`                    | `incomeTax`          |
| `declaration`           | `filing`             |
| `anciennete`            | `seniority`          |
| `indemniteLicenciement` | `severancePay`       |

Pourquoi : `cotisationCNSS` désigne une réalité réglementaire marocaine précise, avec ses taux, ses plafonds et ses exonérations. « socialContribution » ne désigne rien. Traduire un terme réglementaire, c'est perdre le lien avec le texte de loi qui le définit, et rendre impossible toute relecture par un expert-comptable.

**Les commentaires sont en français**, y compris dans le code technique. Le porteur du projet doit pouvoir relire et comprendre.

> Note : les identifiants sont écrits **sans accent** (`salarie`, pas `salarié`) pour éviter tout problème d'encodage entre systèmes. Le **contenu rédactionnel** (commentaires, documentation, articles) utilise le français accentué normal.

---

## 2. Calcul monétaire : décimal exact, jamais de flottant

**Aucun montant ne transite jamais par un `number`.**

```ts
// INTERDIT — la virgule flottante est imprécise
const brut = 12000.5;
const cotisation = brut * 0.0448;

// CORRECT — decimal.js
import Decimal from 'decimal.js';

const brut = new Decimal('12000.50');
const cotisationCNSS = brut.times('0.0448');
```

- **En base :** type `Decimal` de Prisma, qui produit un `NUMERIC` PostgreSQL.
- **En code :** `decimal.js`.
- **Aux frontières** (JSON, saisie utilisateur) : les montants circulent en **chaîne de caractères**, jamais en nombre, pour qu'aucune conversion flottante ne s'insère silencieusement.
- **Les arrondis sont explicites** : on utilise les modes d'arrondi de `decimal.js`, jamais `Math.round`.

Pourquoi : `0.1 + 0.2 === 0.30000000000000004`. Sur une paie, cet écart se cumule et finit en litige avec la CNSS ou la DGI.

**Ce n'est pas qu'une consigne** : ESLint refuse `parseFloat`, `Number.parseFloat` et `Math.round` avec un message explicite (voir `packages/config/eslint/base.js`).

---

## 3. Filtrage par tenant sur chaque requête

Toute lecture ou écriture de données part d'une fonction de `apps/api/src/common/tenancy/tenant-scope.ts`.

```ts
// INTERDIT — le `where` est écrit à la main, rien ne garantit l'isolation
const societes = await this.prisma.company.findMany({
  where: { name: { contains: recherche } },
});

// CORRECT — le filtre par compte fait partie de la requête
const societes = await this.prisma.company.findMany({
  where: { ...accountScope(context), name: { contains: recherche } },
});
```

Trois règles qui en découlent :

1. **Toujours `findFirst` plutôt que `findUnique` lorsqu'on cherche par identifiant.** `findUnique({ id })` ne peut pas accueillir le filtre par compte : on retrouverait la ressource d'autrui avant de pouvoir la refuser.
2. **Répondre 404, pas 403**, pour une ressource appartenant à un autre compte. « Interdit » révélerait son existence.
3. **Tout nouveau contrôleur qui touche à des données** doit porter `@UseGuards(TenantGuard)` et être déclaré dans le middleware de `app.module.ts`.

---

## 4. Imports ESM : l'extension `.js` dans l'API

**Cette règle ne concerne que `apps/api`.**

NestJS 12 est distribué uniquement en ESM, donc l'API est un paquet ESM (`"type": "module"`). En ESM, Node exige que **tout import relatif porte une extension de fichier**. Et cette extension est celle du fichier **compilé** (`.js`), pas celle du fichier source (`.ts`).

```ts
// apps/api — CORRECT
import { HealthService } from './health.service.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';

// apps/api — INCORRECT : Node refusera de démarrer
import { HealthService } from './health.service';
```

**Oui, le fichier sur le disque s'appelle bien `health.service.ts`.** On écrit `.js` parce qu'on désigne le fichier tel qu'il existera après compilation. C'est déroutant la première fois ; c'est la norme ESM.

Deux exceptions, où l'on n'écrit **pas** d'extension :

- les **paquets npm** : `import { Injectable } from '@nestjs/common';`
- le **back-office** : Next.js utilise un empaqueteur (`moduleResolution: "Bundler"`), qui résout les imports sans extension. On y écrit `import { cn } from '@/lib/utils';`

Le raisonnement de ce choix est consigné dans [`adr/0002-modules-esm.md`](./adr/0002-modules-esm.md).

---

## 5. Types partagés : définis une seule fois

La forme d'un `Account`, d'une `Company`, d'un `User` est définie **exclusivement** dans `packages/shared-types`. Ni l'API ni le back-office ne la redéclarent.

Si un type doit changer, il change à un seul endroit, et TypeScript signale immédiatement tous les appelants concernés.

---

## 6. Nommage des fichiers et des dossiers

**Fichiers et dossiers techniques : minuscules, tirets, sans accent ni majuscule.**

```
CORRECT                              INCORRECT
tenant-context.service.ts            TenantContextService.ts
base-de-connaissance/                Base de Connaissance/
calcul-anciennete.ts                 calculAncienneté.ts
```

Pourquoi : Windows ne distingue pas la casse, Linux si. Un fichier importé sous un nom et enregistré sous un autre fonctionne sur la machine du développeur et casse en production. Les accents, eux, provoquent des problèmes d'encodage entre systèmes.

**Suffixes NestJS** (imposés par le framework) : `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.guard.ts`, `*.middleware.ts`, `*.spec.ts`.

**Seules exceptions en majuscules :** les fichiers de documentation à la racine ou dans `docs/` (`README.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`), par convention universelle.

---

## 7. Structure des dossiers

```
apps/api/src/
├── common/            infrastructure transverse (tenancy, audit, prisma)
├── modules/           un dossier par domaine fonctionnel
│   └── <domaine>/     <domaine>.module.ts + .controller.ts + .service.ts
├── payroll-engine/    moteur pur — aucune I/O, jamais
└── deliverables/      port de stockage d'objets
```

- **Un fichier, une responsabilité.** Si un service dépasse ~200 lignes, il faut le découper.
- **Pas d'import circulaire.** `pnpm check:circular` le vérifie ; le script doit rester vert.
- **`common/` ne dépend jamais de `modules/`.** L'inverse est normal.

---

## 8. TypeScript strict

Le mode strict est activé partout, avec en plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns` et `noFallthroughCasesInSwitch`.

- **`any` est interdit.** Utiliser `unknown` puis restreindre par une vérification explicite (voir `estHealthResponse()` dans le back-office pour un exemple).
- **Les données venant de l'extérieur sont validées**, jamais supposées conformes : `class-validator` côté API, garde de type côté front.

---

## 9. Commentaires

On commente **pourquoi**, pas **quoi**.

```ts
// INUTILE — le code le dit déjà
// Incrémente le compteur
compteur += 1;

// UTILE — explique une contrainte invisible
// `findFirst` et non `findUnique` : on veut que le filtre par compte fasse
// partie de la recherche elle-même. Avec `findUnique({ id })`, on trouverait
// la société d'un AUTRE compte avant de pouvoir la refuser.
```

Les décisions contre-intuitives, les contraintes réglementaires et les pièges méritent toujours un commentaire. Le reste, non.

---

## 10. Tests

- Un lanceur unique : **Vitest**, depuis la racine (`pnpm test`).
- Les tests vivent **à côté du code** qu'ils vérifient (`*.spec.ts`), sauf les tests transverses, placés dans `apps/api/test/`.
- **Ce qui doit impérativement être testé :** tout ce qui touche à l'isolation multi-tenant et, à l'avenir, tout calcul de paie. Ce sont les deux endroits où une régression est grave.
- On privilégie l'instanciation directe des classes plutôt que le conteneur d'injection : les tests restent rapides et ne dépendent d'aucune infrastructure.

---

## 11. Git

- Une branche par module : `module-1-fiches`, `module-2-traitement-du-mois`…
- Messages de commit à l'impératif, en français : `Ajoute le filtrage par société sur les fiches`.
- **Le fichier `.env` n'est jamais versionné.** Seul `.env.example`, avec des valeurs factices, l'est.

---

## 12. Tables back-office — module 2

Dans le **module 2**, une table qui **ne trie ni ne pagine côté client** n'utilise **pas** TanStack Table.

On compose directement les composants shadcn `Table` (`TableHeader`, `TableBody`, etc.). TanStack Table apporte tri et pagination client : l'afficher sur une liste paginée par curseur côté serveur, ou sur un tableau sans tri autorisé, créerait des affordances trompeuses.

**Premier cas d'application :** la liste des salariés (2.1.c-1). **Prochains cas :** les sept tableaux répétables de la fiche salarié (2.1.c-2).

**Hors périmètre :** la liste des sociétés (module 1), qui trie et pagine entièrement côté client et conserve TanStack Table.

---

## 12.1 Ce que l'écran retient d'une réponse d'écriture — CRITIQUE (module 2)

**Règle générale :** les routes POST, PATCH et DELETE des tableaux renvoient la fiche entière, relue en base. L'écran **ne l'applique jamais en bloc**. Il n'en retient que **deux choses** :

- le nouveau numéro de version ;
- la ligne portant l'identifiant concerné par l'appel.

**Exception — comptes bancaires (PUT groupé) :** le `PUT /salaries/:id/comptes-bancaires` remplace toute la liste ; il n'existe pas « une » ligne concernée. Pour cette rubrique seule, l'écran retient le **numéro de version** et **l'intégralité du bloc `comptesBancaires`** de la réponse. Rien d'autre. Voir ADR 0023.

---

## 13. Enveloppe générique des tableaux répétables (module 2)

L'enveloppe (`EnveloppeTableauRepetable`) porte **l'enveloppe seulement** :

- tableau en lecture seule (shadcn `Table`, pas TanStack Table) ;
- bouton **Ajouter** ;
- dépliage du formulaire sous la ligne cliquée, sur toute la largeur ;
- un seul formulaire ouvert par page (mécanisme au niveau page via `FormulaireTableauProvider`) ;
- boutons **Valider la ligne** / **Annuler la ligne** (replient sans appel serveur) ;
- lignes non enregistrées en dernier avec mention « non enregistrée » ;
- lignes inactives grisées, formulaire en lecture seule, bouton Supprimer absent du DOM ;
- **pas de colonne « État »** : le mot « état » désigne un état métier (active / inactive / supprimée). Les mentions « non enregistrée », « inactive depuis MM/AAAA » et « en erreur » sont portées **dans une colonne métier** choisie par le tableau consommateur (`idColonneMarque`), sous la valeur de la ligne ; le fond `bg-destructive/5` signale aussi une ligne en erreur ;

**`etat` d'une ligne historisée : trois valeurs.** L'API déduit `'ACTIVE'`, `'PAS_ENCORE_EFFECTIVE'` ou `'CLOTUREE'` (`EtatLigneFiche`, voir ADR 0026). `'PAS_ENCORE_EFFECTIVE'` : `moisEffetDebut` postérieur au mois en cours (ligne normale, modifiable). `'CLOTUREE'` : `moisEffetFin` atteint. L'écran ne grise ni ne verrouille que dans ce second cas (`estLigneTableauCloturee` = `etat === 'CLOTUREE'`, passée à `estInactive` de l'enveloppe). Le libellé utilisateur d'une ligne clôturée reste « inactive depuis MM/AAAA ».

- suppression locale immédiate pour les lignes jamais enregistrées ;
- **confirmation de suppression injectée** via `suppression: { preparer, confirmer }` : le tableau appelant prépare les textes (titre propre + message serveur via `textesSuppressionHistorisee` ou variante différée), l'enveloppe affiche la fenêtre, gère l'attente (grisage des boutons Supprimer, signal `onAttenteSuppressionChange`) et la reprise si `confirmer` renvoie `{ type: 'recommencer' }`. L'enveloppe **ne connaît aucun client d'appel ni code de refus** ;
- prop `verrouille` : grise champs et boutons pendant l'enregistrement global (une rubrique à la fois, voir points ouverts).

Les textes partagés des tableaux historisés vivent dans `textes-suppression-tableau-historise.ts` (variante `historise` avec message serveur, variante `differee` pour comptes bancaires). Seul le **titre** est propre à chaque tableau.

Les quatre chemins d'écriture d'un tableau ligne à ligne — saisie locale, enregistrement réussi, suppression immédiate réussie, suppression locale d'une ligne jamais enregistrée — écrivent **tous** les states **et** les `ref` correspondantes, dans l'updater du state, à partir de la valeur calculée. Sans exception. Le registre lit ces `ref` pour savoir si la rubrique est modifiée.

L'enveloppe **ne connaît aucun nom de tableau particulier** : pas de condition « si tel tableau ».

L'enveloppe **ne porte pas** de générateur de formulaire : chaque tableau écrit son formulaire à la main. Cette décision est figée.

Elle reçoit du tableau consommateur : colonnes, `idColonneMarque`, rendu du formulaire, callbacks d'envoi, objet `suppression` injecté.

### Suppression de la fiche salarié (rail)

La suppression d'une **fiche entière** ne passe **pas** par l'enveloppe. Le rail (`RailActionsFiche`) monte lui-même le composant partagé `DialogueConfirmationSuppressionTableau` (variante `fiche` dans `textes-suppression-tableau-historise.ts`).

Différences avec la suppression d'une ligne de tableau historisée :

- **Pas de `mode`** dans l'aperçu : le serveur renvoie un seul `message`, affiché tel quel.
- **Pas de reprise du jeton** : le jeton ne dépend que de l'identifiant du salarié ; la fenêtre ne propose pas de relancer l'aperçu après un refus.
- **Pas de mention « suppression immédiate »** : la phrase sur le bouton Annuler de la fiche ne s'applique qu'aux lignes de tableau.
- **Phrase distincte** si la fiche porte des modifications non enregistrées : « Vos modifications non enregistrées seront perdues. »
- **Libellé d'annulation** : « Garder le salarié » (le rail porte déjà un bouton « Annuler » pour la saisie).
- **Succès** : retour à la liste des salariés de la société, sans message éphémère.

Pendant l'aller-retour, le rail signale `ecritureHorsSequenceEnCours` comme pour une suppression de ligne ; le signal de fin part au succès **et** à l'échec.

---

## 14. Chaînes d'affichage et exceptions API

**Règle générale :** aucune chaîne destinée à l'affichage ne sort de l'API ; l'écran compose les phrases à partir des données. **Deux exceptions nommées** : situations familiales (libellés accordés en genre) et message d'aperçu avant suppression de ligne de tableau — détail ci-dessous.

**Exceptions nommées :**

1. **Situations familiales** — la liste déroulante accorde ses libellés en genre à partir du sexe saisi localement, parce qu'elle affiche des valeurs non encore choisies. Le libellé de la valeur enregistrée (`fiche.situationFamiliale.libelle`) vient du serveur.

2. **Message d'aperçu avant suppression de ligne de tableau** — le champ `message` renvoyé par `GET …/impact-suppression` est affiché tel quel. Seul le serveur sait si la ligne sera supprimée définitivement ou rendue inactive, et pourquoi.

### Structure unique d'un refus

Un refus — de forme (ValidationPipe) ou métier — sort **toujours** sous la même forme, jamais un tableau de phrases anglaises :

```json
{ "code": "CHAMP_OBLIGATOIRE", "message": "Ce champ est obligatoire.", "champ": "nom" }
```

`message` est une chaîne française. `champ` désigne **un seul** champ (le premier en erreur, ordre de déclaration du DTO). Voir [`adr/0029-traduction-refus-forme.md`](./adr/0029-traduction-refus-forme.md).

---

## 15. Écran de création d'un salarié

La création d'un salarié n'est **pas une fiche**. Route : `/societes/[id]/salaries/nouveau`. Composants dans `apps/back-office/src/components/salaries/creation/`.

**Les quatre blocs d'identité sont importés depuis `fiche/`, jamais copiés.** Identité, Identifiants et immatriculations, Coordonnées, Dates clés — dans cet ordre (celui de la fiche, tableaux exclus). Un champ ajouté à un bloc sert les deux écrans.

La fiche envoie chaque rubrique séparément (`RubriqueEnregistrable`). La création livre les valeurs sans les envoyer (`RubriqueCreable`, quatre implémenteurs) et émet **un seul** `POST /salaries`. Voir [`adr/0028-registre-creation-salarie.md`](./adr/0028-registre-creation-salarie.md).

À la création : le matricule reste saisi (facultatif, phrase d'aide sous le champ) ; la date de sortie et l'état actif/inactif sont absents du DOM. Un champ facultatif vide après trim est omis du corps, pas envoyé vide. `dateNaissance` est facultative (reprise de dossier). `nom`, `prenom` et `dateEntree` ne peuvent pas être vides — voir [`adr/0030-champs-jamais-vides-date-naissance.md`](./adr/0030-champs-jamais-vides-date-naissance.md).

---

## 16. Navigation gardée et saisie perdable — CRITIQUE

Certains écrans portent de la saisie locale (fiche salarié, création salarié ; plus tard fiche / création société). Si l'utilisateur quitte l'écran — lien interne, en-tête global, fermeture d'onglet — sans enregistrer, la saisie serait perdue **sans message**. Next.js 16 ne propose aucun garde routeur central.

### Deux modules, deux rôles

| Module                                             | Rôle                                                                                               |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `components/navigation/saisie-perdable-racine.tsx` | Fournisseur **racine** : l'écran à saisie **se déclare** au montage et **se retire** au démontage. |
| `components/navigation/navigation-gardee.tsx`      | **Seule** porte de sortie navigation (`LienGarde`, `useNavigationGardee`).                         |

La coquille (`EnveloppeNavigationRacine` dans `layout.tsx`) monte les deux **au-dessus** de l'en-tête et du contenu.

### Ajouter un écran à saisie (3 lignes utiles)

Dans le composant client, **à l'intérieur** du registre ou état qui sait si la saisie a changé :

```tsx
import { useDeclarerSaisiePerdable } from '@/components/navigation/saisie-perdable-racine';

function DeclarerMonEcran() {
  const { aModifications, libellesModifies } = useMonRegistre();
  useDeclarerSaisiePerdable(aModifications, libellesModifies);
  return null;
}
```

Montez `<DeclarerMonEcran />` une fois dans l'écran. Au démontage, la déclaration est retirée automatiquement — **obligatoire** pour que l'en-tête ne demande plus confirmation sur un écran sans saisie.

Ajoutez aussi `AvertissementNavigation…` (`beforeunload`) si l'écran peut perdre de la saisie à la fermeture d'onglet (voir `avertissement-navigation.ts`).

### Ajouter un lien dans l'en-tête

**Ne pas** importer `next/link` dans `navigation-en-tete.tsx`. Utilisez `LienGarde` — la rècle ESLint couvre ce fichier.

### Navigation dans la zone fiche / création salarié

| Besoin                                                   | Utiliser                          | Ne jamais importer               |
| -------------------------------------------------------- | --------------------------------- | -------------------------------- |
| Lien vers une autre page                                 | `LienGarde`                       | `Link` de `next/link`            |
| Navigation depuis du code (`push`, retour, remplacement) | `useNavigationGardee()`           | `useRouter` de `next/navigation` |
| Recharger la page courante (même URL, données serveur)   | `useNavigationGardee().refresh()` | —                                |

**Comportement :** s'il y a des modifications non enregistrées, une fenêtre s'ouvre (« Quitter cette page ? » / « Rester »). Sinon, la navigation part immédiatement. Après une création ou une suppression réussie, le registre est remis propre avant la navigation : la fenêtre ne s'ouvre pas.

**Périmètre ESLint :** composants `fiche/`, `creation/`, routes `…/salaries/[salarieId]` et `…/salaries/nouveau`, plus `navigation/navigation-en-tete.tsx`. La **liste** des salariés est exclue (pas de saisie). Voir [`adr/0031-garde-navigation-fiche-creation.md`](./adr/0031-garde-navigation-fiche-creation.md).

**Exemple — bouton « Retour à la liste » :**

```tsx
import { LienGarde } from '@/components/navigation/navigation-gardee';

<LienGarde href={`/societes/${companyId}/salaries`}>← Retour à la liste</LienGarde>;
```

**Exemple — redirection après une action réussie :**

```tsx
const { push } = useNavigationGardee();
// … action réussie, registre remis propre …
push(`/societes/${companyId}/salaries/${salarieId}`);
```

Un import direct de `next/link` ou `useRouter` dans la zone protégée **échoue au lint** avec un message indiquant le module et la fonction de remplacement.
