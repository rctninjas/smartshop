import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Smartshop Storefront',
  description: 'Customer-facing app for Smartshop'
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
