import type {
  CategoryAttributesSchemaResponse,
  CategoryDto,
  CategoryTreeNodeDto
} from '@smartshop/types';
import { apiGet } from '../../../shared/api/client';

export async function getCategoriesTree() {
  return apiGet<CategoryTreeNodeDto[]>('/api/categories/tree');
}

export async function getCategoryById(id: string) {
  return apiGet<CategoryDto>(`/api/categories/${id}`);
}

export function flattenCategoriesTree(nodes: CategoryTreeNodeDto[]): CategoryDto[] {
  const result: CategoryDto[] = [];
  const visit = (list: CategoryTreeNodeDto[]) => {
    for (const node of list) {
      result.push(node);
      visit(node.children);
    }
  };
  visit(nodes);
  return result;
}

export async function getCategoryAttributesSchema(categoryId: string) {
  return apiGet<CategoryAttributesSchemaResponse>(`/api/categories/${categoryId}/attributes/schema`);
}
