import { PageTitle } from '@smartshop/ui';
import { CatalogGrid, getCategoryNamesMap, getStorefrontCatalog } from '../src/features/catalog';

export default async function HomePage() {
  const [catalog, categoryNames] = await Promise.all([getStorefrontCatalog(), getCategoryNamesMap()]);

  return (
    <main>
      <PageTitle title="Витрина Smartshop" subtitle="Каталог товаров интернет-магазина" />
      <CatalogGrid items={catalog.items} categoryNames={categoryNames} />
    </main>
  );
}
