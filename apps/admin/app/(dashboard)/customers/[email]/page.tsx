import { notFound } from 'next/navigation';
import { PageTitle } from '@smartshop/ui';
import { getCustomerOrders } from '../../../../src/features/customers';
import { OrdersTable } from '../../../../src/features/orders';
import { Card, CardContent } from '../../../../src/shared/ui/card';

type CustomerPageProps = {
  params: Promise<{ email: string }>;
};

export default async function CustomerDetailsPage({ params }: CustomerPageProps) {
  const { email } = await params;
  const decodedEmail = decodeURIComponent(email);

  try {
    const details = await getCustomerOrders(decodedEmail);

    return (
      <main className="mx-auto max-w-6xl">
        <PageTitle
          title={details.customer.name}
          subtitle={`Клиент ${details.customer.email} · Заказы: ${details.customer.ordersCount}`}
        />
        <Card className="mb-4">
          <CardContent className="grid gap-2">
          <p>
            <strong>Телефон:</strong> {details.customer.phone}
          </p>
          <p>
            <strong>Сумма покупок:</strong> {details.customer.totalSpent}
          </p>
          <p>
            <strong>Последний заказ:</strong>{' '}
            {details.customer.lastOrderAt ? new Date(details.customer.lastOrderAt).toLocaleString() : '-'}
          </p>
          </CardContent>
        </Card>
        <OrdersTable items={details.orders.items} />
      </main>
    );
  } catch {
    notFound();
  }
}
