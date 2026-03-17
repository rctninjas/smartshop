import Link from 'next/link';
import type { CustomerDto } from '@smartshop/types';
import { Card, CardContent } from '../../../shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../shared/ui/table';

type CustomersTableProps = {
  items: CustomerDto[];
};

export function CustomersTable({ items }: CustomersTableProps) {
  if (!items.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-1 text-base font-semibold">Пока нет клиентов</h3>
          <p className="text-sm text-slate-600">Клиенты появятся после регистрации или оформления заказов.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Клиент</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Заказы</TableHead>
              <TableHead>Сумма покупок</TableHead>
              <TableHead>Последний заказ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Link href={`/customers/${encodeURIComponent(item.email)}`}>{item.name}</Link>
              </TableCell>
              <TableCell>{item.email}</TableCell>
              <TableCell>{item.phone}</TableCell>
              <TableCell>{item.ordersCount}</TableCell>
              <TableCell>{item.totalSpent}</TableCell>
              <TableCell>{item.lastOrderAt ? new Date(item.lastOrderAt).toLocaleString() : '-'}</TableCell>
            </TableRow>
          ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
