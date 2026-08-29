import type { Uuid } from '@paymarh/shared-types';

// ---------------------------------------------------------------------------
// PORT DE STOCKAGE D OBJETS - INTERFACE SEULE, AUCUNE IMPLEMENTATION.
//
// Principe fondateur : les documents finalises (futurs bulletins PDF, etats,
// declarations) ne sont PAS stockes en base. La base ne conserve qu une
// reference vers un stockage d objets de type S3.
//
// Voir README.md de ce dossier.
// ---------------------------------------------------------------------------

/**
 * Reference d un objet stocke, telle qu elle sera conservee en base.
 * C est cette petite structure - et non le fichier - qui sera persistee.
 */
export interface ObjectReference {
  /** Conteneur logique (bucket). */
  readonly bucket: string;

  /** Chemin de l objet dans le conteneur. */
  readonly key: string;

  /** Taille en octets, utile pour l affichage et les quotas. */
  readonly sizeBytes: number;

  /** Type MIME, ex. "application/pdf". */
  readonly contentType: string;

  /**
   * Empreinte du contenu. Permet de prouver qu un document telecharge est
   * bien celui qui a ete produit : indispensable pour un bulletin de paie.
   */
  readonly checksum: string;
}

/** Metadonnees fournies au moment du depot d un objet. */
export interface PutObjectCommand {
  /**
   * Compte proprietaire. L isolation multi-tenant s applique au stockage
   * exactement comme a la base : un objet appartient toujours a un compte.
   */
  readonly accountId: Uuid;

  /** Societe concernee. */
  readonly companyId: Uuid;

  readonly key: string;
  readonly contentType: string;
  readonly content: Buffer;
}

/**
 * Contrat attendu de tout fournisseur de stockage d objets.
 *
 * AUCUNE implementation n existe au module 0 : ni S3, ni MinIO, ni disque
 * local. Ce port fige seulement la forme, pour que le choix du fournisseur
 * reste un detail interchangeable.
 */
export interface ObjectStoragePort {
  /** Depose un objet et rend la reference a conserver en base. */
  put(command: PutObjectCommand): Promise<ObjectReference>;

  /** Recupere le contenu d un objet a partir de sa reference. */
  get(reference: ObjectReference): Promise<Buffer>;

  /**
   * Produit une URL temporaire de telechargement direct.
   * Le contenu ne transite ainsi jamais par l API, qui reste legere.
   */
  createSignedUrl(reference: ObjectReference, expiresInSeconds: number): Promise<string>;

  /** Supprime un objet. */
  remove(reference: ObjectReference): Promise<void>;
}

/**
 * Jeton d injection NestJS.
 *
 * Une interface TypeScript n existe pas a l execution : il faut donc un jeton
 * explicite pour pouvoir injecter une implementation le jour venu, sans que
 * le code appelant connaisse le fournisseur.
 */
export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');
