# ADR 0015 — Port référentiel national (phase 2)

- **Statut :** accepté
- **Date :** 2026-09-03
- **Portée :** alertes conditionnées au référentiel national (module 2, étape 2.1.b-3)

---

## Contexte

Certaines alertes (SMIG, durée légale du travail, âge maximal d'un enfant à charge) dépendent de seuils qui vivent dans le référentiel national. En phase 2, **aucune table** de référentiel n'existe encore (modules 4 et 5).

---

## Décision

Exposer un **port** (`ReferentielNationalPort`) avec une lecture par clé et par mois (`AAAA-MM`). Une implémentation provisoire ne rend **aucune** valeur.

Quand la valeur est absente, l'alerte correspondante **n'est pas émise**. Aucune valeur par défaut, aucun seuil codé en dur (P6) : un seuil inventé produirait une alerte fausse, pire qu'une alerte absente.

---

## Conséquences

- Les tests doublent le port pour prouver C19 et C20 lorsque des seuils sont fournis.
- Le remplacement par les modules 4/5 ne change pas le contrat du port côté fiche salarié.

---

## Alternatives rejetées

| Alternative | Motif |
| --- | --- |
| Table locale en phase 2 | Hors périmètre ; duplication future |
| Seuil par défaut (ex. SMIG fixe) | Alertes fausses possibles |
| Ignorer les alertes définitivement | Perte de couverture métier dès que le référentiel existe |
