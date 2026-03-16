import type { CustomerOrdersResponse } from '@smartshop/types';
import { apiGet } from '../../../shared/api/client';

export async function getCustomerOrders(email: string) {
  const encodedEmail = encodeURIComponent(email);
  return apiGet<CustomerOrdersResponse>(`/api/customers/${encodedEmail}/orders?page=1&pageSize=20`);
}
