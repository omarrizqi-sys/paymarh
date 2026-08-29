import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PaymaRH — Back-office',
  description: 'Back-office de PaymaRH, logiciel de paie marocain pour le secteur prive.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
