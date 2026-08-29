/**
 * Version de l API, exposee par `GET /health`.
 *
 * Volontairement une constante en dur plutot qu une lecture de package.json :
 * cela evite toute lecture de fichier au demarrage et rend la valeur
 * previsible dans les tests. A tenir a jour avec apps/api/package.json.
 */
export const API_VERSION = '0.1.0';
