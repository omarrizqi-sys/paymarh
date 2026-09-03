# Référentiel EDI CNSS e-BDS (DAMANCOM)

## Objet

Référentiel machine-lisible du format de fichier EDI de la CNSS (portail DAMANCOM), destiné à paramétrer un futur logiciel de paie marocain : structure des enregistrements, règles de validation, codes d'erreur et paramètres de période (plafond, SMIG).

## Source

CNSS, Direction des affiliés — _Cahier des Charges relatif à la réalisation des déclarations des salaires en Mode Echange de Fichiers entre la CNSS et ses Affiliés_, **version 2**, février 2006, 36 pages. Publié sur cnss.ma sous le nom de fichier `cahier de chargev1Damancom.pdf` (le nom indique v1, le contenu est v2).

## Extraction

Texte intégral extrait du PDF avec **pdfplumber** (Python), une page par bloc `===== PAGE n =====`, fichier `source.txt`. Structuration en JSON réalisée en août 2026 à partir de ce texte et du PDF original.

## Contenu du JSON (`cnss_ebds_v2.json`)

| Élément            | Détail                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Enregistrements    | 18 types : A00–A03 (préétabli), B00–B06 (déclaration principale), E00–E06 (complémentaire) |
| Situations         | 9 codes avec rangs (vide, SO, DE, IT, IL, AT, CS, MS, MP)                                  |
| Règles             | 48 règles de validation (équivalent des contrôles a. à z. du cahier des charges)           |
| Codes d'erreur     | 95 codes officiels avec sévérité                                                           |
| Caractères         | 38 caractères ASCII autorisés pour les champs alphanumériques                              |
| Anomalies document | 13 entrées (`anomalies_document`)                                                          |

Paramètres externalisés dans `parametres_periode.json` : plafond mensuel et SMIG (listes datées, extensibles).

## Validation structurelle

Chaque type d'enregistrement : somme des longueurs de champs = **260** caractères par ligne.

| Type | Champs | Total longueurs |
| ---- | ------ | --------------- |
| A00  | 4      | 260             |
| A01  | 11     | 260             |
| A02  | 10     | 260             |
| A03  | 10     | 260             |
| B00  | 4      | 260             |
| B01  | 11     | 260             |
| B02  | 16     | 260             |
| B03  | 15     | 260             |
| B04  | 11     | 260             |
| B05  | 10     | 260             |
| B06  | 10     | 260             |
| E00  | 4      | 260             |
| E01  | 11     | 260             |
| E02  | 16     | 260             |
| E03  | 15     | 260             |
| E04  | 11     | 260             |
| E05  | 10     | 260             |
| E06  | 10     | 260             |

Les offsets (colonnes début/fin) des types **E\*** sont recopiés tels quels du document PDF. Ceux des types **A\*** et **B\*** sont **calculés** à partir des longueurs de champs (chaînage consécutif).

## Anomalies du document source

| ID          | Constat (résumé)                                                          |
| ----------- | ------------------------------------------------------------------------- |
| ANO-001     | B02 `L_Situation` typé N(2) mais codes alphanumériques → traiter en AN(2) |
| ANO-002     | B01 champs texte typés N alors qu'identiques à A01 → conserver en AN      |
| ANO-003     | `N_Identif_Transfert` N(14) en A00/B00, AN(14) en E00                     |
| ANO-004     | Filler A00 « 241 » sans type explicite → AN(241) espaces                  |
| **ANO-005** | **Nom de fichier MMAAAA vs `L_Période` AAAAMM — _non tranché_**           |
| ANO-006     | Date version 2 : février 2005 (suivi) vs février 2006 (couverture)        |
| ANO-007     | Formule S_Ctr B04 : noms de champs dans le texte ≠ noms réels             |
| ANO-008     | E01 `C_Date_Exig` vs B01 `D_Date_Exig`                                    |
| ANO-009     | E01 `L_Activite` vs B01 `L_Activité`                                      |
| ANO-010     | E02 vs B02 : typage `L_Situation` incohérent                              |
| ANO-011     | Typo B0 vs B00 pour identifiant de transfert                              |
| ANO-012     | B01 codes postaux/agence typés N vs AN dans A01                           |
| **ANO-013** | **E04 `N_Num_Affilie` espaces vs erreur 242 — _non tranché_**             |

Les anomalies **ANO-005** et **ANO-013** restent ouvertes (`resolution: indeterminee`). Elles ne pourront être tranchées que par un **dépôt de test réel** sur le portail DAMANCOM.

## Avertissement

Le code Python produit pendant la session de structuration (`cnss_ebds/`, `tests/`, `build_spec.py`, `validate.py`, etc.) a été écrit hors du contexte applicatif réel et **n'est pas destiné à être repris**. Seuls les fichiers de cette livraison (`cnss_ebds_v2.json`, `parametres_periode.json`, `source.txt`, `README.md`) font référence.
