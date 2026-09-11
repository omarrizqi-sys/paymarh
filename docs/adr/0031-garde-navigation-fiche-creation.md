# ADR 0031 — Garde de navigation fiche et création

- **Date :** 2026-09-10 (complété 2026-09-11)
- **Statut :** accepté
- **Contexte :** étape 2.1.c, temps 3, prompts 3-3 et correctif coquille

## Contexte

Sur la fiche salarié et l’écran de création, l’utilisateur peut saisir des modifications non enregistrées. La fermeture d’onglet est couverte par `beforeunload`. En revanche, un lien interne Next.js change d’écran sans rien demander : la saisie est perdue en silence.

Next.js 16 (App Router) n’expose **aucun** intercepteur central pour `router.push`, le retour navigateur ou un `<Link>`. Il n’existe donc pas de « garde routeur » unique à poser sur l’application.

### Périmètre initial incomplet (prompt 3-3)

Le garde posé sur les liens **de la fiche et de la création** fonctionnait, mais les liens **« VECTA »** et **« Sociétés »** de l’en-tête global (`app/layout.tsx`) restaient des `<Link>` Next standards. L’en-tête et le contenu de page sont **frères** dans l’arbre : le registre de saisie est monté dans le contenu, donc un contexte React ne remonte pas vers l’en-tête. Remonter seulement `NavigationGardeeProvider` ne suffirait pas : il doit lire le registre, qui ne peut être qu’**en dessous** de lui.

## Décision

### Module unique + règle ESLint

Deux parties indissociables :

1. **Un module unique** (`components/navigation/navigation-gardee.tsx`) par lequel passe toute navigation qui quitte un écran protégé. Il ouvre une fenêtre de confirmation applicative lorsque des modifications non enregistrées sont signalées.

2. **Une règle `no-restricted-imports`** (ESLint natif), restreinte aux dossiers fiche, création, leurs routes et la navigation d’en-tête, qui interdit `next/link` et les imports navigateurs de `next/navigation` (`useRouter`, `redirect`, `permanentRedirect`). Seul le module de navigation est exempté.

Sans la règle, la contrainte tient tant que quelqu’un s’en souvient. Avec elle, un import direct ne compile pas.

### Renversement du sens de circulation (correctif coquille)

Au lieu de faire **descendre** le garde vers le registre (impossible depuis l’en-tête), un **`SaisiePerdableRacineProvider`** monté à la racine expose une question simple : « y a-t-il quelque chose à perdre ? ». Chaque écran à saisie **se déclare** au montage (lecteurs `aModifications` / `libellesModifies`) et **se retire** au démontage. L’en-tête et tout composant sous la racine consultent cette réponse via `NavigationGardeeProvider`.

Ce n’est **pas** un second registre : le fournisseur racine ne stocke aucune valeur de formulaire, seulement le lecteur fourni par l’écran actif.

Emplacement **neutre** (`components/navigation/`) : la coquille de toute l’application ne dépend plus du module salarié. Le dialogue de confirmation partagé (`dialogue-confirmation-suppression-tableau.tsx`) y est déplacé aussi (déménagement, pas réécriture).

### Aucune variante non gardée

Le module n’expose **aucune** porte de sortie non gardée (`push` « direct », `Link` brut, etc.). Une variante « sans confirmation » serait empruntée par facilité le jour où la fenêtre gêne. Le seul cas non gardé est `refresh()` : la page reste la même, il n’y a rien à perdre (rechargement serveur après conflit de version).

Formes couvertes : `LienGarde`, `push`, `replace`, `back`, `forward`, `refresh`.

### Fenêtre applicative

Réutilisation de `DialogueConfirmationSuppressionTableau` (variante `differee`) :

- Titre : « Quitter cette page ? »
- Corps : message + liste des rubriques concernées
- Boutons : « Quitter cette page » / « Rester »

Pas de troisième bouton « Enregistrer puis quitter » (chantier à part entière).

L’avertissement natif à la fermeture d’onglet (`beforeunload`) s’applique à la fiche **et** à la création salarié.

### Liste des salariés hors périmètre

La liste ne contient aucune saisie : rien à perdre en la quittant. Un garde-fou qui se déclenche là où il n’y a rien à protéger finit par être ignoré.

### Navigations après succès : pas d’exemption, registre propre

Les navigations après création réussie ou suppression réussie passent par la version **gardée**, sans exemption dédiée. Avant la navigation, le registre est remis propre (`annuler()`), de sorte que la fenêtre ne s’ouvre pas — par construction, pas par contournement.

### Module 1 (fiche / création société) — point ouvert

Les écrans société portent la même vulnérabilité mais ne sont **pas** branchés dans ce correctif. Le mécanisme de déclaration est volontairement **générique** pour les accueillir plus tard sans modifier le fournisseur racine.

## Conséquences

- Tout bouton ou lien futur dans la zone fiche/création ou l’en-tête doit utiliser `LienGarde` ou `useNavigationGardee()`.
- Chaque nouvel écran à saisie doit appeler `useDeclarerSaisiePerdable()` (voir `CONVENTIONS.md` §16).
- `RubriqueCreable` expose `estModifiee()` pour que le registre de création alimente le garde comme celui de la fiche.
- Les routes serveur conservent `notFound` ; seuls les outils de changement d’écran client sont restreints.
