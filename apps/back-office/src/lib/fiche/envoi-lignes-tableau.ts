import type { AlerteApi } from '@paymarh/shared-types';
import { AppelApiEchoue } from '@/lib/api/client';
import { estConflitVersion } from '@/lib/fiche/codes-conflit';

export interface ReponseEcritureLigne<TServeur> {
  readonly version: number;
  readonly alertes: readonly AlerteApi[];
  readonly lignesTableau: readonly TServeur[];
}

export interface ParametresEnvoiLignesTableau<TLocale, TServeur> {
  readonly versionInitiale: number;
  readonly courant: readonly TLocale[];
  readonly reference: readonly TLocale[];
  readonly trierAffichage: (lignes: readonly TLocale[]) => TLocale[];
  readonly getId: (ligne: TLocale) => string;
  readonly estNonEnregistree: (ligne: TLocale) => boolean;
  readonly estModifiee: (ligne: TLocale, ref: TLocale) => boolean;
  readonly versCorpsCreation: (ligne: TLocale) => unknown;
  readonly versCorpsModification: (ligne: TLocale, ref: TLocale) => Record<string, unknown>;
  readonly creer: (version: number, corps: unknown) => Promise<ReponseEcritureLigne<TServeur>>;
  readonly modifier: (
    id: string,
    version: number,
    corps: Record<string, unknown>
  ) => Promise<ReponseEcritureLigne<TServeur>>;
  readonly extraireLigneReponse: (
    lignes: readonly TServeur[],
    ligneId: string,
    idsConnus: ReadonlySet<string>
  ) => TServeur | undefined;
  readonly depuisServeur: (ligne: TServeur) => TLocale;
  readonly ouvrirFormulaire: (id: string) => void;
  readonly onMajCourant: (updater: (prev: TLocale[]) => TLocale[]) => void;
  readonly onMajReference: (updater: (prev: TLocale[]) => TLocale[]) => void;
  readonly onAlertesParLigne: (
    updater: (prev: Record<string, readonly AlerteApi[]>) => Record<string, readonly AlerteApi[]>
  ) => void;
}

export async function envoyerLignesTableau<TLocale, TServeur>(
  params: ParametresEnvoiLignesTableau<TLocale, TServeur>
): Promise<{ version: number; alertes: AlerteApi[] }> {
  let versionCourante = params.versionInitiale;
  const alertesRubrique: AlerteApi[] = [];
  const idsConnus = new Set(params.reference.map((l) => params.getId(l)));
  let formulaireErreurOuvert = false;
  const idsAlertesChamp: string[] = [];

  const ordre = params.trierAffichage(params.courant);
  const modifications = ordre.filter((l) => {
    if (params.estNonEnregistree(l)) return false;
    const ref = params.reference.find((r) => params.getId(r) === params.getId(l));
    if (ref === undefined) return false;
    return params.estModifiee(l, ref);
  });
  const ajouts = ordre.filter((l) => params.estNonEnregistree(l));

  const integrerAlertesSucces = (ligneId: string, alertes: readonly AlerteApi[]) => {
    const parChamp: AlerteApi[] = [];
    for (const alerte of alertes) {
      if (alerte.champ) {
        parChamp.push(alerte);
      } else {
        alertesRubrique.push(alerte);
      }
    }
    if (parChamp.length > 0) {
      idsAlertesChamp.push(ligneId);
      params.onAlertesParLigne((prev) => ({
        ...prev,
        [ligneId]: parChamp,
      }));
    }
  };

  for (const ligne of modifications) {
    const ligneId = params.getId(ligne);
    const ref = params.reference.find((r) => params.getId(r) === ligneId);
    if (ref === undefined) continue;
    const corps = params.versCorpsModification(ligne, ref);
    if (Object.keys(corps).length === 0) continue;

    try {
      const reponse = await params.modifier(ligneId, versionCourante, corps);
      versionCourante = reponse.version;
      integrerAlertesSucces(ligneId, reponse.alertes);
      const ligneServeur = params.extraireLigneReponse(reponse.lignesTableau, ligneId, idsConnus);
      if (ligneServeur !== undefined) {
        const locale = params.depuisServeur(ligneServeur);
        idsConnus.add(params.getId(locale));
        params.onMajCourant((prev) => prev.map((l) => (params.getId(l) === ligneId ? locale : l)));
        params.onMajReference((prev) =>
          prev.map((l) => (params.getId(l) === ligneId ? locale : l))
        );
      }
    } catch (erreur) {
      if (erreur instanceof AppelApiEchoue && estConflitVersion(erreur.erreur.code)) {
        throw erreur;
      }
      if (erreur instanceof AppelApiEchoue) {
        params.onAlertesParLigne((prev) => ({
          ...prev,
          [ligneId]: [
            {
              code: erreur.erreur.code,
              message: erreur.erreur.message,
              champ: erreur.erreur.champ,
            },
          ],
        }));
        if (!formulaireErreurOuvert) {
          params.ouvrirFormulaire(ligneId);
          formulaireErreurOuvert = true;
        }
        continue;
      }
      throw erreur;
    }
  }

  for (const ligne of ajouts) {
    const ligneId = params.getId(ligne);
    try {
      const reponse = await params.creer(versionCourante, params.versCorpsCreation(ligne));
      versionCourante = reponse.version;
      integrerAlertesSucces(ligneId, reponse.alertes);
      const ligneServeur = params.extraireLigneReponse(reponse.lignesTableau, ligneId, idsConnus);
      if (ligneServeur !== undefined) {
        const locale = params.depuisServeur(ligneServeur);
        const nouveauId = params.getId(locale);
        if (nouveauId !== ligneId) {
          params.onAlertesParLigne((prev) => {
            const alertesLigne = prev[ligneId];
            if (alertesLigne === undefined) return prev;
            const { [ligneId]: _ignore, ...reste } = prev;
            return { ...reste, [nouveauId]: alertesLigne };
          });
          const indexAlerte = idsAlertesChamp.indexOf(ligneId);
          if (indexAlerte >= 0) {
            idsAlertesChamp[indexAlerte] = nouveauId;
          }
        }
        idsConnus.add(nouveauId);
        params.onMajCourant((prev) => prev.map((l) => (params.getId(l) === ligneId ? locale : l)));
        params.onMajReference((prev) => [
          ...prev.filter((l) => params.getId(l) !== ligneId),
          locale,
        ]);
      }
    } catch (erreur) {
      if (erreur instanceof AppelApiEchoue && estConflitVersion(erreur.erreur.code)) {
        throw erreur;
      }
      if (erreur instanceof AppelApiEchoue) {
        params.onAlertesParLigne((prev) => ({
          ...prev,
          [ligneId]: [
            {
              code: erreur.erreur.code,
              message: erreur.erreur.message,
              champ: erreur.erreur.champ,
            },
          ],
        }));
        if (!formulaireErreurOuvert) {
          params.ouvrirFormulaire(ligneId);
          formulaireErreurOuvert = true;
        }
        continue;
      }
      throw erreur;
    }
  }

  if (!formulaireErreurOuvert && idsAlertesChamp.length > 0) {
    const ordreIds = params.trierAffichage(params.courant).map((l) => params.getId(l));
    const premier = ordreIds.find((id) => idsAlertesChamp.includes(id));
    if (premier !== undefined) {
      params.ouvrirFormulaire(premier);
    }
  }

  return { version: versionCourante, alertes: alertesRubrique };
}
