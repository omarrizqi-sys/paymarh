import { SetMetadata } from '@nestjs/common';

export const CLE_EXIGE_IF_MATCH = 'paymarh:exige-if-match';

/** Marque une route d ecriture comme exigeant l en-tete If-Match (verifie au demarrage). */
export const ExigeIfMatch = () => SetMetadata(CLE_EXIGE_IF_MATCH, true);
