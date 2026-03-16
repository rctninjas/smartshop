export type CatalogItemDto = {
  id: string;
  title: string;
  price: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type ProductDto = {
  id: string;
  title: string;
  itemNumber: string;
  slug: string;
  description: string;
  categoryId: string;
  price: number;
  sale: number | null;
  currency: string;
  isPublished: boolean;
  publishedAt: string | null;
  publishedBy: string | null;
  variants: ProductVariantDto[];
  images: ProductImageDto[];
  schemaVersion: number | null;
  attributesSnapshot: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductVariantDto = {
  id: string;
  sku: string;
  color: string;
  size: string;
  stock: number;
};

export type ProductImageDto = {
  id: string;
  url: string;
  originalUrl: string;
  previewSmUrl: string;
  previewMediumUrl: string;
  sortOrder: number;
};

export type ProductImageUploadDto = {
  url: string;
  originalUrl: string;
  previewSmUrl: string;
  previewMediumUrl: string;
};

export type ProductCreateInput = {
  title: string;
  itemNumber: string;
  slug: string;
  description: string;
  categoryId: string;
  price: number;
  sale?: number | null;
  variants?: Array<{
    sku: string;
    color: string;
    size: string;
    stock?: number;
  }>;
  images?: Array<{
    url: string;
    originalUrl?: string;
    previewSmUrl?: string;
    previewMediumUrl?: string;
    sortOrder?: number;
  }>;
  attributesSnapshot?: Record<string, unknown>;
};

export type ProductUpdateInput = Partial<ProductCreateInput>;

export type ProductPublishInput = {
  isPublished: boolean;
};

export type ProductBulkPublishInput = {
  ids: string[];
  isPublished: boolean;
};

export type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CategoryTreeNodeDto = CategoryDto & {
  children: CategoryTreeNodeDto[];
};

export type CategoryCreateInput = {
  name: string;
  slug: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export type CategoryUpdateInput = Partial<CategoryCreateInput>;

export type CategoryAttributeFieldType = 'text' | 'number' | 'boolean' | 'select' | 'multiselect';

export type CategoryAttributeFieldDto = {
  key: string;
  label: string;
  type: CategoryAttributeFieldType;
  required: boolean;
  options?: string[];
  sortOrder?: number;
};

export type CategoryAttributeSchemaStatus = 'draft' | 'active';

export type CategoryAttributeSchemaDto = {
  id: string;
  subcategoryId: string;
  version: number;
  status: CategoryAttributeSchemaStatus;
  fields: CategoryAttributeFieldDto[];
  createdAt: string;
  updatedAt: string;
};

export type CategoryAttributesSchemaResponse = {
  active: CategoryAttributeSchemaDto | null;
  draft: CategoryAttributeSchemaDto | null;
};

export type CategoryAttributesSchemaUpdateInput = {
  fields: CategoryAttributeFieldDto[];
};

export type OrderStatus = 'created' | 'paid' | 'archived' | 'shipped' | 'delivered';

export type OrderItemDto = {
  id: string;
  productId: string | null;
  quantity: number;
  titleSnapshot: string;
  priceSnapshot: number;
  attributesSnapshot: Record<string, unknown>;
};

export type OrderDto = {
  id: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryMethod: string;
  deliveryAddress: string;
  trackNumber: string | null;
  paymentMethod: string;
  isPaid: boolean;
  amountTotal: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
};

export type OrderCreateInput = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryMethod: 'cdek' | 'russian_post';
  deliveryAddress: string;
  paymentMethod: 'on_receipt' | 'online';
  items: Array<{
    productId?: string | null;
    quantity: number;
    titleSnapshot: string;
    priceSnapshot: number;
    attributesSnapshot?: Record<string, unknown>;
  }>;
};

export type OrderStatusUpdateInput = {
  status: OrderStatus;
  trackNumber?: string;
};

export type CustomerDto = {
  id: string;
  email: string;
  name: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
};

export type CustomerOrdersResponse = {
  customer: CustomerDto;
  orders: PaginatedResponse<OrderDto>;
};
