import { PageTitle } from '@smartshop/ui';
import { getOrders, OrdersTable } from '../../../src/features/orders';
import { Alert } from '../../../src/shared/ui/alert';
import { Button } from '../../../src/shared/ui/button';
import { Input } from '../../../src/shared/ui/input';
import { Label } from '../../../src/shared/ui/label';
import { Select } from '../../../src/shared/ui/select';

type OrdersPageProps = {
  searchParams: Promise<{
    status?: string;
    search?: string;
    error?: string;
  }>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const orders = await getOrders({
    status: params.status,
    search: params.search
  });

  return (
    <main className="mx-auto max-w-6xl">
      <PageTitle title="Заказы" subtitle="Отслеживание статусов и операционных действий" />
      {params.error === '1' ? <Alert variant="destructive" className="mb-4">Не удалось выполнить действие над заказом.</Alert> : null}
      <form className="mb-4 flex flex-wrap items-end gap-3" method="get">
        <Label className="grid gap-1">
          Статус
          <Select name="status" defaultValue={params.status ?? ''}>
            <option value="">Все</option>
            <option value="created">Создан</option>
            <option value="paid">Оплачен</option>
            <option value="archived">В архиве</option>
            <option value="shipped">Отправлен</option>
            <option value="delivered">Доставлен</option>
          </Select>
        </Label>
        <Label className="grid min-w-64 gap-1">
          Поиск
          <Input name="search" defaultValue={params.search ?? ''} placeholder="email, телефон, ID заказа" />
        </Label>
        <Button type="submit" variant="outline">
          Применить
        </Button>
      </form>
      <OrdersTable items={orders.items} />
    </main>
  );
}
