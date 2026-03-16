import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { CartProvider } from '../src/features/cart';

export const metadata: Metadata = {
  title: 'Витрина Smartshop',
  description: 'Клиентское приложение Smartshop'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <CartProvider>
          <header style={{ borderBottom: '1px solid #cbd5e1', background: '#ffffff' }}>
            <div style={{ maxWidth: 960, margin: '0 auto', padding: '12px 24px', display: 'flex', gap: 16 }}>
              <Link href="/">Каталог</Link>
              <Link href="/cart">Корзина</Link>
              <Link href="/checkout">Оформление</Link>
            </div>
          </header>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
