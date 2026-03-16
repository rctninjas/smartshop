import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@smartshop/utils';
import type { ProductDto } from '@smartshop/types';
import { AddToCartButton } from '../../cart';

type CatalogGridProps = {
  items: ProductDto[];
  categoryNames: Map<string, string>;
};

export function CatalogGrid({ items, categoryNames }: CatalogGridProps) {
  if (!items.length) {
    return (
      <section>
        <h2>Каталог</h2>
        <p>Пока нет опубликованных товаров.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Каталог</h2>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16
        }}
      >
        {items.map((item) => {
          const imageUrl = item.images[0]?.previewSmUrl ?? item.images[0]?.url ?? null;
          const categoryName = categoryNames.get(item.categoryId) ?? 'Без категории';
          return (
            <li key={item.id} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 12 }}>
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={item.title}
                  width={320}
                  height={220}
                  unoptimized
                  style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 6 }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: 180,
                    borderRadius: 6,
                    background: '#e2e8f0',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#475569'
                  }}
                >
                  Нет фото
                </div>
              )}
              <p style={{ margin: '12px 0 4px', fontWeight: 600 }}>{item.title}</p>
              <p style={{ margin: 0, color: '#334155' }}>Категория: {categoryName}</p>
              <p style={{ margin: '8px 0' }}>
                {item.sale ? (
                  <>
                    <span style={{ textDecoration: 'line-through', color: '#64748b', marginRight: 8 }}>
                      {formatPrice(item.price)}
                    </span>
                    <span>{formatPrice(item.sale)}</span>
                  </>
                ) : (
                  formatPrice(item.price)
                )}
              </p>
              <div style={{ display: 'grid', gap: 8 }}>
                <Link href={`/catalog/${item.slug}`}>Открыть карточку</Link>
                <AddToCartButton product={item} categoryName={categoryName} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
