# ADR 0013 — Verrouillage optimiste (fiche salarié)

- **Statut :** accepté
- **Date :** 2026-09-03
- **Portée :** fiche salarié et emplois, étape 2.1.b

---

## Contexte

Deux gestionnaires peuvent modifier la même fiche simultanément. Sans garde-fou, la dernière écriture écrase silencieusement la première.

---

## Décision

1. Champ entier `version`, valeur initiale 0, sur les tables **`Salarie`** et **`Emploi`** uniquement.
2. Toute requête d'écriture porte l'en-tête **`If-Match`** avec la version lue :
   - en-tête absent → **428**, code `EN_TETE_IF_MATCH_REQUIS` ;
   - version obsolète → **409**, code `CONFLIT_VERSION`.
3. L'incrément de version se fait dans la **même opération** SQL que la mise à jour (`updateMany` avec condition sur `version`), jamais par lecture puis écriture séparées.
4. **Portée des versions :**
   - modification d'une ligne de tableau **portée par le salarié** → incrémente la version du **salarié** ;
   - modification d'une ligne **portée par l'emploi** → incrémente la version de **l'emploi**.

---

## Pourquoi pas au niveau de chaque ligne

- Multiplier les versions sur des dizaines de tables rendrait les écrans et les échanges HTTP ingérables.
- Le risque métier visé est la **fiche vue dans son ensemble** (identité, contrat en cours), pas la collision sur une ligne de prime isolée.
- Salarié et emploi sont les deux agrégats cohérents avec les écrans de modification.

---

## Conséquences

- Le client doit relire la fiche après un conflit.
- Les prompts suivants appliqueront `VerrouillageOptimisteService` sur chaque endpoint d'écriture concerné.

---

## Alternatives rejetées

| Alternative | Motif |
| --- | --- |
| Verrou pessimiste (SELECT FOR UPDATE) | Bloque les lecteurs ; inadapté à une API REST |
| Version sur chaque table répétable | Complexité UI et synchronisation client |
