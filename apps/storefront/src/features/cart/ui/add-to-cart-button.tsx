'use client';

import type { ProductDto } from '@smartshop/types';
import { useState } from 'react';
import { useCart } from '../model/cart-context';

type AddToCartButtonProps = {
  product: ProductDto;
  categoryName: string;
};

export function AddToCartButton({ product, categoryName }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [showPrompt, setShowPrompt] = useState(false);

  function handleAdd() {
    addItem(product, categoryName);
    setShowPrompt(true);
  }

  return (
    <div>
      <button type="button" onClick={handleAdd}>
        Добавить в корзину
      </button>
      {showPrompt ? (
        <p style={{ marginTop: 8 }}>
          Товар добавлен. <a href="/cart">Перейти в корзину</a> или продолжить покупки.
        </p>
      ) : null}
    </div>
  );
}
