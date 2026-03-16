import Link from 'next/link';
import { PageTitle } from '@smartshop/ui';
import { ProductDetails, getCategoryNamesMap, getStorefrontCatalogItem } from '../../../src/features/catalog';

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, categoryNames] = await Promise.all([getStorefrontCatalogItem(slug), getCategoryNamesMap()]);
  const categoryName = categoryNames.get(product.categoryId) ?? 'Без категории';

  return (
    <main>
      <PageTitle title="Карточка товара" subtitle={product.title} />
      <p>
        <Link href="/">Вернуться в каталог</Link>
      </p>
      <ProductDetails product={product} categoryName={categoryName} />
    </main>
  );
}
