import { PageTitle } from '@smartshop/ui';
import { CheckoutFlow } from '../../src/features/orders';

export default function CheckoutPage() {
  return (
    <main>
      <PageTitle title="Оформление заказа" subtitle="Авторизация, доставка и оплата" />
      <CheckoutFlow />
    </main>
  );
}
