import { Card, CardContent } from '../../../shared/ui/card';

type DashboardOverviewProps = {
  productsCount: number;
  categoriesCount: number;
  ordersCount: number;
  customersCount?: number;
};

export function DashboardOverview({
  productsCount,
  categoriesCount,
  ordersCount,
  customersCount = 0
}: DashboardOverviewProps) {
  return (
    <Card>
      <CardContent>
        <h2>Сводка</h2>
        <ul className="grid gap-1">
          <li>Всего товаров: {productsCount}</li>
          <li>Всего категорий: {categoriesCount}</li>
          <li>Всего заказов: {ordersCount}</li>
          <li>Всего клиентов: {customersCount}</li>
        </ul>
      </CardContent>
    </Card>
  );
}
