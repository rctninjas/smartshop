'use client';

import Link from 'next/link';
import { formatPrice } from '@smartshop/utils';
import { useCart } from '../model/cart-context';

export function CartPageContent() {
  const { items, total, removeItem, updateQuantity } = useCart();

  if (!items.length) {
    return (
      <section>
        <h2>Корзина пуста</h2>
        <p>Добавьте товары из каталога, чтобы оформить заказ.</p>
        <Link href="/">Перейти в каталог</Link>
      </section>
    );
  }

  return (
    <section>
      <h2>Корзина</h2>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
        {items.map((item) => (
          <li key={item.productId} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>{item.title}</p>
                <p style={{ margin: '6px 0', color: '#334155' }}>Категория: {item.categoryName}</p>
                <p style={{ margin: 0 }}>Цена: {formatPrice(item.unitPrice)}</p>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                <label htmlFor={`qty-${item.productId}`}>Количество</label>
                <input
                  id={`qty-${item.productId}`}
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) => updateQuantity(item.productId, Number(event.target.value))}
                />
                <button type="button" onClick={() => removeItem(item.productId)}>
                  Удалить
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p style={{ marginTop: 16, fontWeight: 700 }}>Итого: {formatPrice(total)}</p>
      <Link href="/checkout">Перейти к оформлению</Link>
    </section>
  );
}
