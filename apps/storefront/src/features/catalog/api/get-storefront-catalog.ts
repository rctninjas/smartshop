import type { CategoryTreeNodeDto, PaginatedResponse, ProductDto } from '@smartshop/types';
import { apiGet } from '../../../shared/api/client';

function flattenCategories(items: CategoryTreeNodeDto[]): CategoryTreeNodeDto[] {
  const result: CategoryTreeNodeDto[] = [];
  for (const item of items) {
    result.push(item);
    if (item.children.length) {
      result.push(...flattenCategories(item.children));
    }
  }
  return result;
}

export async function getStorefrontCatalog() {
  return apiGet<PaginatedResponse<ProductDto>>('/api/storefront/catalog');
}

export async function getStorefrontCatalogItem(slug: string) {
  return apiGet<ProductDto>(`/api/storefront/catalog/${slug}`);
}

export async function getCategoryNamesMap() {
  const tree = await apiGet<CategoryTreeNodeDto[]>('/api/categories/tree');
  const flat = flattenCategories(tree);
  return new Map(flat.map((item) => [item.id, item.name]));
}
