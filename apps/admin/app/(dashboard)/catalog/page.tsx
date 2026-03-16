import { PageTitle } from '@smartshop/ui';
import Link from 'next/link';
import { CatalogAdminTable, getCatalog } from '../../../src/features/catalog';
import { Alert } from '../../../src/shared/ui/alert';
import { Button } from '../../../src/shared/ui/button';

type CatalogPageProps = {
  searchParams: Promise<{
    isPublished?: string;
    created?: string;
    saved?: string;
    error?: string;
  }>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const isPublishedFilter =
    params.isPublished === undefined ? undefined : params.isPublished === 'true' ? true : false;
  const catalog = await getCatalog({ isPublished: isPublishedFilter });

  return (
    <main className="mx-auto max-w-6xl">
      <PageTitle title="Каталог" subtitle="Товары, цены и статус публикации" />
      <div className="mb-4 grid gap-2">
        {params.created === '1' ? <Alert variant="success">Товар успешно создан.</Alert> : null}
        {params.saved === '1' ? <Alert variant="success">Изменения успешно сохранены.</Alert> : null}
        {params.error === '1' ? (
          <Alert variant="destructive">Не удалось выполнить действие. Проверьте данные и повторите.</Alert>
        ) : null}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild>
          <Link href="/catalog/new">Создать товар</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/catalog">Все</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/catalog?isPublished=true">Опубликованные</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/catalog?isPublished=false">Неопубликованные</Link>
        </Button>
      </div>
      <CatalogAdminTable items={catalog.items} />
    </main>
  );
}
