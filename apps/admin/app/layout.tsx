import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Smartshop Admin',
  description: 'Admin panel for Smartshop'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
