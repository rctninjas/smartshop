import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from './button';

type AdminShellProps = {
  children: ReactNode;
};

const navItems = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/categories', label: 'Категории' },
  { href: '/orders', label: 'Заказы' },
  { href: '/customers', label: 'Клиенты' }
];

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <aside className="border-r bg-white p-5">
        <h2 className="mb-4 text-xl font-semibold">Админка Smartshop</h2>
        <nav>
          <ul className="grid gap-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form action="/admin/api/admin-auth/logout" method="post">
          <Button className="mt-4 w-full" variant="outline" type="submit">
            Выйти
          </Button>
        </form>
      </aside>
      <section className="p-6">{children}</section>
    </div>
  );
}
