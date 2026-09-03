import { SetMetadata } from '@nestjs/common';

/** Route POST de pre-controle ou simulation : n exige ni journal ni If-Match. */
export const CLE_ROUTE_SANS_ECRITURE = 'paymarh:route-sans-ecriture';

export const RouteSansEcriture = () => SetMetadata(CLE_ROUTE_SANS_ECRITURE, true);

/** Ecriture sans version prealable (creation) : journal requis, If-Match non applicable. */
export const CLE_SANS_IF_MATCH = 'paymarh:sans-if-match';

export const SansIfMatch = () => SetMetadata(CLE_SANS_IF_MATCH, true);
