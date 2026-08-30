import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PaymaRH — Back-office',
  description: 'Back-office de PaymaRH, logiciel de paie marocain pour le secteur prive.',
};

import Link from 'next/link';
import { EtatApi } from '@/components/etat-api';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <header className="border-b">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <nav className="flex items-center gap-6">
              <Link href="/" className="font-semibold tracking-tight">
                PaymaRH
              </Link>
              <Link href="/societes" className="text-muted-foreground hover:text-foreground text-sm">
                Societes
              </Link>
            </nav>
            <EtatApi />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
