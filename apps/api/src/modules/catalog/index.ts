import type { FastifyInstance } from 'fastify';
import type {
  CategoryAttributeFieldDto,
  ProductImageUploadDto,
  ProductBulkPublishInput,
  ProductCreateInput,
  ProductDto,
  ProductPublishInput,
  ProductUpdateInput
} from '@smartshop/types';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Prisma } from '@prisma/client';
import sharp from 'sharp';
import { prisma } from '../../lib/db.js';

type CatalogListQuery = {
  page?: string;
  pageSize?: string;
  categoryId?: string;
  isPublished?: string;
  sortBy?: 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
};

type CatalogListResponse = {
  items: ProductDto[];
  page: number;
  pageSize: number;
  total: number;
};

type ApiErrorResponse = {
  code: string;
  message: string;
  requestId: string;
};

const PRODUCT_IMAGES_DIR = path.resolve(process.cwd(), 'storage', 'products');
const PRODUCT_IMAGES_PUBLIC_PREFIX = '/api/catalog/images/files';

function toProductDto(product: {
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
  publishedAt: Date | null;
  publishedBy: string | null;
  variants?: Array<{
    id: string;
    sku: string;
    color: string;
    size: string;
    stock: number;
  }>;
  images?: Array<{
    id: string;
    url: string;
    originalUrl: string | null;
    smUrl: string | null;
    mediumUrl: string | null;
    sortOrder: number;
  }>;
  schemaVersion: number | null;
  attributesSnapshot: unknown;
  createdAt: Date;
  updatedAt: Date;
}): ProductDto {
  return {
    id: product.id,
    title: product.title,
    itemNumber: product.itemNumber,
    slug: product.slug,
    description: product.description,
    categoryId: product.categoryId,
    price: product.price,
    sale: product.sale,
    currency: product.currency,
    isPublished: product.isPublished,
    publishedAt: product.publishedAt ? product.publishedAt.toISOString() : null,
    publishedBy: product.publishedBy,
    variants: (product.variants ?? []).map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      stock: variant.stock
    })),
    images: (product.images ?? [])
      .map((image) => ({
        id: image.id,
        url: normalizeImageUrl(image.url),
        originalUrl: normalizeImageUrl(image.originalUrl ?? image.url),
        previewSmUrl: normalizeImageUrl(image.smUrl ?? image.url),
        previewMediumUrl: normalizeImageUrl(image.mediumUrl ?? image.url),
        sortOrder: image.sortOrder
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
    schemaVersion: product.schemaVersion,
    attributesSnapshot: (product.attributesSnapshot ?? null) as Record<string, unknown> | null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  };
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return undefined;
}

function parseAttributeSchemaFields(value: unknown): CategoryAttributeFieldDto[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as CategoryAttributeFieldDto[];
}

function validateAttributesSnapshot(
  schemaFields: CategoryAttributeFieldDto[],
  snapshot: Record<string, unknown>,
  requestId: string
): ApiErrorResponse | null {
  const schemaKeys = new Set(schemaFields.map((field) => field.key));
  for (const key of Object.keys(snapshot)) {
    if (!schemaKeys.has(key)) {
      return {
        code: 'CATALOG_ATTRIBUTES_UNKNOWN_KEY',
        message: `Unknown attribute key: ${key}`,
        requestId
      };
    }
  }

  for (const field of schemaFields) {
    const value = snapshot[field.key];
    const hasValue =
      value !== undefined &&
      value !== null &&
      !(typeof value === 'string' && value.trim() === '') &&
      !(Array.isArray(value) && value.length === 0);

    if (field.required && !hasValue) {
      return {
        code: 'CATALOG_ATTRIBUTES_REQUIRED',
        message: `Attribute ${field.key} is required`,
        requestId
      };
    }
    if (!hasValue) {
      continue;
    }

    if (field.type === 'text' && typeof value !== 'string') {
      return {
        code: 'CATALOG_ATTRIBUTES_INVALID_TYPE',
        message: `Attribute ${field.key} must be text`,
        requestId
      };
    }
    if (field.type === 'number' && typeof value !== 'number') {
      return {
        code: 'CATALOG_ATTRIBUTES_INVALID_TYPE',
        message: `Attribute ${field.key} must be number`,
        requestId
      };
    }
    if (field.type === 'boolean' && typeof value !== 'boolean') {
      return {
        code: 'CATALOG_ATTRIBUTES_INVALID_TYPE',
        message: `Attribute ${field.key} must be boolean`,
        requestId
      };
    }
    if (field.type === 'select') {
      if (typeof value !== 'string' || !field.options?.includes(value)) {
        return {
          code: 'CATALOG_ATTRIBUTES_INVALID_OPTION',
          message: `Invalid option for ${field.key}`,
          requestId
        };
      }
    }
    if (field.type === 'multiselect') {
      if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
        return {
          code: 'CATALOG_ATTRIBUTES_INVALID_TYPE',
          message: `Attribute ${field.key} must be string[]`,
          requestId
        };
      }
      if (value.some((item) => !field.options?.includes(item))) {
        return {
          code: 'CATALOG_ATTRIBUTES_INVALID_OPTION',
          message: `Invalid option for ${field.key}`,
          requestId
        };
      }
    }
  }

  return null;
}

function validateSalePrice(
  sale: number | null | undefined,
  price: number,
  requestId: string
): ApiErrorResponse | null {
  if (sale === null || sale === undefined) {
    return null;
  }

  if (!Number.isFinite(sale) || sale < 0) {
    return {
      code: 'CATALOG_SALE_INVALID',
      message: 'sale must be a non-negative number',
      requestId
    };
  }

  if (sale > price) {
    return {
      code: 'CATALOG_SALE_GT_PRICE',
      message: 'sale must be less than or equal to price',
      requestId
    };
  }

  return null;
}

function validateProductItemNumber(itemNumber: string | undefined, requestId: string): ApiErrorResponse | null {
  if (typeof itemNumber !== 'string' || itemNumber.trim() === '') {
    return {
      code: 'CATALOG_ITEM_NUMBER_REQUIRED',
      message: 'itemNumber is required',
      requestId
    };
  }

  if (itemNumber.length > 100) {
    return {
      code: 'CATALOG_ITEM_NUMBER_TOO_LONG',
      message: 'itemNumber must be 100 characters or fewer',
      requestId
    };
  }

  return null;
}

function buildImageUrl(fileName: string): string {
  const explicitPublicUrl = process.env.API_PUBLIC_URL?.replace(/\/$/, '');
  const fallbackPublicUrl = `http://localhost:${process.env.API_PORT ?? 4000}`;
  const baseUrl = explicitPublicUrl || fallbackPublicUrl;
  return `${baseUrl}${PRODUCT_IMAGES_PUBLIC_PREFIX}/${fileName}`;
}

function validateImageFileName(fileName: string): boolean {
  return /^[a-z0-9-]+-(original|sm|medium)\.webp$/i.test(fileName);
}

function normalizeImageUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  const explicitPublicUrl = process.env.API_PUBLIC_URL?.replace(/\/$/, '');
  const fallbackPublicUrl = `http://localhost:${process.env.API_PORT ?? 4000}`;
  const baseUrl = explicitPublicUrl || fallbackPublicUrl;
  const pathPart = value.startsWith('/') ? value : `/${value}`;
  return `${baseUrl}${pathPart}`;
}

export async function registerCatalogModule(app: FastifyInstance) {
  app.post<{ Reply: ProductImageUploadDto | ApiErrorResponse }>(
    '/catalog/images/upload',
    async (request, reply) => {
      const file = await request.file();
      if (!file) {
        return reply.code(400).send({
          code: 'CATALOG_IMAGE_FILE_REQUIRED',
          message: 'file is required',
          requestId: request.id
        });
      }

      if (!file.mimetype.startsWith('image/')) {
        return reply.code(422).send({
          code: 'CATALOG_IMAGE_INVALID_MIMETYPE',
          message: 'Only image files are supported',
          requestId: request.id
        });
      }

      const sourceBuffer = await file.toBuffer();
      if (!sourceBuffer.length) {
        return reply.code(422).send({
          code: 'CATALOG_IMAGE_EMPTY',
          message: 'Uploaded image is empty',
          requestId: request.id
        });
      }

      try {
        const imageId = randomUUID();
        const originalFileName = `${imageId}-original.webp`;
        const smFileName = `${imageId}-sm.webp`;
        const mediumFileName = `${imageId}-medium.webp`;

        await mkdir(PRODUCT_IMAGES_DIR, { recursive: true });

        const originalBuffer = await sharp(sourceBuffer)
          .rotate()
          .resize({ width: 2000, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 86 })
          .toBuffer();
        const smBuffer = await sharp(sourceBuffer)
          .rotate()
          .resize({ width: 320, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
        const mediumBuffer = await sharp(sourceBuffer)
          .rotate()
          .resize({ width: 768, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 84 })
          .toBuffer();

        await Promise.all([
          writeFile(path.resolve(PRODUCT_IMAGES_DIR, originalFileName), originalBuffer),
          writeFile(path.resolve(PRODUCT_IMAGES_DIR, smFileName), smBuffer),
          writeFile(path.resolve(PRODUCT_IMAGES_DIR, mediumFileName), mediumBuffer)
        ]);

        return reply.code(201).send({
          url: buildImageUrl(originalFileName),
          originalUrl: buildImageUrl(originalFileName),
          previewSmUrl: buildImageUrl(smFileName),
          previewMediumUrl: buildImageUrl(mediumFileName)
        });
      } catch {
        return reply.code(422).send({
          code: 'CATALOG_IMAGE_PROCESSING_FAILED',
          message: 'Failed to process image',
          requestId: request.id
        });
      }
    }
  );

  app.get<{ Params: { fileName: string } }>('/catalog/images/files/:fileName', async (request, reply) => {
    const fileName = request.params.fileName;
    if (!validateImageFileName(fileName)) {
      return reply.code(404).send();
    }

    const filePath = path.resolve(PRODUCT_IMAGES_DIR, fileName);
    if (!filePath.startsWith(PRODUCT_IMAGES_DIR)) {
      return reply.code(404).send();
    }

    try {
      const content = await readFile(filePath);
      reply.type('image/webp');
      return reply.send(content);
    } catch {
      return reply.code(404).send();
    }
  });

  app.get<{ Querystring: CatalogListQuery; Reply: CatalogListResponse }>('/catalog', async (request) => {
    const page = Math.max(1, Number(request.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(request.query.pageSize ?? 20)));
    const skip = (page - 1) * pageSize;
    const sortBy = request.query.sortBy ?? 'createdAt';
    const sortOrder = request.query.sortOrder ?? 'desc';
    const isPublished = parseBoolean(request.query.isPublished);

    const where = {
      deletedAt: null as null,
      ...(request.query.categoryId ? { categoryId: request.query.categoryId } : {}),
      ...(isPublished !== undefined ? { isPublished } : {})
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        include: {
          variants: true,
          images: true
        },
        skip,
        take: pageSize
      }),
      prisma.product.count({ where })
    ]);

    return {
      items: items.map(toProductDto),
      page,
      pageSize,
      total
    };
  });

  app.get<{ Params: { id: string }; Reply: ProductDto | ApiErrorResponse }>(
    '/catalog/:id',
    async (request, reply) => {
    const product = await prisma.product.findFirst({
      where: {
        id: request.params.id,
        deletedAt: null
      },
      include: {
        variants: true,
        images: true
      }
    });

    if (!product) {
      return reply.code(404).send({
        code: 'CATALOG_PRODUCT_NOT_FOUND',
        message: 'Product not found',
        requestId: request.id
      });
    }

    return toProductDto(product);
    }
  );

  app.post<{ Body: ProductCreateInput; Reply: ProductDto | ApiErrorResponse }>(
    '/catalog',
    async (request, reply) => {
    const body = request.body;
    const itemNumberValidationError = validateProductItemNumber(body.itemNumber, request.id);
    if (itemNumberValidationError) {
      return reply.code(422).send(itemNumberValidationError);
    }
    const saleValidationError = validateSalePrice(body.sale, body.price, request.id);
    if (saleValidationError) {
      return reply.code(422).send(saleValidationError);
    }
    const schema = await prisma.categoryAttributeSchema.findFirst({
      where: {
        subcategoryId: body.categoryId,
        status: 'active'
      },
      orderBy: { version: 'desc' }
    });

    const attributesSnapshot = (body.attributesSnapshot ?? {}) as Record<string, unknown>;
    if (schema) {
      const validationError = validateAttributesSnapshot(
        parseAttributeSchemaFields(schema.fieldsJson),
        attributesSnapshot,
        request.id
      );
      if (validationError) {
        return reply.code(422).send(validationError);
      }
    } else if (Object.keys(attributesSnapshot).length > 0) {
      return reply.code(409).send({
        code: 'CATALOG_ATTRIBUTES_SCHEMA_NOT_FOUND',
        message: 'Active attributes schema not found for category',
        requestId: request.id
      });
    }

    const product = await prisma.product.create({
      data: {
        title: body.title,
        itemNumber: body.itemNumber.trim(),
        slug: body.slug,
        description: body.description,
        categoryId: body.categoryId,
        price: body.price,
        sale: body.sale ?? null,
        currency: 'RUB',
        schemaVersion: schema?.version ?? null,
        attributesSnapshot: schema ? (attributesSnapshot as Prisma.InputJsonValue) : Prisma.DbNull,
        isPublished: false,
        variants: {
          create: (body.variants ?? []).map((variant) => ({
            sku: variant.sku,
            color: variant.color,
            size: variant.size,
            stock: variant.stock ?? 0
          }))
        },
        images: {
          create: (body.images ?? []).map((image) => ({
            url: image.url,
            originalUrl: image.originalUrl ?? image.url,
            smUrl: image.previewSmUrl ?? image.url,
            mediumUrl: image.previewMediumUrl ?? image.url,
            sortOrder: image.sortOrder ?? 0
          }))
        }
      },
      include: {
        variants: true,
        images: true
      }
    });

      return reply.code(201).send(toProductDto(product));
    }
  );

  app.patch<{ Params: { id: string }; Body: ProductUpdateInput; Reply: ProductDto | ApiErrorResponse }>(
    '/catalog/:id',
    async (request, reply) => {
      const existing = await prisma.product.findFirst({
        where: {
          id: request.params.id,
          deletedAt: null
        },
        select: {
          id: true,
          itemNumber: true,
          categoryId: true,
          attributesSnapshot: true,
          price: true,
          sale: true
        }
      });

      if (!existing) {
        return reply.code(404).send({
          code: 'CATALOG_PRODUCT_NOT_FOUND',
          message: 'Product not found',
          requestId: request.id
        });
      }

      const { variants, images, ...productData } = request.body;
      const nextItemNumber = request.body.itemNumber ?? existing.itemNumber;
      const itemNumberValidationError = validateProductItemNumber(nextItemNumber, request.id);
      if (itemNumberValidationError) {
        return reply.code(422).send(itemNumberValidationError);
      }
      const nextPrice = request.body.price ?? existing.price;
      const nextSale = request.body.sale === undefined ? existing.sale : request.body.sale;
      const saleValidationError = validateSalePrice(nextSale, nextPrice, request.id);
      if (saleValidationError) {
        return reply.code(422).send(saleValidationError);
      }
      const categoryId = request.body.categoryId ?? existing.categoryId;
      const schema = await prisma.categoryAttributeSchema.findFirst({
        where: {
          subcategoryId: categoryId,
          status: 'active'
        },
        orderBy: { version: 'desc' }
      });

      const requestedAttributes =
        request.body.attributesSnapshot === undefined
          ? ((existing.attributesSnapshot ?? {}) as Record<string, unknown>)
          : (request.body.attributesSnapshot as Record<string, unknown>);

      if (schema) {
        const validationError = validateAttributesSnapshot(
          parseAttributeSchemaFields(schema.fieldsJson),
          requestedAttributes,
          request.id
        );
        if (validationError) {
          return reply.code(422).send(validationError);
        }
      } else if (Object.keys(requestedAttributes).length > 0) {
        return reply.code(409).send({
          code: 'CATALOG_ATTRIBUTES_SCHEMA_NOT_FOUND',
          message: 'Active attributes schema not found for category',
          requestId: request.id
        });
      }

      const product = await prisma.$transaction(async (tx) => {
        if (variants) {
          await tx.productVariant.deleteMany({
            where: { productId: request.params.id }
          });
        }
        if (images) {
          await tx.productImage.deleteMany({
            where: { productId: request.params.id }
          });
        }

        return tx.product.update({
          where: { id: request.params.id },
          data: {
            ...productData,
            itemNumber: nextItemNumber.trim(),
            currency: 'RUB',
            schemaVersion: schema?.version ?? null,
            attributesSnapshot: schema ? (requestedAttributes as Prisma.InputJsonValue) : Prisma.DbNull,
            ...(variants
              ? {
                  variants: {
                    create: variants.map((variant) => ({
                      sku: variant.sku,
                      color: variant.color,
                      size: variant.size,
                      stock: variant.stock ?? 0
                    }))
                  }
                }
              : {}),
            ...(images
              ? {
                  images: {
                    create: images.map((image) => ({
                      url: image.url,
                      originalUrl: image.originalUrl ?? image.url,
                      smUrl: image.previewSmUrl ?? image.url,
                      mediumUrl: image.previewMediumUrl ?? image.url,
                      sortOrder: image.sortOrder ?? 0
                    }))
                  }
                }
              : {})
          },
          include: {
            variants: true,
            images: true
          }
        });
      });

      return toProductDto(product);
    }
  );

  app.delete<{ Params: { id: string } }>('/catalog/:id', async (request, reply) => {
    const existing = await prisma.product.findFirst({
      where: {
        id: request.params.id,
        deletedAt: null
      }
    });

    if (!existing) {
      return reply.code(404).send({
        code: 'CATALOG_PRODUCT_NOT_FOUND',
        message: 'Product not found',
        requestId: request.id
      });
    }

    await prisma.product.update({
      where: { id: request.params.id },
      data: {
        deletedAt: new Date(),
        isPublished: false,
        publishedAt: null,
        publishedBy: null
      }
    });

    return reply.code(204).send();
  });

  app.patch<{ Params: { id: string }; Body: ProductPublishInput; Reply: ProductDto | ApiErrorResponse }>(
    '/catalog/:id/publish',
    async (request, reply) => {
      const existing = await prisma.product.findFirst({
        where: {
          id: request.params.id,
          deletedAt: null
        }
      });

      if (!existing) {
        return reply.code(404).send({
          code: 'CATALOG_PRODUCT_NOT_FOUND',
          message: 'Product not found',
          requestId: request.id
        });
      }

      const isPublished = request.body.isPublished;
      const product = await prisma.product.update({
        where: { id: request.params.id },
        data: {
          isPublished,
          publishedAt: isPublished ? new Date() : null,
          publishedBy: isPublished ? 'admin' : null
        },
        include: {
          variants: true,
          images: true
        }
      });

      return toProductDto(product);
    }
  );

  app.post<{ Body: ProductBulkPublishInput; Reply: { updated: number } | ApiErrorResponse }>(
    '/catalog/bulk/publish',
    async (request, reply) => {
      if (!request.body.ids.length) {
        return reply.code(422).send({
          code: 'CATALOG_BULK_PUBLISH_EMPTY_IDS',
          message: 'ids must not be empty',
          requestId: request.id
        });
      }

      const isPublished = request.body.isPublished;
      const result = await prisma.product.updateMany({
        where: {
          id: { in: request.body.ids },
          deletedAt: null
        },
        data: {
          isPublished,
          publishedAt: isPublished ? new Date() : null,
          publishedBy: isPublished ? 'admin' : null
        }
      });

      return { updated: result.count };
    }
  );

  app.get<{ Reply: CatalogListResponse }>('/storefront/catalog', async () => {
    const page = 1;
    const pageSize = 50;
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          deletedAt: null,
          isPublished: true
        },
        orderBy: { createdAt: 'desc' },
        include: {
          variants: true,
          images: true
        },
        take: pageSize
      }),
      prisma.product.count({
        where: {
          deletedAt: null,
          isPublished: true
        }
      })
    ]);

    return {
      items: items.map(toProductDto),
      page,
      pageSize,
      total
    };
  });

  app.get<{ Params: { slug: string }; Reply: ProductDto | ApiErrorResponse }>(
    '/storefront/catalog/:slug',
    async (request, reply) => {
      const product = await prisma.product.findFirst({
        where: {
          slug: request.params.slug,
          deletedAt: null,
          isPublished: true
        },
        include: {
          variants: true,
          images: true
        }
      });

      if (!product) {
        return reply.code(404).send({
          code: 'CATALOG_PRODUCT_NOT_FOUND',
          message: 'Product not found',
          requestId: request.id
        });
      }

      return toProductDto(product);
    }
  );
}
