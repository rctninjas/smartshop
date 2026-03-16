import type { PaginatedResponse, ProductDto } from '@smartshop/types';
import { apiGet } from '../../../shared/api/client';

type CatalogQuery = {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  isPublished?: boolean;
};

function buildQuery(query: CatalogQuery): string {
  const params = new URLSearchParams();
  params.set('page', String(query.page ?? 1));
  params.set('pageSize', String(query.pageSize ?? 20));
  if (query.categoryId) {
    params.set('categoryId', query.categoryId);
  }
  if (query.isPublished !== undefined) {
    params.set('isPublished', String(query.isPublished));
  }
  return params.toString();
}

export async function getCatalog(query: CatalogQuery = {}) {
  return apiGet<PaginatedResponse<ProductDto>>(`/api/catalog?${buildQuery(query)}`);
}

export async function getCatalogProduct(id: string) {
  return apiGet<ProductDto>(`/api/catalog/${id}`);
}
