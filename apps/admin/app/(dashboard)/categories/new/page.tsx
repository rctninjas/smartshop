import Link from 'next/link';
import { PageTitle } from '@smartshop/ui';
import { CategoryForm, flattenCategoriesTree, getCategoriesTree } from '../../../../src/features/categories';
import { Alert } from '../../../../src/shared/ui/alert';
import { Button } from '../../../../src/shared/ui/button';

type NewCategoryPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewCategoryPage({ searchParams }: NewCategoryPageProps) {
  const params = await searchParams;
  const categoriesTree = await getCategoriesTree();
  const allCategories = flattenCategoriesTree(categoriesTree);
  const rootCategories = allCategories.filter((item) => item.parentId === null);

  return (
    <main className="mx-auto max-w-6xl">
      <PageTitle title="Создать категорию" subtitle="Добавьте корневую категорию или подкатегорию" />
      {params.error === '1' ? (
        <Alert variant="destructive" className="mb-4">Не удалось создать категорию. Проверьте данные формы.</Alert>
      ) : null}
      <div className="mb-4 flex items-center gap-2">
        <Button asChild variant="outline">
          <Link href="/categories">Назад к категориям</Link>
        </Button>
      </div>
      <CategoryForm action="/api/admin-crud/categories/create" rootCategories={rootCategories} />
    </main>
  );
}
