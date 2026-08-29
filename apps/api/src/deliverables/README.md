# Livrables — stockage d'objets

> **État au module 0 :** ce dossier ne contient qu'une **interface** (`object-storage.port.ts`). **Aucune implémentation** n'existe : ni S3, ni MinIO, ni disque local.

---

## Le principe

Les documents finalisés — futurs bulletins de paie en PDF, états, déclarations — **ne sont pas stockés en base de données**.

La base ne conserve qu'une **référence** vers un **stockage d'objets** de type S3.

```
┌──────────────────────────┐        ┌────────────────────────────┐
│  PostgreSQL              │        │  Stockage d'objets (S3)    │
│                          │        │                            │
│  bulletin                │        │                            │
│   ├─ id                  │        │  paymarh-livrables/        │
│   ├─ salarieId           │        │   └─ compte-x/             │
│   ├─ periode             │        │       └─ societe-y/        │
│   └─ documentRef ────────┼───────►│           └─ 2026-03.pdf   │
│       (bucket, key,      │        │                            │
│        taille, checksum) │        │      ~200 Ko par fichier   │
│                          │        │                            │
│      ~200 octets         │        │                            │
└──────────────────────────┘        └────────────────────────────┘
```

---

## Pourquoi séparer

**Les sauvegardes restent exploitables.** Un an de bulletins pour quelques milliers de salariés, c'est plusieurs gigaoctets de PDF. Stockés en base, ils rendent chaque sauvegarde lourde et chaque restauration lente — au pire moment, celui de l'incident. Séparés, la base reste petite et se restaure en minutes.

**Le coût de stockage est sans commune mesure.** Un stockage d'objets coûte une fraction du prix d'un stockage de base de données à volume égal, et se dimensionne indépendamment.

**Les fichiers ne transitent pas par l'API.** Grâce aux URL signées, le navigateur télécharge directement depuis le stockage. L'API reste légère et ne sert pas de tuyau à fichiers.

**Le fournisseur reste interchangeable.** Le code appelant ne connaît que le port `ObjectStoragePort`. Passer de MinIO en local à un S3 en production, ou changer d'hébergeur, ne touche aucune ligne de code métier.

---

## L'interface

`object-storage.port.ts` définit :

| Élément             | Rôle                                                                        |
| ------------------- | --------------------------------------------------------------------------- |
| `ObjectReference`   | Ce qui est **conservé en base** : bucket, clé, taille, type MIME, empreinte |
| `PutObjectCommand`  | Ce qu'on fournit au dépôt : compte, société, clé, type, contenu             |
| `ObjectStoragePort` | Le contrat : `put`, `get`, `createSignedUrl`, `remove`                      |
| `OBJECT_STORAGE`    | Jeton d'injection NestJS                                                    |

Deux détails de conception qui comptent :

**L'empreinte (`checksum`) n'est pas décorative.** Elle permet de prouver qu'un document téléchargé est bien celui qui a été produit, sans altération. Pour un bulletin de paie, qui est une pièce justificative opposable, c'est une exigence, pas un confort.

**L'isolation multi-tenant s'applique au stockage comme à la base.** `PutObjectCommand` exige `accountId` et `companyId` : un objet appartient toujours à un compte et à une société. L'arborescence des clés doit refléter cette hiérarchie, pour qu'une fuite reste impossible même au niveau du stockage.

**Pourquoi un jeton d'injection ?** Une interface TypeScript n'existe pas à l'exécution : elle disparaît à la compilation. Le symbole `OBJECT_STORAGE` sert donc de point d'ancrage pour que NestJS puisse injecter une implémentation le jour venu, sans que le code appelant sache laquelle.

---

## Ce qui reste à décider

Ces points feront l'objet d'un ADR quand le module de génération de documents sera spécifié :

- le fournisseur retenu en production, et celui utilisé en développement local ;
- la convention de nommage des clés (proposition de départ : `{accountId}/{companyId}/{annee}/{mois}/{type}-{salarieId}.pdf`) ;
- la durée de vie des URL signées ;
- la politique de rétention et d'archivage — la paie a des obligations légales de conservation ;
- le chiffrement au repos.

**Ne pas implémenter ce port avant que ces questions soient tranchées.** Une implémentation posée « en attendant » deviendrait un choix par défaut qu'il faudrait défaire.
