import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  readonly titre: string;
  readonly description?: string;
  readonly indiceHeritage?: string;
  readonly children: ReactNode;
  readonly id?: string;
}

export function Rubrique({ titre, description, indiceHeritage, children, id }: Props) {
  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle>{titre}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {indiceHeritage ? (
          <p className="text-muted-foreground text-xs italic">{indiceHeritage}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
