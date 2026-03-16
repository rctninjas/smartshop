import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageTitle } from '@smartshop/ui';
import {
  AttributesSchemaEditor,
  CategoryForm,
  flattenCategoriesTree,
  getCategoriesTree,
  getCategoryAttributesSchema,
  getCategoryById
} from '../../../../src/features/categories';
import { Alert } from '../../../../src/shared/ui/alert';
import { Button } from '../../../../src/shared/ui/button';

type CategoryPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    saved?: string;
    error?: string;
    draft?: string;
    draftSaved?: string;
    published?: string;
  }>;
};

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { id } = await params;
  const query = await searchParams;

  try {
    const [category, categoriesTree] = await Promise.all([getCategoryById(id), getCategoriesTree()]);
    const schema = await getCategoryAttributesSchema(id);
    const allCategories = flattenCategoriesTree(categoriesTree);
    const rootCategories = allCategories.filter((item) => item.parentId === null);

    return (
      <main className="mx-auto max-w-6xl">
        <PageTitle title={`Редактирование: ${category.name}`} subtitle="Управление метаданными и иерархией категории" />
        <div className="mb-4 grid gap-2">
          {query.saved === '1' ? <Alert variant="success">Изменения категории сохранены.</Alert> : null}
          {query.draft === '1' ? <Alert>Черновик схемы создан.</Alert> : null}
          {query.draftSaved === '1' ? <Alert variant="success">Черновик схемы сохранён.</Alert> : null}
          {query.published === '1' ? <Alert variant="success">Схема характеристик опубликована.</Alert> : null}
          {query.error === '1' ? (
            <Alert variant="destructive">Не удалось выполнить действие. Проверьте данные и повторите.</Alert>
          ) : null}
        </div>
        <div className="mb-4 flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/categories">Назад к категориям</Link>
          </Button>
          <form action="/api/admin-crud/categories/delete" method="post">
            <input type="hidden" name="id" value={category.id} />
            <Button type="submit" variant="destructive">
              Удалить категорию
            </Button>
          </form>
        </div>
        <CategoryForm action="/api/admin-crud/categories/update" rootCategories={rootCategories} category={category} />
        <AttributesSchemaEditor categoryId={category.id} schema={schema} />
      </main>
    );
  } catch {
    notFound();
  }
}
