import { PageTitle } from '@smartshop/ui';
import { CartPageContent } from '../../src/features/cart';

export default function CartPage() {
  return (
    <main>
      <PageTitle title="Корзина" subtitle="Проверьте товары перед оформлением" />
      <CartPageContent />
    </main>
  );
}
