# Base de connaissance PaymaRH

Ce dossier est la **source unique** des articles du futur blog en dur de PaymaRH.

Il n'y a pas d'autre endroit où rédiger de la documentation utilisateur : pas de Notion, pas de Google Docs, pas de wiki. Les articles vivent ici, dans le dépôt, versionnés avec le code qu'ils décrivent.

> **État au module 0 :** ce dossier ne contient que ce README et le gabarit. **Aucun article métier**, puisqu'aucune fonctionnalité utilisateur n'existe encore. Le site PaymaRH n'existe pas non plus : rien n'est publié.

---

## Pourquoi les articles vivent avec le code

Une documentation séparée du code diverge. Systématiquement, et vite. Une fonctionnalité change, l'article reste, et l'utilisateur suit des instructions qui ne correspondent plus à ce qu'il voit à l'écran.

En gardant les articles dans le dépôt, le changement de comportement et la mise à jour de l'article arrivent dans **la même branche**, au même moment, relus ensemble.

---

## Le pipeline en deux temps

C'est le point le plus important de ce document.

### Temps 1 — Le brouillon, capturé au fil du développement

**Quand :** à chaque module validé.

**Par qui :** celui qui vient de construire la fonctionnalité — c'est le moment où il sait exactement ce qu'elle fait, où sont les pièges, et ce qui va bloquer les utilisateurs.

**Comment :** copier `_gabarit-article.md`, le remplir, laisser `status: "draft"`.

**Objectif :** capturer la **matière**. Pas la forme. On écrit ce que fait la fonctionnalité, la marche à suivre pas à pas, les erreurs fréquentes. On ne s'occupe ni du style, ni du référencement, ni des illustrations.

Un brouillon un peu brut mais exact vaut infiniment mieux qu'un article parfait écrit six mois plus tard par quelqu'un qui reconstitue la fonctionnalité de mémoire.

### Temps 2 — La finition, avant publication

**Quand :** au moment de préparer la mise en ligne du site.

**Ce qu'on fait :** relecture éditoriale, harmonisation du ton, ajout des captures d'écran, travail du référencement (titre, méta-description, mots-clés, maillage interne), vérification que la fonctionnalité décrite correspond toujours à la réalité.

**Puis :** passer `status: "published"`.

### Pourquoi séparer les deux

Parce que ce sont deux métiers différents, à deux moments différents.

Vouloir écrire un article prêt à publier pendant le développement ralentit le développement et produit un article qui devra de toute façon être retravaillé. Vouloir tout écrire à la fin produit des articles imprécis, parce que les détails se sont perdus.

---

## Nommage des fichiers

**Minuscules, tirets, sans accent.**

```
CORRECT      creer-une-fiche-salarie.md
             calculer-la-cotisation-cnss.md
             cloturer-le-mois-de-paie.md

INCORRECT    Créer une fiche salarié.md
             creer_fiche_salarie.md
             CreerFicheSalarie.md
```

Le nom du fichier **doit être identique au `slug`** du front-matter, puisque c'est lui qui deviendra l'URL de l'article : `paymarh.ma/blog/creer-une-fiche-salarie`.

Pourquoi sans accent ni majuscule : les accents posent des problèmes d'encodage dans les URL, et la casse se comporte différemment selon les systèmes de fichiers. Une URL propre est aussi meilleure pour le référencement.

Le **contenu** de l'article, lui, est rédigé en français normalement accentué. La contrainte ne porte que sur le nom du fichier.

Les fichiers commençant par un underscore (`_gabarit-article.md`) sont des fichiers de travail : ils ne seront jamais publiés.

---

## Utiliser le gabarit

```bash
# Linux / macOS
cp _gabarit-article.md creer-une-fiche-salarie.md

# Windows PowerShell
Copy-Item _gabarit-article.md creer-une-fiche-salarie.md
```

Puis remplir le front-matter — le bloc `---` en tête de fichier — et le corps.

### Les champs du front-matter

| Champ         | Rôle                                  | Piège à éviter                                                                       |
| ------------- | ------------------------------------- | ------------------------------------------------------------------------------------ |
| `title`       | Titre affiché **et** balise `<title>` | Ni trop court, ni trop long : ~60 caractères                                         |
| `slug`        | Identifiant d'URL                     | **Doit être identique au nom du fichier**, et ne plus jamais changer une fois publié |
| `description` | Méta-description affichée par Google  | ~155 caractères, doit donner envie de cliquer                                        |
| `keywords`    | Mots-clés                             | Les termes réels que cherchent les gestionnaires de paie marocains                   |
| `category`    | Regroupement thématique               | Réutiliser une catégorie existante plutôt qu'en inventer une                         |
| `module`      | Module PaymaRH concerné               | Permet de retrouver les articles à mettre à jour quand un module change              |
| `status`      | `draft` ou `published`                | Rien ne se publie sans passer par le temps 2                                         |
| `order`       | Ordre d'affichage dans la catégorie   |                                                                                      |
| `date`        | Date de rédaction, `AAAA-MM-JJ`       |                                                                                      |
| `author`      | Auteur                                |                                                                                      |
| `cover`       | Image de couverture                   | Optionnel                                                                            |

> **Le `slug` ne change jamais après publication.** Le modifier casse tous les liens existants et fait perdre le référencement acquis.

### La trame du corps

Quatre sections, dans cet ordre, pour tous les articles :

1. **À quoi ça sert** — le besoin métier, avant le mode d'emploi
2. **Comment faire (pas-à-pas)** — les étapes numérotées, telles qu'on les voit à l'écran
3. **Cas d'erreur fréquents** — ce qui bloque en pratique, et comment s'en sortir
4. **Questions liées** — liens vers les articles voisins

Cette régularité aide autant le lecteur (il sait où chercher) que le référencement (structure prévisible, en-têtes cohérents).

---

## Écrire pour un gestionnaire de paie

Le lecteur type est un professionnel de la paie marocaine. Il connaît son métier — souvent mieux que nous — mais découvre PaymaRH.

- **Employer son vocabulaire.** On écrit « bulletin », « salarié », « cotisation CNSS », « AMO », « IR », « déclaration ». Jamais de traduction anglaise, jamais de jargon technique.
- **Décrire ce qu'il voit à l'écran.** « Cliquez sur _Ajouter un salarié_ », avec le libellé exact du bouton.
- **Ne pas expliquer la paie**, sauf lorsque PaymaRH fait un choix particulier qu'il faut justifier.
- **Traiter les cas d'erreur sérieusement.** C'est la section la plus consultée : on y arrive quand on est bloqué.

---

## Discipline pour la suite

> **À chaque module futur validé, un brouillon d'article est ajouté ici, selon le gabarit.**

Un module n'est pas terminé tant que son brouillon n'existe pas. C'est aussi contraignant que les tests ou le lint, et pour la même raison : ce qui n'est pas fait au moment où c'est facile ne se fait jamais.
