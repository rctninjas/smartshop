import type { OrderDto, PaginatedResponse } from '@smartshop/types';
import { apiGet } from '../../../shared/api/client';

type OrdersQuery = {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
};

function buildQuery(query: OrdersQuery): string {
  const params = new URLSearchParams();
  params.set('page', String(query.page ?? 1));
  params.set('pageSize', String(query.pageSize ?? 20));
  if (query.status) {
    params.set('status', query.status);
  }
  if (query.search) {
    params.set('search', query.search);
  }
  return params.toString();
}

export async function getOrders(query: OrdersQuery = {}) {
  return apiGet<PaginatedResponse<OrderDto>>(`/api/orders?${buildQuery(query)}`);
}

export async function getOrderById(id: string) {
  return apiGet<OrderDto>(`/api/orders/${id}`);
}
