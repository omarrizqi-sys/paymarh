/**
 * Codes de refus de FORME — le ValidationPipe global les compose.
 * Reprises dans CODES_REPONSE (fiche salarie) pour rester un seul vocabulaire.
 */
export const CODES_REFUS_FORME = {
  CHAMP_INTERDIT: {
    code: 'CHAMP_INTERDIT',
    message: 'Ce champ ne peut pas être fourni par le client.',
  },
  CHAMP_OBLIGATOIRE: {
    code: 'CHAMP_OBLIGATOIRE',
    message: 'Ce champ est obligatoire.',
  },
  CARACTERE_NON_CONFORME: {
    code: 'CARACTERE_NON_CONFORME',
    message: 'Ce champ contient un caractère non conforme à son type.',
  },
} as const;
