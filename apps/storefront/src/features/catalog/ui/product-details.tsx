import Image from 'next/image';
import { formatPrice } from '@smartshop/utils';
import type { ProductDto } from '@smartshop/types';
import { AddToCartButton } from '../../cart';

type ProductDetailsProps = {
  product: ProductDto;
  categoryName: string;
};

export function ProductDetails({ product, categoryName }: ProductDetailsProps) {
  const gallery = product.images.length ? product.images : [];

  return (
    <section>
      <h2>{product.title}</h2>
      <p>Категория: {categoryName}</p>
      <p>
        {product.sale ? (
          <>
            <span style={{ textDecoration: 'line-through', color: '#64748b', marginRight: 8 }}>
              {formatPrice(product.price)}
            </span>
            <span>{formatPrice(product.sale)}</span>
          </>
        ) : (
          formatPrice(product.price)
        )}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12,
          marginBottom: 16
        }}
      >
        {gallery.length ? (
          gallery.map((image) => {
            const src = image.previewMediumUrl ?? image.previewSmUrl ?? image.url;
            return (
              <Image
                key={image.id}
                src={src}
                alt={`${product.title} ${image.sortOrder + 1}`}
                width={768}
                height={512}
                unoptimized
                style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 8 }}
              />
            );
          })
        ) : (
          <div
            style={{
              width: '100%',
              minHeight: 220,
              borderRadius: 8,
              background: '#e2e8f0',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            Нет изображений
          </div>
        )}
      </div>

      <AddToCartButton product={product} categoryName={categoryName} />
    </section>
  );
}
