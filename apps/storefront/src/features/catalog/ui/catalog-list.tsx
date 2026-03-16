import { formatPrice } from '@smartshop/utils';
import type { CatalogItemDto } from '@smartshop/types';

const SAMPLE_ITEMS: CatalogItemDto[] = [
  { id: 'sku-1', title: 'Базовое худи', price: 6990 },
  { id: 'sku-2', title: 'Умная бутылка', price: 2590 }
];

export function CatalogList() {
  return (
    <section>
      <h2>Каталог</h2>
      <ul>
        {SAMPLE_ITEMS.map((item) => (
          <li key={item.id}>
            {item.title} - {formatPrice(item.price)}
          </li>
        ))}
      </ul>
    </section>
  );
}
