import { PageTitle } from '@smartshop/ui';
import Link from 'next/link';
import { CategoriesTree, getCategoriesTree } from '../../../src/features/categories';
import { Alert } from '../../../src/shared/ui/alert';
import { Button } from '../../../src/shared/ui/button';

type CategoriesPageProps = {
  searchParams: Promise<{ created?: string; error?: string }>;
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const params = await searchParams;
  const categories = await getCategoriesTree();

  return (
    <main className="mx-auto max-w-6xl">
      <PageTitle title="Категории" subtitle="Иерархия и структура классификации товаров" />
      <div className="mb-4 grid gap-2">
        {params.created === '1' ? <Alert variant="success">Категория успешно создана.</Alert> : null}
        {params.error === '1' ? <Alert variant="destructive">Не удалось выполнить действие над категорией.</Alert> : null}
      </div>
      <div className="mb-4 flex items-center gap-2">
        <Button asChild>
          <Link href="/categories/new">Создать категорию</Link>
        </Button>
      </div>
      <CategoriesTree nodes={categories} />
    </main>
  );
}
