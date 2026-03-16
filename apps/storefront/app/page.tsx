import { PageTitle } from '@smartshop/ui';
import { CatalogList } from '../src/features/catalog';

export default function HomePage() {
  return (
    <main>
      <PageTitle title="Витрина Smartshop" subtitle="Базовая витрина на Next.js App Router" />
      <CatalogList />
    </main>
  );
}
