import { formatPrice } from '@smartshop/utils';
import type { CatalogItemDto } from '@smartshop/types';

const SAMPLE_ITEMS: CatalogItemDto[] = [
  { id: 'sku-1', title: 'Starter Hoodie', price: 6990 },
  { id: 'sku-2', title: 'Smart Bottle', price: 2590 }
];

export function CatalogList() {
  return (
    <section>
      <h2>Catalog</h2>
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
