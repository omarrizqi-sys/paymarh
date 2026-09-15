interface Props {
  readonly heritage: string | null;
  readonly testId?: string;
}

export function LigneHeritageChamp({ heritage, testId }: Props) {
  if (heritage === null || heritage.length === 0) {
    return null;
  }
  return (
    <p className="text-muted-foreground text-xs italic" data-testid={testId}>
      {heritage}
    </p>
  );
}
