import { PageTitle } from '@smartshop/ui';
import { CatalogList } from '../src/features/catalog';

export default function HomePage() {
  return (
    <main>
      <PageTitle title="Smartshop Storefront" subtitle="Feature-first baseline on Next.js App Router" />
      <CatalogList />
    </main>
  );
}
