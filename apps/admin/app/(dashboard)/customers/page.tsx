import { PageTitle } from '@smartshop/ui';
import { CustomersTable, getCustomers } from '../../../src/features/customers';

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <main className="mx-auto max-w-6xl">
      <PageTitle title="Клиенты" subtitle="Список клиентов и агрегированные метрики по заказам" />
      <CustomersTable items={customers.items} />
    </main>
  );
}
