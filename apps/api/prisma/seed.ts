import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { config as chargerEnv } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client.js';

// ---------------------------------------------------------------------------
// PaymaRH - Donnees de demonstration (module 0)
//
// Cree le strict minimum pour pouvoir manipuler le socle multi-tenant :
//   - un compte de demonstration de type CABINET ;
//   - une societe rattachee a ce compte ;
//   - un super-admin plateforme, SANS compte de rattachement ;
//   - un administrateur du compte de demonstration.
//
// AUCUNE donnee de paie. Le script est idempotent : on peut le relancer sans
// creer de doublon.
//
// Lancement : pnpm db:seed
// ---------------------------------------------------------------------------

chargerEnv({ path: resolve(import.meta.dirname, '..', '..', '..', '.env'), quiet: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL est absente. Copiez .env.example en .env a la racine du depot avant de lancer le seed.'
  );
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const NOM_COMPTE_DEMO = 'Cabinet de demonstration PaymaRH';
const NOM_SOCIETE_DEMO = 'Societe de demonstration';
const EMAIL_SUPER_ADMIN = 'super-admin@paymarh.local';
const EMAIL_ADMIN_COMPTE = 'admin@cabinet-demo.local';

async function main(): Promise<void> {
  // 1. Le compte (tenant). `upsert` sur le nom n est pas possible faute de
  //    contrainte d unicite : on cherche d abord, on cree si absent.
  const compteExistant = await prisma.account.findFirst({
    where: { name: NOM_COMPTE_DEMO },
  });

  const compte =
    compteExistant ??
    (await prisma.account.create({
      data: { name: NOM_COMPTE_DEMO, type: 'CABINET' },
    }));

  console.log(`Compte de demonstration : ${compte.name} (${compte.id})`);

  // 2. Une societe rattachee a ce compte.
  const societeExistante = await prisma.company.findFirst({
    where: { accountId: compte.id, name: NOM_SOCIETE_DEMO },
  });

  const societe =
    societeExistante ??
    (await prisma.company.create({
      data: { accountId: compte.id, name: NOM_SOCIETE_DEMO },
    }));

  console.log(`Societe de demonstration : ${societe.name} (${societe.id})`);

  // 3. Le super-admin plateforme : accountId VOLONTAIREMENT nul.
  //    C est la traduction en donnees du principe "super-admin hors
  //    hierarchie". Il n appartient a aucun compte client.
  const superAdmin = await prisma.user.upsert({
    where: { email: EMAIL_SUPER_ADMIN },
    update: { role: 'PLATFORM_ADMIN', accountId: null },
    create: { email: EMAIL_SUPER_ADMIN, role: 'PLATFORM_ADMIN', accountId: null },
  });

  console.log(`Super-admin plateforme : ${superAdmin.email} (${superAdmin.id}) - accountId=null`);

  // 4. L administrateur du compte de demonstration.
  const adminCompte = await prisma.user.upsert({
    where: { email: EMAIL_ADMIN_COMPTE },
    update: { role: 'ACCOUNT_ADMIN', accountId: compte.id },
    create: { email: EMAIL_ADMIN_COMPTE, role: 'ACCOUNT_ADMIN', accountId: compte.id },
  });

  console.log(`Administrateur de compte : ${adminCompte.email} (${adminCompte.id})`);

  console.log('\nSeed termine. Aucune donnee de paie n a ete creee (module 0).');
  console.log("Pour interroger l'API en developpement, utilisez l'en-tete :");
  console.log(`  x-paymarh-user-id: ${adminCompte.id}`);
}

main()
  .catch((erreur: unknown) => {
    console.error('Echec du seed :', erreur);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
