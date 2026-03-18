import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cuisine du Monde - Nantes',
  description: 'Découvrez les restaurants du monde à Nantes',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
