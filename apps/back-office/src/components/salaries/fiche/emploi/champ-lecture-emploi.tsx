interface Props {
  readonly label: string;
  readonly valeur: string;
  readonly testId?: string;
  readonly heritage?: string | null;
  readonly heritageTestId?: string;
}

/** Valeur d'un champ sans droit d'écriture : même rendu que le montant de Rémunération. */
export function ValeurLectureEmploi({
  valeur,
  testId,
}: {
  readonly valeur: string;
  readonly testId: string;
}) {
  return (
    <p className="text-sm" data-testid={testId}>
      {valeur}
    </p>
  );
}

export function ChampLectureEmploi({ label, valeur, testId, heritage, heritageTestId }: Props) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm" data-testid={testId}>
        {valeur}
      </p>
      {heritage ? (
        <p className="text-muted-foreground text-xs italic" data-testid={heritageTestId}>
          {heritage}
        </p>
      ) : null}
    </div>
  );
}
