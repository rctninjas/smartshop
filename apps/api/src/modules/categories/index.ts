import type { FastifyInstance } from 'fastify';
import type {
  CategoryAttributesSchemaResponse,
  CategoryAttributesSchemaUpdateInput,
  CategoryAttributeFieldDto,
  CategoryAttributeSchemaDto,
  CategoryCreateInput,
  CategoryDto,
  CategoryTreeNodeDto,
  CategoryUpdateInput
} from '@smartshop/types';
import { prisma } from '../../lib/db.js';

type ApiErrorResponse = {
  code: string;
  message: string;
  requestId: string;
};

const ALLOWED_FIELD_TYPES = new Set(['text', 'number', 'boolean', 'select', 'multiselect']);

function toCategoryDto(category: {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentId: category.parentId,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString()
  };
}

function buildTree(categories: CategoryDto[]): CategoryTreeNodeDto[] {
  const map = new Map<string, CategoryTreeNodeDto>();
  for (const category of categories) {
    map.set(category.id, { ...category, children: [] });
  }

  const roots: CategoryTreeNodeDto[] = [];
  for (const node of map.values()) {
    if (node.parentId) {
      const parent = map.get(node.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  for (const node of map.values()) {
    node.children.sort((a, b) => a.sortOrder - b.sortOrder);
  }
  roots.sort((a, b) => a.sortOrder - b.sortOrder);

  return roots;
}

function parseSchemaFields(value: unknown): CategoryAttributeFieldDto[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as CategoryAttributeFieldDto[];
}

function toSchemaDto(schema: {
  id: string;
  subcategoryId: string;
  version: number;
  status: string;
  fieldsJson: unknown;
  createdAt: Date;
  updatedAt: Date;
}): CategoryAttributeSchemaDto {
  return {
    id: schema.id,
    subcategoryId: schema.subcategoryId,
    version: schema.version,
    status: schema.status as CategoryAttributeSchemaDto['status'],
    fields: parseSchemaFields(schema.fieldsJson),
    createdAt: schema.createdAt.toISOString(),
    updatedAt: schema.updatedAt.toISOString()
  };
}

function validateAttributeFields(fields: CategoryAttributeFieldDto[], requestId: string): ApiErrorResponse | null {
  const keys = new Set<string>();
  for (const field of fields) {
    const normalizedKey = field.key?.trim();
    if (!normalizedKey) {
      return {
        code: 'CATEGORY_ATTRIBUTES_INVALID_FIELD_KEY',
        message: 'Field key is required',
        requestId
      };
    }
    if (keys.has(normalizedKey)) {
      return {
        code: 'CATEGORY_ATTRIBUTES_DUPLICATE_FIELD_KEY',
        message: `Duplicate field key: ${normalizedKey}`,
        requestId
      };
    }
    keys.add(normalizedKey);

    if (!field.label?.trim()) {
      return {
        code: 'CATEGORY_ATTRIBUTES_INVALID_FIELD_LABEL',
        message: `Field label is required for key: ${normalizedKey}`,
        requestId
      };
    }

    if (!ALLOWED_FIELD_TYPES.has(field.type)) {
      return {
        code: 'CATEGORY_ATTRIBUTES_INVALID_FIELD_TYPE',
        message: `Invalid field type for key: ${normalizedKey}`,
        requestId
      };
    }

    if ((field.type === 'select' || field.type === 'multiselect') && (!field.options || !field.options.length)) {
      return {
        code: 'CATEGORY_ATTRIBUTES_OPTIONS_REQUIRED',
        message: `Field options are required for key: ${normalizedKey}`,
        requestId
      };
    }
  }
  return null;
}

async function ensureValidParent(
  parentId: string | null | undefined,
  requestId: string,
  selfId?: string
): Promise<ApiErrorResponse | null> {
  if (!parentId) {
    return null;
  }

  if (selfId && parentId === selfId) {
    return {
      code: 'CATEGORY_CYCLE_DETECTED',
      message: 'Category cannot be parent for itself',
      requestId
    };
  }

  const parent = await prisma.category.findFirst({
    where: {
      id: parentId,
      deletedAt: null
    }
  });

  if (!parent) {
    return {
      code: 'CATEGORY_NOT_FOUND',
      message: 'Parent category not found',
      requestId
    };
  }

  // Enforce max depth = 2 levels: parent cannot have parent.
  if (parent.parentId) {
    return {
      code: 'CATEGORY_DEPTH_LIMIT_EXCEEDED',
      message: 'Category nesting depth cannot exceed 2 levels',
      requestId
    };
  }

  return null;
}

async function ensureCategoryExists(id: string, requestId: string): Promise<CategoryDto | ApiErrorResponse> {
  const category = await prisma.category.findFirst({
    where: {
      id,
      deletedAt: null
    }
  });

  if (!category) {
    return {
      code: 'CATEGORY_NOT_FOUND',
      message: 'Category not found',
      requestId
    };
  }

  return toCategoryDto(category);
}

export async function registerCategoriesModule(app: FastifyInstance) {
  app.get<{ Reply: CategoryTreeNodeDto[] }>('/categories/tree', async () => {
    const categories = await prisma.category.findMany({
      where: {
        deletedAt: null
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    });

    return buildTree(categories.map(toCategoryDto));
  });

  app.post<{ Body: CategoryCreateInput; Reply: CategoryDto | ApiErrorResponse }>(
    '/categories',
    async (request, reply) => {
      const parentError = await ensureValidParent(request.body.parentId, request.id);
      if (parentError) {
        return reply.code(parentError.code === 'CATEGORY_NOT_FOUND' ? 404 : 409).send(parentError);
      }

      const category = await prisma.category.create({
        data: {
          name: request.body.name,
          slug: request.body.slug,
          parentId: request.body.parentId ?? null,
          sortOrder: request.body.sortOrder ?? 0,
          isActive: request.body.isActive ?? true
        }
      });

      return reply.code(201).send(toCategoryDto(category));
    }
  );

  app.get<{ Params: { id: string }; Reply: CategoryDto | ApiErrorResponse }>(
    '/categories/:id',
    async (request, reply) => {
      const category = await prisma.category.findFirst({
        where: {
          id: request.params.id,
          deletedAt: null
        }
      });

      if (!category) {
        return reply.code(404).send({
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found',
          requestId: request.id
        });
      }

      return toCategoryDto(category);
    }
  );

  app.get<{ Params: { id: string }; Reply: CategoryAttributesSchemaResponse | ApiErrorResponse }>(
    '/categories/:id/attributes/schema',
    async (request, reply) => {
      const category = await ensureCategoryExists(request.params.id, request.id);
      if ('code' in category) {
        return reply.code(404).send(category);
      }

      const schemas = await prisma.categoryAttributeSchema.findMany({
        where: { subcategoryId: category.id },
        orderBy: { version: 'desc' }
      });

      const activeRaw = schemas.find((item) => item.status === 'active') ?? null;
      const draftRaw = schemas.find((item) => item.status === 'draft') ?? null;

      return {
        active: activeRaw ? toSchemaDto(activeRaw) : null,
        draft: draftRaw ? toSchemaDto(draftRaw) : null
      };
    }
  );

  app.post<{ Params: { id: string }; Reply: CategoryAttributeSchemaDto | ApiErrorResponse }>(
    '/categories/:id/attributes/schema/draft',
    async (request, reply) => {
      const category = await ensureCategoryExists(request.params.id, request.id);
      if ('code' in category) {
        return reply.code(404).send(category);
      }

      const existingDraft = await prisma.categoryAttributeSchema.findFirst({
        where: { subcategoryId: category.id, status: 'draft' }
      });
      if (existingDraft) {
        return toSchemaDto(existingDraft);
      }

      const [latestVersionRecord, activeSchema] = await Promise.all([
        prisma.categoryAttributeSchema.findFirst({
          where: { subcategoryId: category.id },
          orderBy: { version: 'desc' },
          select: { version: true }
        }),
        prisma.categoryAttributeSchema.findFirst({
          where: { subcategoryId: category.id, status: 'active' }
        })
      ]);

      const nextVersion = (latestVersionRecord?.version ?? 0) + 1;
      const draft = await prisma.categoryAttributeSchema.create({
        data: {
          subcategoryId: category.id,
          version: nextVersion,
          status: 'draft',
          fieldsJson: activeSchema?.fieldsJson ?? []
        }
      });

      return reply.code(201).send(toSchemaDto(draft));
    }
  );

  app.patch<{
    Params: { id: string };
    Body: CategoryAttributesSchemaUpdateInput;
    Reply: CategoryAttributeSchemaDto | ApiErrorResponse;
  }>('/categories/:id/attributes/schema/draft', async (request, reply) => {
    const category = await ensureCategoryExists(request.params.id, request.id);
    if ('code' in category) {
      return reply.code(404).send(category);
    }

    const validationError = validateAttributeFields(request.body.fields, request.id);
    if (validationError) {
      return reply.code(422).send(validationError);
    }

    const draft = await prisma.categoryAttributeSchema.findFirst({
      where: { subcategoryId: category.id, status: 'draft' }
    });
    if (!draft) {
      return reply.code(404).send({
        code: 'CATEGORY_SCHEMA_DRAFT_NOT_FOUND',
        message: 'Draft schema not found',
        requestId: request.id
      });
    }

    const updated = await prisma.categoryAttributeSchema.update({
      where: { id: draft.id },
      data: { fieldsJson: request.body.fields }
    });

    return toSchemaDto(updated);
  });

  app.post<{ Params: { id: string }; Reply: CategoryAttributeSchemaDto | ApiErrorResponse }>(
    '/categories/:id/attributes/schema/publish',
    async (request, reply) => {
      const category = await ensureCategoryExists(request.params.id, request.id);
      if ('code' in category) {
        return reply.code(404).send(category);
      }

      const draft = await prisma.categoryAttributeSchema.findFirst({
        where: { subcategoryId: category.id, status: 'draft' }
      });
      if (!draft) {
        return reply.code(404).send({
          code: 'CATEGORY_SCHEMA_DRAFT_NOT_FOUND',
          message: 'Draft schema not found',
          requestId: request.id
        });
      }

      const draftFields = parseSchemaFields(draft.fieldsJson);
      const validationError = validateAttributeFields(draftFields, request.id);
      if (validationError) {
        return reply.code(422).send(validationError);
      }

      const active = await prisma.$transaction(async (tx) => {
        await tx.categoryAttributeSchema.updateMany({
          where: {
            subcategoryId: category.id,
            status: 'active'
          },
          data: { status: 'archived' }
        });

        return tx.categoryAttributeSchema.update({
          where: { id: draft.id },
          data: { status: 'active' }
        });
      });

      return toSchemaDto(active);
    }
  );

  app.patch<{ Params: { id: string }; Body: CategoryUpdateInput; Reply: CategoryDto | ApiErrorResponse }>(
    '/categories/:id',
    async (request, reply) => {
      const existing = await prisma.category.findFirst({
        where: {
          id: request.params.id,
          deletedAt: null
        }
      });

      if (!existing) {
        return reply.code(404).send({
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found',
          requestId: request.id
        });
      }

      const parentError = await ensureValidParent(request.body.parentId, request.id, request.params.id);
      if (parentError) {
        return reply.code(parentError.code === 'CATEGORY_NOT_FOUND' ? 404 : 409).send(parentError);
      }

      const category = await prisma.category.update({
        where: { id: request.params.id },
        data: {
          name: request.body.name,
          slug: request.body.slug,
          parentId: request.body.parentId,
          sortOrder: request.body.sortOrder,
          isActive: request.body.isActive
        }
      });

      return toCategoryDto(category);
    }
  );

  app.delete<{ Params: { id: string }; Reply: { success: boolean } | ApiErrorResponse }>(
    '/categories/:id',
    async (request, reply) => {
      const existing = await prisma.category.findFirst({
        where: {
          id: request.params.id,
          deletedAt: null
        }
      });

      if (!existing) {
        return reply.code(404).send({
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found',
          requestId: request.id
        });
      }

      const [activeProductsCount, childrenCount] = await Promise.all([
        prisma.product.count({
          where: {
            categoryId: request.params.id,
            deletedAt: null
          }
        }),
        prisma.category.count({
          where: {
            parentId: request.params.id,
            deletedAt: null
          }
        })
      ]);

      if (activeProductsCount > 0) {
        return reply.code(409).send({
          code: 'CATEGORY_DELETE_HAS_ACTIVE_PRODUCTS',
          message: 'Cannot delete category with active products',
          requestId: request.id
        });
      }

      if (childrenCount > 0) {
        return reply.code(409).send({
          code: 'CATEGORY_DELETE_HAS_CHILDREN',
          message: 'Cannot delete category with child categories',
          requestId: request.id
        });
      }

      await prisma.category.update({
        where: { id: request.params.id },
        data: {
          isActive: false,
          deletedAt: new Date()
        }
      });

      return { success: true };
    }
  );
}
