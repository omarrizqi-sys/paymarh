'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Etablissement } from '@paymarh/shared-types';
import type { ListeSalariesDonnees } from '@/lib/api/salaries';
import { listerSalaries } from '@/lib/api/salaries';
import { afficherPosteListe } from '@/lib/affichage/poste-liste-salarie';
import { libelleEtatSalarie } from '@/lib/affichage/libelles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SqueletteFicheSalarie } from '@/components/salaries/fiche/squelette-fiche-salarie';
import { RailActionsListe } from './rail-actions-liste';

const DELAI_RECHERCHE_MS = 300;

interface Props {
  readonly companyId: string;
  readonly initial: ListeSalariesDonnees;
  readonly etablissements: readonly Etablissement[];
  readonly societeSansSalaries: boolean;
}

export function ListeSalariesClient({
  companyId,
  initial,
  etablissements,
  societeSansSalaries,
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState([...initial.items]);
  const [prochainCurseur, setProchainCurseur] = useState(initial.prochainCurseur);
  const [operations, setOperations] = useState([...initial.operations]);
  const [recherche, setRecherche] = useState('');
  const [filtreEtat, setFiltreEtat] = useState<'ACTIF' | 'INACTIF' | ''>('');
  const [filtreEtablissement, setFiltreEtablissement] = useState('');
  const [chargement, setChargement] = useState(false);
  const [chargementPlus, setChargementPlus] = useState(false);
  const montageInitial = useRef(true);

  const filtresActifs =
    recherche.trim().length > 0 || filtreEtat !== '' || filtreEtablissement !== '';

  const recharger = useCallback(
    async (append: boolean) => {
      const params = {
        recherche: recherche.trim() || undefined,
        etat: filtreEtat || undefined,
        etablissementId: filtreEtablissement || undefined,
        curseur: append ? (prochainCurseur ?? undefined) : undefined,
      };

      if (append) {
        setChargementPlus(true);
      } else {
        setChargement(true);
      }

      try {
        const reponse = await listerSalaries(companyId, params);
        setOperations([...reponse.donnees.operations]);
        setProchainCurseur(reponse.donnees.prochainCurseur);
        setItems((courant) =>
          append ? [...courant, ...reponse.donnees.items] : [...reponse.donnees.items]
        );
      } finally {
        setChargement(false);
        setChargementPlus(false);
      }
    },
    [companyId, filtreEtablissement, filtreEtat, prochainCurseur, recherche]
  );

  useEffect(() => {
    if (montageInitial.current) {
      montageInitial.current = false;
      return;
    }

    const timer = setTimeout(() => {
      void recharger(false);
    }, DELAI_RECHERCHE_MS);

    return () => clearTimeout(timer);
  }, [recherche, filtreEtat, filtreEtablissement, recharger]);

  const messageVide =
    items.length === 0 && !chargement ? (
      filtresActifs ? (
        <p className="text-muted-foreground py-8 text-center text-sm" data-testid="vide-recherche">
          Aucun salarie ne correspond a votre recherche.
        </p>
      ) : societeSansSalaries ? (
        <p className="text-muted-foreground py-8 text-center text-sm" data-testid="vide-societe">
          Aucun salarie dans cette societe. Commencez par en creer un.
        </p>
      ) : (
        <p className="text-muted-foreground py-8 text-center text-sm" data-testid="vide-recherche">
          Aucun salarie ne correspond a votre recherche.
        </p>
      )
    ) : null;

  return (
    <SqueletteFicheSalarie
      afficherSommaire={false}
      rubriques={
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">Salaries</h1>

          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[12rem] flex-1">
              <label htmlFor="recherche-salaries" className="mb-1 block text-sm font-medium">
                Rechercher
              </label>
              <Input
                id="recherche-salaries"
                placeholder="Nom, prenom ou matricule..."
                value={recherche}
                onChange={(event) => setRecherche(event.target.value)}
                aria-label="Rechercher un salarie"
              />
            </div>

            <div>
              <label htmlFor="filtre-etat-salaries" className="mb-1 block text-sm font-medium">
                Etat
              </label>
              <Select
                id="filtre-etat-salaries"
                aria-label="Filtrer par etat"
                value={filtreEtat}
                onChange={(event) => setFiltreEtat(event.target.value as 'ACTIF' | 'INACTIF' | '')}
              >
                <option value="">Tous</option>
                <option value="ACTIF">Actifs</option>
                <option value="INACTIF">Inactifs</option>
              </Select>
            </div>

            <div>
              <label htmlFor="filtre-etab-salaries" className="mb-1 block text-sm font-medium">
                Etablissement
              </label>
              <Select
                id="filtre-etab-salaries"
                aria-label="Filtrer par etablissement"
                value={filtreEtablissement}
                onChange={(event) => setFiltreEtablissement(event.target.value)}
              >
                <option value="">Tous les etablissements</option>
                {etablissements.map((etablissement) => (
                  <option key={etablissement.id} value={etablissement.id}>
                    {etablissement.nom}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {messageVide}

          {items.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prenom</TableHead>
                    <TableHead>Etat</TableHead>
                    <TableHead>Date d entree</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead>Etablissement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((ligne) => (
                    <TableRow
                      key={ligne.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/societes/${companyId}/salaries/${ligne.id}`)}
                    >
                      <TableCell>
                        <Link
                          href={`/societes/${companyId}/salaries/${ligne.id}`}
                          className="text-primary hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {ligne.matricule}
                        </Link>
                      </TableCell>
                      <TableCell>{ligne.nom}</TableCell>
                      <TableCell>{ligne.prenom}</TableCell>
                      <TableCell>{libelleEtatSalarie(ligne.etat)}</TableCell>
                      <TableCell>{ligne.dateEntree}</TableCell>
                      <TableCell>{afficherPosteListe(ligne)}</TableCell>
                      <TableCell>{ligne.etablissement?.libelle ?? ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}

          {prochainCurseur !== null ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                disabled={chargementPlus}
                onClick={() => void recharger(true)}
              >
                {chargementPlus ? 'Chargement...' : 'Charger plus'}
              </Button>
            </div>
          ) : null}
        </div>
      }
      renderRail={(compact) => <RailActionsListe operations={operations} modeCompact={compact} />}
    />
  );
}

/** Lien retour depuis la page serveur. */
export function LienRetourFicheSociete({ companyId }: { readonly companyId: string }) {
  return (
    <Link href={`/societes/${companyId}`} className="text-primary text-sm hover:underline">
      ← Retour a la fiche societe
    </Link>
  );
}
