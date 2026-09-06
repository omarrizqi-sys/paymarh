'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { libelleEtatDossier, formaterMoisAAAA_MM } from '@/lib/affichage/libelles';
import { type LigneSocieteListe } from '@/lib/affichage/liste-societes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Props {
  readonly societes: readonly LigneSocieteListe[];
  readonly peutCreer: boolean;
}

export function ListeSocietes({ societes, peutCreer }: Props) {
  const [tri, setTri] = useState<SortingState>([{ id: 'raisonSociale', desc: false }]);
  const [filtre, setFiltre] = useState('');

  const colonnes = useMemo<ColumnDef<LigneSocieteListe>[]>(
    () => [
      {
        accessorKey: 'codeDossier',
        header: 'Code dossier',
        cell: ({ row }) => (
          <Link className="text-primary hover:underline" href={`/societes/${row.original.id}`}>
            {row.original.codeDossier}
          </Link>
        ),
      },
      { accessorKey: 'raisonSociale', header: 'Raison sociale' },
      {
        id: 'formeJuridique',
        accessorFn: (r) => r.libelleFormeJuridique,
        header: 'Forme juridique',
      },
      {
        id: 'etatDossier',
        accessorFn: (r) => libelleEtatDossier(r.etatDossier),
        header: 'État du dossier',
      },
      {
        id: 'moisEnCours',
        accessorFn: (r) => formaterMoisAAAA_MM(r.moisEnCours),
        header: 'Mois en cours',
      },
      {
        id: 'nombreEtablissements',
        accessorKey: 'nombreEtablissements',
        header: 'Établissements',
      },
    ],
    []
  );

  const table = useReactTable({
    data: [...societes],
    columns: colonnes,
    state: { sorting: tri, globalFilter: filtre },
    onSortingChange: setTri,
    onGlobalFilterChange: setFiltre,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Input
          placeholder="Rechercher..."
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
          className="max-w-sm"
          aria-label="Rechercher une société"
        />
        {peutCreer ? (
          <Link href="/societes/nouveau">
            <Button>Créer une société</Button>
          </Link>
        ) : null}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className="hover:text-foreground flex items-center gap-1"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? null}
                      </button>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={colonnes.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  Aucune société trouvée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Précédent
        </Button>
        <span className="text-muted-foreground text-sm">
          Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
