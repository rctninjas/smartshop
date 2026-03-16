'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ProductDto } from '@smartshop/types';

export type CartItem = {
  productId: string;
  title: string;
  slug: string;
  quantity: number;
  unitPrice: number;
  categoryName: string;
  imageUrl: string | null;
};

type CartContextValue = {
  items: CartItem[];
  total: number;
  addItem: (product: ProductDto, categoryName: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};

const STORAGE_KEY = 'smartshop_storefront_cart_v1';
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) {
        setItems(parsed);
      }
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const addItem = (product: ProductDto, categoryName: string) => {
      const unitPrice = product.sale ?? product.price;
      const imageUrl = product.images[0]?.previewSmUrl ?? product.images[0]?.url ?? null;
      setItems((current) => {
        const existing = current.find((item) => item.productId === product.id);
        if (existing) {
          return current.map((item) =>
            item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [
          ...current,
          {
            productId: product.id,
            title: product.title,
            slug: product.slug,
            quantity: 1,
            unitPrice,
            categoryName,
            imageUrl
          }
        ];
      });
    };

    const removeItem = (productId: string) => {
      setItems((current) => current.filter((item) => item.productId !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
      setItems((current) =>
        current
          .map((item) => (item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item))
          .filter((item) => item.quantity > 0)
      );
    };

    const clear = () => {
      setItems([]);
    };

    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    return { items, total, addItem, removeItem, updateQuantity, clear };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
