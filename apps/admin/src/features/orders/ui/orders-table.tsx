import type { OrderDto } from '@smartshop/types';
import Link from 'next/link';
import { Badge } from '../../../shared/ui/badge';
import { Card, CardContent } from '../../../shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../shared/ui/table';

type OrdersTableProps = {
  items: OrderDto[];
};

export function OrdersTable({ items }: OrdersTableProps) {
  if (!items.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-1 text-base font-semibold">Пока нет заказов</h3>
          <p className="text-sm text-slate-600">Когда появятся заказы, они будут отображены здесь.</p>
        </CardContent>
      </Card>
    );
  }

  function getStatusLabel(status: OrderDto['status']) {
    if (status === 'created') return { label: 'Создан', tone: 'info' as const };
    if (status === 'paid') return { label: 'Оплачен', tone: 'success' as const };
    if (status === 'shipped') return { label: 'Отправлен', tone: 'warning' as const };
    if (status === 'delivered') return { label: 'Доставлен', tone: 'success' as const };
    return { label: 'В архиве', tone: 'neutral' as const };
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Клиент</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Обновлён</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
        {items.map((item) => {
          const status = getStatusLabel(item.status);
          return (
            <TableRow key={item.id}>
              <TableCell>
                <Link href={`/orders/${item.id}`}>{item.id}</Link>
              </TableCell>
              <TableCell>
                <Badge variant={status.tone === 'neutral' ? 'default' : status.tone}>{status.label}</Badge>
              </TableCell>
              <TableCell>{item.customerEmail}</TableCell>
              <TableCell>{item.amountTotal}</TableCell>
              <TableCell>{new Date(item.updatedAt).toLocaleString()}</TableCell>
              <TableCell>
                <Link href={`/orders/${item.id}`}>Открыть</Link>
              </TableCell>
            </TableRow>
          );
        })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
