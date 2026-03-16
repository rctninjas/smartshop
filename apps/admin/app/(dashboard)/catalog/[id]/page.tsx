import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageTitle } from '@smartshop/ui';
import { getCatalogProduct, ProductForm } from '../../../../src/features/catalog';
import { flattenCategoriesTree, getCategoriesTree, getCategoryAttributesSchema } from '../../../../src/features/categories';
import { Alert } from '../../../../src/shared/ui/alert';
import { Button } from '../../../../src/shared/ui/button';

type CatalogProductPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function CatalogProductPage({ params, searchParams }: CatalogProductPageProps) {
  const { id } = await params;
  const query = await searchParams;

  try {
    const [product, categoriesTree] = await Promise.all([getCatalogProduct(id), getCategoriesTree()]);
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
        <PageTitle title={`Редактирование: ${product.title}`} subtitle="Обновите данные, варианты и изображения товара" />
        <div className="mb-4 grid gap-2">
          {query.saved === '1' ? <Alert variant="success">Изменения товара сохранены.</Alert> : null}
        </div>
        <div className="mb-4 flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/catalog">Назад в каталог</Link>
          </Button>
        </div>
        <ProductForm
          mode="edit"
          action="/admin/api/admin-crud/catalog/update"
          categories={categories}
          activeSchemasByCategoryId={activeSchemasByCategoryId}
          product={product}
        />
      </main>
    );
  } catch {
    notFound();
  }
}
