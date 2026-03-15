export type CatalogItemDto = {
  id: string;
  title: string;
  price: number;
};

export type OrderStatus = 'new' | 'processing' | 'done';

export type OrderDto = {
  id: string;
  status: OrderStatus;
};
