import Link from 'next/link';
import { PageTitle } from '@smartshop/ui';
import { ProductForm } from '../../../../src/features/catalog';
import { flattenCategoriesTree, getCategoriesTree, getCategoryAttributesSchema } from '../../../../src/features/categories';
import { Button } from '../../../../src/shared/ui/button';

export default async function NewCatalogProductPage() {
  const categoriesTree = await getCategoriesTree();
  const categories = flattenCategoriesTree(categoriesTree);
  const schemas = await Promise.all(
    categories.map(async (category) => {
      const schema = await getCategoryAttributesSchema(category.id);
      return [category.id, schema.active] as const;
    })
  );
  const activeSchemasByCategoryId = Object.fromEntries(schemas);

  return (
    <main className="mx-auto max-w-6xl">
      <PageTitle title="Создать товар" subtitle="Добавьте новый товар в каталог" />
      <div className="mb-4 flex items-center gap-2">
        <Button asChild variant="outline">
          <Link href="/catalog">Назад в каталог</Link>
        </Button>
      </div>
      <ProductForm
        mode="create"
        action="/admin/api/admin-crud/catalog/create"
        categories={categories}
        activeSchemasByCategoryId={activeSchemasByCategoryId}
      />
    </main>
  );
}
