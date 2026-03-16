import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageTitle } from '@smartshop/ui';
import { getOrderById } from '../../../../src/features/orders';
import { Alert } from '../../../../src/shared/ui/alert';
import { Badge } from '../../../../src/shared/ui/badge';
import { Button } from '../../../../src/shared/ui/button';
import { Card, CardContent } from '../../../../src/shared/ui/card';
import { Input } from '../../../../src/shared/ui/input';
import { Label } from '../../../../src/shared/ui/label';
import { Select } from '../../../../src/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../src/shared/ui/table';

type OrderDetailsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

function mapOrderStatus(status: string): { label: string; tone: 'neutral' | 'success' | 'warning' | 'info' } {
  if (status === 'created') return { label: 'Создан', tone: 'info' };
  if (status === 'paid') return { label: 'Оплачен', tone: 'success' };
  if (status === 'shipped') return { label: 'Отправлен', tone: 'warning' };
  if (status === 'delivered') return { label: 'Доставлен', tone: 'success' };
  return { label: 'В архиве', tone: 'neutral' };
}

export default async function OrderDetailsPage({ params, searchParams }: OrderDetailsPageProps) {
  const { id } = await params;
  const query = await searchParams;

  try {
    const order = await getOrderById(id);
    const statusMeta = mapOrderStatus(order.status);

    return (
      <main className="mx-auto max-w-6xl">
        <PageTitle title={`Заказ ${order.id}`} subtitle={`Текущий статус: ${statusMeta.label}`} />
        <div className="mb-4 grid gap-2">
          {query.saved === '1' ? <Alert variant="success">Статус заказа обновлён.</Alert> : null}
          {query.error === '1' ? <Alert variant="destructive">Не удалось обновить статус заказа.</Alert> : null}
        </div>
        <div className="mb-4 flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/orders">Назад к заказам</Link>
          </Button>
          <Badge variant={statusMeta.tone === 'neutral' ? 'default' : statusMeta.tone}>{statusMeta.label}</Badge>
        </div>

        <section className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
          <p>
            <strong>Клиент:</strong> {order.customerName} ({order.customerEmail})
          </p>
          <p>
            <strong>Телефон:</strong> {order.customerPhone}
          </p>
          <p>
            <strong>Доставка:</strong> {order.deliveryMethod}
          </p>
          <p>
            <strong>Адрес:</strong> {order.deliveryAddress}
          </p>
          <p>
            <strong>Оплата:</strong> {order.paymentMethod} / {order.isPaid ? 'оплачен' : 'не оплачен'}
          </p>
          <p>
            <strong>Итого:</strong> {order.amountTotal}
          </p>
        </section>

        <Card className="mb-5">
          <CardContent className="grid gap-3">
          <h2>Смена статуса</h2>
          <form className="grid max-w-xl gap-3" action="/api/admin-crud/orders/status" method="post">
            <input type="hidden" name="id" value={order.id} />
            <Label className="grid gap-1">
              Новый статус
              <Select name="status" defaultValue={order.status}>
                <option value="created">Создан</option>
                <option value="paid">Оплачен</option>
                <option value="archived">В архиве</option>
                <option value="shipped">Отправлен</option>
                <option value="delivered">Доставлен</option>
              </Select>
            </Label>
            <Label className="grid gap-1">
              Трек-номер (обязателен для статуса «Отправлен»)
              <Input name="trackNumber" defaultValue={order.trackNumber ?? ''} />
            </Label>
            <Button type="submit" className="w-fit">
              Обновить статус
            </Button>
          </form>
          </CardContent>
        </Card>

        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h2>Состав заказа</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Товар</TableHead>
                <TableHead>Кол-во</TableHead>
                <TableHead>Цена</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.titleSnapshot}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.priceSnapshot}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </main>
    );
  } catch {
    notFound();
  }
}
