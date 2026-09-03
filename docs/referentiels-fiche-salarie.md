# Référentiels de la fiche salarié — valeurs à charger au seed

> Annexe du prompt Cursor 2.1.a. Source : `PaymaRH_Fiche_salarie_v5.xlsx`.
> Aucune valeur ne doit être inventée, complétée ou traduite.

---

## 1. Pays (`Pays`)

195 entrées : les 193 États membres de l'ONU, plus la Palestine et le Saint-Siège.
Le Sahara occidental est **volontairement absent**. Aucun territoire non souverain.

`ordre` fixe l'ordre d'affichage : le Maroc est en tête, le reste par ordre alphabétique français.
Le libellé « Palestine » est volontairement différent de celui de la norme ISO (« Territoires palestiniens »).

| ordre | code ISO | libellé                         |
| ----- | -------- | ------------------------------- |
| 1     | MA       | Maroc                           |
| 2     | AF       | Afghanistan                     |
| 3     | ZA       | Afrique du Sud                  |
| 4     | AL       | Albanie                         |
| 5     | DZ       | Algérie                         |
| 6     | DE       | Allemagne                       |
| 7     | AD       | Andorre                         |
| 8     | AO       | Angola                          |
| 9     | AG       | Antigua-et-Barbuda              |
| 10    | SA       | Arabie saoudite                 |
| 11    | AR       | Argentine                       |
| 12    | AM       | Arménie                         |
| 13    | AU       | Australie                       |
| 14    | AT       | Autriche                        |
| 15    | AZ       | Azerbaïdjan                     |
| 16    | BS       | Bahamas                         |
| 17    | BH       | Bahreïn                         |
| 18    | BD       | Bangladesh                      |
| 19    | BB       | Barbade                         |
| 20    | BE       | Belgique                        |
| 21    | BZ       | Belize                          |
| 22    | BJ       | Bénin                           |
| 23    | BT       | Bhoutan                         |
| 24    | BY       | Biélorussie                     |
| 25    | BO       | Bolivie                         |
| 26    | BA       | Bosnie-Herzégovine              |
| 27    | BW       | Botswana                        |
| 28    | BR       | Brésil                          |
| 29    | BN       | Brunei                          |
| 30    | BG       | Bulgarie                        |
| 31    | BF       | Burkina Faso                    |
| 32    | BI       | Burundi                         |
| 33    | KH       | Cambodge                        |
| 34    | CM       | Cameroun                        |
| 35    | CA       | Canada                          |
| 36    | CV       | Cap-Vert                        |
| 37    | CL       | Chili                           |
| 38    | CN       | Chine                           |
| 39    | CY       | Chypre                          |
| 40    | CO       | Colombie                        |
| 41    | KM       | Comores                         |
| 42    | CG       | Congo-Brazzaville               |
| 43    | CD       | Congo-Kinshasa                  |
| 44    | KP       | Corée du Nord                   |
| 45    | KR       | Corée du Sud                    |
| 46    | CR       | Costa Rica                      |
| 47    | CI       | Côte d’Ivoire                   |
| 48    | HR       | Croatie                         |
| 49    | CU       | Cuba                            |
| 50    | DK       | Danemark                        |
| 51    | DJ       | Djibouti                        |
| 52    | DM       | Dominique                       |
| 53    | EG       | Égypte                          |
| 54    | AE       | Émirats arabes unis             |
| 55    | EC       | Équateur                        |
| 56    | ER       | Érythrée                        |
| 57    | ES       | Espagne                         |
| 58    | EE       | Estonie                         |
| 59    | SZ       | Eswatini                        |
| 60    | US       | États-Unis                      |
| 61    | ET       | Éthiopie                        |
| 62    | FJ       | Fidji                           |
| 63    | FI       | Finlande                        |
| 64    | FR       | France                          |
| 65    | GA       | Gabon                           |
| 66    | GM       | Gambie                          |
| 67    | GE       | Géorgie                         |
| 68    | GH       | Ghana                           |
| 69    | GR       | Grèce                           |
| 70    | GD       | Grenade                         |
| 71    | GT       | Guatemala                       |
| 72    | GN       | Guinée                          |
| 73    | GQ       | Guinée équatoriale              |
| 74    | GW       | Guinée-Bissau                   |
| 75    | GY       | Guyana                          |
| 76    | HT       | Haïti                           |
| 77    | HN       | Honduras                        |
| 78    | HU       | Hongrie                         |
| 79    | MH       | Îles Marshall                   |
| 80    | SB       | Îles Salomon                    |
| 81    | IN       | Inde                            |
| 82    | ID       | Indonésie                       |
| 83    | IQ       | Irak                            |
| 84    | IR       | Iran                            |
| 85    | IE       | Irlande                         |
| 86    | IS       | Islande                         |
| 87    | IL       | Israël                          |
| 88    | IT       | Italie                          |
| 89    | JM       | Jamaïque                        |
| 90    | JP       | Japon                           |
| 91    | JO       | Jordanie                        |
| 92    | KZ       | Kazakhstan                      |
| 93    | KE       | Kenya                           |
| 94    | KG       | Kirghizstan                     |
| 95    | KI       | Kiribati                        |
| 96    | KW       | Koweït                          |
| 97    | LA       | Laos                            |
| 98    | LS       | Lesotho                         |
| 99    | LV       | Lettonie                        |
| 100   | LB       | Liban                           |
| 101   | LR       | Liberia                         |
| 102   | LY       | Libye                           |
| 103   | LI       | Liechtenstein                   |
| 104   | LT       | Lituanie                        |
| 105   | LU       | Luxembourg                      |
| 106   | MK       | Macédoine du Nord               |
| 107   | MG       | Madagascar                      |
| 108   | MY       | Malaisie                        |
| 109   | MW       | Malawi                          |
| 110   | MV       | Maldives                        |
| 111   | ML       | Mali                            |
| 112   | MT       | Malte                           |
| 113   | MU       | Maurice                         |
| 114   | MR       | Mauritanie                      |
| 115   | MX       | Mexique                         |
| 116   | FM       | Micronésie                      |
| 117   | MD       | Moldavie                        |
| 118   | MC       | Monaco                          |
| 119   | MN       | Mongolie                        |
| 120   | ME       | Monténégro                      |
| 121   | MZ       | Mozambique                      |
| 122   | MM       | Myanmar (Birmanie)              |
| 123   | NA       | Namibie                         |
| 124   | NR       | Nauru                           |
| 125   | NP       | Népal                           |
| 126   | NI       | Nicaragua                       |
| 127   | NE       | Niger                           |
| 128   | NG       | Nigeria                         |
| 129   | NO       | Norvège                         |
| 130   | NZ       | Nouvelle-Zélande                |
| 131   | OM       | Oman                            |
| 132   | UG       | Ouganda                         |
| 133   | UZ       | Ouzbékistan                     |
| 134   | PK       | Pakistan                        |
| 135   | PW       | Palaos                          |
| 136   | PS       | Palestine                       |
| 137   | PA       | Panama                          |
| 138   | PG       | Papouasie-Nouvelle-Guinée       |
| 139   | PY       | Paraguay                        |
| 140   | NL       | Pays-Bas                        |
| 141   | PE       | Pérou                           |
| 142   | PH       | Philippines                     |
| 143   | PL       | Pologne                         |
| 144   | PT       | Portugal                        |
| 145   | QA       | Qatar                           |
| 146   | CF       | République centrafricaine       |
| 147   | DO       | République dominicaine          |
| 148   | RO       | Roumanie                        |
| 149   | GB       | Royaume-Uni                     |
| 150   | RU       | Russie                          |
| 151   | RW       | Rwanda                          |
| 152   | KN       | Saint-Christophe-et-Niévès      |
| 153   | SM       | Saint-Marin                     |
| 154   | VA       | Saint-Siège (Vatican)           |
| 155   | VC       | Saint-Vincent-et-les Grenadines |
| 156   | LC       | Sainte-Lucie                    |
| 157   | SV       | Salvador                        |
| 158   | WS       | Samoa                           |
| 159   | ST       | Sao Tomé-et-Principe            |
| 160   | SN       | Sénégal                         |
| 161   | RS       | Serbie                          |
| 162   | SC       | Seychelles                      |
| 163   | SL       | Sierra Leone                    |
| 164   | SG       | Singapour                       |
| 165   | SK       | Slovaquie                       |
| 166   | SI       | Slovénie                        |
| 167   | SO       | Somalie                         |
| 168   | SD       | Soudan                          |
| 169   | SS       | Soudan du Sud                   |
| 170   | LK       | Sri Lanka                       |
| 171   | SE       | Suède                           |
| 172   | CH       | Suisse                          |
| 173   | SR       | Suriname                        |
| 174   | SY       | Syrie                           |
| 175   | TJ       | Tadjikistan                     |
| 176   | TZ       | Tanzanie                        |
| 177   | TD       | Tchad                           |
| 178   | CZ       | Tchéquie                        |
| 179   | TH       | Thaïlande                       |
| 180   | TL       | Timor oriental                  |
| 181   | TG       | Togo                            |
| 182   | TO       | Tonga                           |
| 183   | TT       | Trinité-et-Tobago               |
| 184   | TN       | Tunisie                         |
| 185   | TM       | Turkménistan                    |
| 186   | TR       | Turquie                         |
| 187   | TV       | Tuvalu                          |
| 188   | UA       | Ukraine                         |
| 189   | UY       | Uruguay                         |
| 190   | VU       | Vanuatu                         |
| 191   | VE       | Venezuela                       |
| 192   | VN       | Viêt Nam                        |
| 193   | YE       | Yémen                           |
| 194   | ZM       | Zambie                          |
| 195   | ZW       | Zimbabwe                        |

---

## 2. Types de contrat (`TypeContrat`)

Liste **ouverte** : elle n'est pas figée en phase 2. Elle doit rester extensible sans migration.

| code    | libellé                                    |
| ------- | ------------------------------------------ |
| CDI     | Contrat à durée indéterminée               |
| CDD     | Contrat à durée déterminée                 |
| CTT     | Contrat de travail temporaire              |
| INT_CDI | Intérimaire — contrat à durée indéterminée |
| OBJ     | Contrat à objet défini                     |
| STAGE   | Convention de stage                        |
| MANDAT  | Mandataire social                          |

> Il n'existe **ni contrat d'apprentissage ni contrat d'insertion** au Maroc. Ne pas en ajouter.

---

## 3. Motifs de sortie (`MotifSortie`)

| code                | libellé                            |
| ------------------- | ---------------------------------- |
| DEMISSION           | Démission                          |
| LIC_FAUTE_SIMPLE    | Licenciement pour faute simple     |
| LIC_FAUTE_GRAVE     | Licenciement pour faute grave      |
| LIC_FAUTE_LOURDE    | Licenciement pour faute lourde     |
| LIC_ECONOMIQUE      | Licenciement pour motif économique |
| FIN_CDD             | Fin de contrat à durée déterminée  |
| COMMUN_ACCORD       | Rupture d'un commun accord         |
| RUPTURE_ESSAI       | Rupture de la période d'essai      |
| RETRAITE_VOLONTAIRE | Départ volontaire à la retraite    |
| RETRAITE_OFFICE     | Retraite d'office (limite d'âge)   |
| FORCE_MAJEURE       | Force majeure                      |
| DETACHEMENT         | Départ en détachement              |
| DECES               | Décès, disparition                 |

> « Suspension du contrat de travail » n'est **pas** un motif de sortie : le contrat continue. Ne pas l'ajouter.

---

## 4. Statuts particuliers (`StatutParticulier`)

| code  | libellé        |
| ----- | -------------- |
| IDMAJ | IDMAJ — ANAPEC |

Un seul statut en phase 2. La table doit rester extensible sans migration.

> **TAHFIZ n'est pas dans cette liste.** C'est une exonération portée par la société, pas un statut saisi salarié par salarié. Voir la règle de propagation dans le prompt (section 5.4).

---

## 5. Situations familiales (`SituationFamiliale`)

Le **code** est stocké. Le libellé s'accorde en genre à l'affichage, à partir du champ `sexe` du salarié.

| code        | libellé masculin | libellé féminin |
| ----------- | ---------------- | --------------- |
| CELIBATAIRE | Célibataire      | Célibataire     |
| MARIE       | Marié            | Mariée          |
| DIVORCE     | Divorcé          | Divorcée        |
| VEUF        | Veuf             | Veuve           |

---

## 6. Liens de parenté (`LienParente`)

| code     | libellé  |
| -------- | -------- |
| ENFANT   | Enfant   |
| CONJOINT | Conjoint |

---

## 7. Référentiels déjà existants — ne pas recréer

Ces tables ont été créées au module 1 et sont réutilisées telles quelles :

- `Banque` — utilisée par le champ Banque des comptes bancaires du salarié
- `JourFerie` — utilisée par les jours fériés travaillés de l'emploi
- `Civilite` — **non utilisée par la fiche salarié**, mais utilisée par la fiche société (employeur signataire). Ne pas la supprimer.
- `FormeJuridique` — sans rapport avec la fiche salarié

---

## 8. Référentiels hors périmètre

À ne créer sous aucune forme dans ce prompt :

- **Primes** — table gérée par le module Primes
- **Avantages en nature (natures)** — table gérée par le module Primes
- **Services et départements** — référentiels gérés dans un autre module
- **Grilles horaires** — module 3
- **Référentiel national** (SMIG, durée légale, âge maximal des enfants à charge, barème kilométrique CNSS) — aucun calcul n'a lieu en phase 2, donc aucune table
