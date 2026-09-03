# ADR 0019 — Non-réutilisation des matricules

- **Statut :** accepté
- **Date :** 2026-09-03
- **Portée :** module 2 (attribution des matricules à la création d'un salarié)

---

## Contexte

Un matricule identifie une personne dans les déclarations sociales, les dossiers papier et les historiques externes. Deux personnes portant successivement le même matricule rendent tout rapprochement impossible.

Jusqu'à cette décision, le compteur de matricules s'initialisait depuis les salariés encore présents. Un salarié peut être supprimé tant qu'aucun bulletin n'existe : sa valeur redevenait disponible, y compris pour une saisie manuelle.

La fonction `calculerProchainMatricule` (étape 2.1.a) savait déjà ignorer une valeur passée en entrée. Rien ne persistait ces valeurs, et le chemin de création ne l'appelait pas.

---

## Décision

### Persistance par société

Toute valeur de matricule attribuée dans une société — automatiquement ou saisie à la main — est marquée consommée (`MatriculeConsomme`, clé `(companyId, valeur)`).

Le marquage survit à la suppression du salarié. Il est **propre à la société** : la même valeur reste librement attribuable dans une autre société, y compris du même compte (C22, P2).

### Écriture transactionnelle

Le marquage s'écrit dans **la même transaction** que la création du salarié. Une création qui échoue ne laisse aucune valeur consommée. Un marquage qui échouerait après une création réussie rouvrirait le trou : ce n'est pas un enchaînement en deux temps.

### Branchement de `calculerProchainMatricule`

La génération automatique lit les valeurs consommées de la société et les passe à `calculerProchainMatricule`. Cette fonction est atteinte par le chemin de création, à chaque allocation automatique. Le compteur s'initialise et s'avance à partir de ce résultat, pas à partir des seuls salariés encore en poste.

Matricule vide à la création : le compteur attribue la prochaine valeur non consommée (plus grand suffixe numérique du préfixe, plus un).

Matricule saisi déjà consommé, même par un salarié supprimé : **blocage**, message exactement « Cette valeur n'est pas disponible. ». Aucune indication qu'une fiche a existé (P1).

### Limite connue : reprise de dossier

Un dossier repris ne contient aucune valeur consommée antérieure. L'historique d'avant la reprise n'existe pas. Ce n'est pas contournable : on ne reconstitue pas des suppressions dont on n'a plus trace.

La migration qui crée `MatriculeConsomme` recopie les matricules des salariés encore présents. Les valeurs des fiches déjà supprimées avant cette migration sont dans le même cas : perdues, non récupérables.

---

## Conséquences

- Aucun nouvel endpoint. Le contrôle d'unicité existant consulte désormais aussi les valeurs consommées.
- Les autres compteurs (numéro d'ordre d'emploi) ne sont pas concernés.
- Aucune exemption, aucun écran.
