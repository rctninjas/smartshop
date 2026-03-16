import type { CustomerDto, PaginatedResponse } from '@smartshop/types';
import { apiGet } from '../../../shared/api/client';

export async function getCustomers() {
  return apiGet<PaginatedResponse<CustomerDto>>('/api/customers?page=1&pageSize=20');
}
