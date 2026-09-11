import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VECTA — Back-office',
  description: 'Back-office de VECTA, logiciel de paie marocain pour le secteur privé.',
};

import { EnveloppeNavigationRacine } from '@/components/navigation/enveloppe-navigation-racine';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <EnveloppeNavigationRacine>
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </EnveloppeNavigationRacine>
      </body>
    </html>
  );
}
