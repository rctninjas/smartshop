import type { FastifyInstance } from 'fastify';
import type { CatalogItemDto } from '@smartshop/types';

type CatalogListResponse = {
  items: CatalogItemDto[];
};

export async function registerCatalogModule(app: FastifyInstance) {
  app.get<{ Reply: CatalogListResponse }>('/catalog', async () => {
    return {
      items: [
        { id: 'sku-1', title: 'Starter Hoodie', price: 6990 },
        { id: 'sku-2', title: 'Smart Bottle', price: 2590 }
      ]
    };
  });
}
