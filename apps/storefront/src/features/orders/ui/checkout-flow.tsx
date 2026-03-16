'use client';

import { useMemo, useState } from 'react';
import { formatPrice } from '@smartshop/utils';
import { apiPost } from '../../../shared/api/client';
import { useCart } from '../../cart/model/cart-context';
import { AuthGate } from '../../auth/ui/auth-gate';

type CheckoutResponse = {
  orderId: string;
};

export function CheckoutFlow() {
  const { items, total, clear } = useCart();
  const [authorizedCustomer, setAuthorizedCustomer] = useState<{
    fullName: string;
    email: string;
    phone: string;
  } | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'cdek' | 'russian_post'>('cdek');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'on_receipt' | 'online'>('online');
  const [simulatePaymentFailure, setSimulatePaymentFailure] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkoutItems = useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity
      })),
    [items]
  );

  if (!items.length) {
    return (
      <section>
        <h2>Оформление заказа</h2>
        <p>Корзина пуста. Добавьте товары перед checkout.</p>
      </section>
    );
  }

  async function handleSubmit() {
    if (!authorizedCustomer) {
      setResult({ type: 'error', text: 'Сначала выполните вход или регистрацию.' });
      return;
    }

    if (!deliveryAddress.trim()) {
      setResult({ type: 'error', text: 'Укажите адрес доставки.' });
      return;
    }

    setIsSubmitting(true);
    setResult(null);
    try {
      const response = await apiPost<CheckoutResponse, Record<string, unknown>>('/api/storefront/checkout', {
        deliveryMethod,
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod,
        items: checkoutItems,
        forcePaymentFailure: simulatePaymentFailure
      });
      clear();
      setResult({ type: 'success', text: `Заказ создан. Номер: ${response.orderId}` });
    } catch {
      setResult({
        type: 'error',
        text: 'Оплата не прошла. Вернитесь к выбору способа оплаты и повторите попытку.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section>
      <h2>Checkout</h2>

      {!authorizedCustomer ? (
        <AuthGate onAuthorized={setAuthorizedCustomer} />
      ) : (
        <p>
          Покупатель: {authorizedCustomer.fullName} ({authorizedCustomer.email})
        </p>
      )}

      <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 16, marginTop: 16 }}>
        <h3>Доставка</h3>
        <label style={{ display: 'grid', gap: 4, marginBottom: 8 }}>
          Адрес доставки
          <textarea value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} />
        </label>
        <label style={{ display: 'grid', gap: 4, marginBottom: 8 }}>
          Способ доставки
          <select value={deliveryMethod} onChange={(event) => setDeliveryMethod(event.target.value as 'cdek' | 'russian_post')}>
            <option value="cdek">СДЭК</option>
            <option value="russian_post">Почта России</option>
          </select>
        </label>
      </div>

      <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 16, marginTop: 16 }}>
        <h3>Оплата</h3>
        <label style={{ display: 'grid', gap: 4, marginBottom: 8 }}>
          Способ оплаты
          <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as 'on_receipt' | 'online')}>
            <option value="online">Онлайн</option>
            <option value="on_receipt">При получении</option>
          </select>
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={simulatePaymentFailure}
            onChange={(event) => setSimulatePaymentFailure(event.target.checked)}
          />
          Эмулировать неуспешную оплату
        </label>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3>Проверка корзины</h3>
        <ul>
          {items.map((item) => (
            <li key={item.productId}>
              {item.title} x {item.quantity} = {formatPrice(item.quantity * item.unitPrice)}
            </li>
          ))}
        </ul>
        <p style={{ fontWeight: 700 }}>Итого: {formatPrice(total)}</p>
      </div>

      <button type="button" onClick={handleSubmit} disabled={isSubmitting}>
        Подтвердить заказ
      </button>

      {result ? (
        <p style={{ color: result.type === 'success' ? '#166534' : '#991b1b', marginTop: 12 }}>{result.text}</p>
      ) : null}
    </section>
  );
}
