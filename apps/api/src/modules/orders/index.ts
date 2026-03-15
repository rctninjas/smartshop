import type { FastifyInstance } from 'fastify';
import type { OrderDto } from '@smartshop/types';

type OrdersListResponse = {
  orders: OrderDto[];
};

export async function registerOrdersModule(app: FastifyInstance) {
  app.get<{ Reply: OrdersListResponse }>('/orders', async () => {
    return {
      orders: [
        { id: 'ord-1', status: 'processing' },
        { id: 'ord-2', status: 'new' }
      ]
    };
  });
}
