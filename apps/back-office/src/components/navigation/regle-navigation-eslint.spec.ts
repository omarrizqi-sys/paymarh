import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const require = createRequire(fileURLToPath(import.meta.url));
const eslintConfig = require('../../../../../eslint.config.js').default;

const eslint = new ESLint({ baseConfig: eslintConfig });

const MESSAGE_ATTENDU =
  'Import interdit : toute navigation de la zone fiche ou creation passe par `@/components/navigation/navigation-gardee`';

describe('regle ESLint navigation gardee', () => {
  it('NG-LINT01 — useRouter est interdit dans le dossier fiche', async () => {
    const resultats = await eslint.lintText("import { useRouter } from 'next/navigation';\n", {
      filePath: resolve(
        'apps/back-office/src/components/salaries/fiche/exemple-interdit-navigation.tsx'
      ),
    });

    const messages = resultats.flatMap((resultat) => resultat.messages);
    expect(
      messages.some(
        (message) =>
          message.ruleId === 'no-restricted-imports' && message.message.includes(MESSAGE_ATTENDU)
      )
    ).toBe(true);
  });

  it('NG-LINT02 — Link est interdit dans le dossier creation', async () => {
    const resultats = await eslint.lintText("import Link from 'next/link';\n", {
      filePath: resolve(
        'apps/back-office/src/components/salaries/creation/exemple-interdit-navigation.tsx'
      ),
    });

    const messages = resultats.flatMap((resultat) => resultat.messages);
    expect(
      messages.some(
        (message) =>
          message.ruleId === 'no-restricted-imports' && message.message.includes('LienGarde')
      )
    ).toBe(true);
  });

  it('NG-LINT03 — le module navigation-gardee est exempte', async () => {
    const resultats = await eslint.lintText(
      "import Link from 'next/link';\nimport { useRouter } from 'next/navigation';\n",
      {
        filePath: resolve('apps/back-office/src/components/navigation/navigation-gardee.tsx'),
      }
    );

    const messages = resultats.flatMap((resultat) => resultat.messages);
    expect(messages.some((message) => message.ruleId === 'no-restricted-imports')).toBe(false);
  });

  it('NG-LINT04 — la route fiche avec crochets est couverte', async () => {
    const resultats = await eslint.lintText("import { useRouter } from 'next/navigation';\n", {
      filePath: resolve('apps/back-office/src/app/societes/[id]/salaries/[salarieId]/page.tsx'),
    });

    const messages = resultats.flatMap((resultat) => resultat.messages);
    expect(
      messages.some(
        (message) =>
          message.ruleId === 'no-restricted-imports' && message.message.includes(MESSAGE_ATTENDU)
      )
    ).toBe(true);
  });

  it('NG-LINT05 — notFound reste autorise dans la route creation', async () => {
    const resultats = await eslint.lintText("import { notFound } from 'next/navigation';\n", {
      filePath: resolve('apps/back-office/src/app/societes/[id]/salaries/nouveau/page.tsx'),
    });

    const messages = resultats.flatMap((resultat) => resultat.messages);
    expect(messages.some((message) => message.ruleId === 'no-restricted-imports')).toBe(false);
  });

  it('NG-LINT06 — la liste des salaries nest pas couverte', async () => {
    const resultats = await eslint.lintText("import { useRouter } from 'next/navigation';\n", {
      filePath: resolve('apps/back-office/src/components/salaries/liste/liste-salaries-client.tsx'),
    });

    const messages = resultats.flatMap((resultat) => resultat.messages);
    expect(messages.some((message) => message.message.includes(MESSAGE_ATTENDU))).toBe(false);
  });

  it('NG-LINT07 — la navigation de l en-tete est couverte', async () => {
    const resultats = await eslint.lintText("import Link from 'next/link';\n", {
      filePath: resolve('apps/back-office/src/components/navigation/navigation-en-tete.tsx'),
    });

    const messages = resultats.flatMap((resultat) => resultat.messages);
    expect(
      messages.some(
        (message) =>
          message.ruleId === 'no-restricted-imports' && message.message.includes('LienGarde')
      )
    ).toBe(true);
  });
});
