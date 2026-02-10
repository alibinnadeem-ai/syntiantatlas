import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Syntiant Atlas - Fractional Real Estate Investment Platform',
  description:
    'Enterprise Web3 platform for fractional real estate investment, tokenization, and DAO governance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
