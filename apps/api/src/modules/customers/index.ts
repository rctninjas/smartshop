import type { FastifyInstance } from 'fastify';
import type { CustomerDto, CustomerOrdersResponse, OrderDto, PaginatedResponse } from '@smartshop/types';
import { prisma } from '../../lib/db.js';

type CustomersListQuery = {
  page?: string;
  pageSize?: string;
  search?: string;
};

type CustomerOrdersQuery = {
  page?: string;
  pageSize?: string;
};

type ApiErrorResponse = {
  code: string;
  message: string;
  requestId: string;
};

function toOrderDto(order: {
  id: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryMethod: string;
  deliveryAddress: string;
  trackNumber: string | null;
  paymentMethod: string;
  isPaid: boolean;
  amountTotal: number;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    productId: string | null;
    quantity: number;
    titleSnapshot: string;
    priceSnapshot: number;
    attributesSnapshot: unknown;
  }>;
}): OrderDto {
  return {
    id: order.id,
    status: order.status as OrderDto['status'],
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    deliveryMethod: order.deliveryMethod,
    deliveryAddress: order.deliveryAddress,
    trackNumber: order.trackNumber,
    paymentMethod: order.paymentMethod,
    isPaid: order.isPaid,
    amountTotal: order.amountTotal,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      titleSnapshot: item.titleSnapshot,
      priceSnapshot: item.priceSnapshot,
      attributesSnapshot: (item.attributesSnapshot ?? {}) as Record<string, unknown>
    }))
  };
}

async function getCustomerSummaryByEmail(email: string): Promise<CustomerDto | null> {
  const [stats, latest] = await Promise.all([
    prisma.order.aggregate({
      where: { customerEmail: email },
      _count: { _all: true },
      _sum: { amountTotal: true },
      _max: { createdAt: true }
    }),
    prisma.order.findFirst({
      where: { customerEmail: email },
      orderBy: { createdAt: 'desc' },
      select: {
        customerName: true,
        customerPhone: true,
        customerEmail: true
      }
    })
  ]);

  if (!latest || stats._count._all === 0) {
    return null;
  }

  return {
    id: latest.customerEmail,
    email: latest.customerEmail,
    name: latest.customerName,
    phone: latest.customerPhone,
    ordersCount: stats._count._all,
    totalSpent: stats._sum.amountTotal ?? 0,
    lastOrderAt: stats._max.createdAt ? stats._max.createdAt.toISOString() : null
  };
}

export async function registerCustomersModule(app: FastifyInstance) {
  app.get<{ Querystring: CustomersListQuery; Reply: PaginatedResponse<CustomerDto> }>(
    '/customers',
    async (request) => {
      const page = Math.max(1, Number(request.query.page ?? 1));
      const pageSize = Math.min(100, Math.max(1, Number(request.query.pageSize ?? 20)));
      const skip = (page - 1) * pageSize;
      const search = request.query.search?.trim();

      const where = search
        ? {
            OR: [
              { customerEmail: { contains: search, mode: 'insensitive' as const } },
              { customerName: { contains: search, mode: 'insensitive' as const } },
              { customerPhone: { contains: search, mode: 'insensitive' as const } }
            ]
          }
        : {};

      const [groups, totalGroups] = await Promise.all([
        prisma.order.groupBy({
          by: ['customerEmail', 'customerName', 'customerPhone'],
          where,
          _count: { _all: true },
          _sum: { amountTotal: true },
          _max: { createdAt: true },
          orderBy: {
            _max: {
              createdAt: 'desc'
            }
          },
          skip,
          take: pageSize
        }),
        prisma.order.groupBy({
          by: ['customerEmail', 'customerName', 'customerPhone'],
          where
        })
      ]);

      return {
        items: groups.map((group) => ({
          id: group.customerEmail,
          email: group.customerEmail,
          name: group.customerName,
          phone: group.customerPhone,
          ordersCount: group._count._all,
          totalSpent: group._sum.amountTotal ?? 0,
          lastOrderAt: group._max.createdAt ? group._max.createdAt.toISOString() : null
        })),
        page,
        pageSize,
        total: totalGroups.length
      };
    }
  );

  app.get<{ Params: { email: string }; Querystring: CustomerOrdersQuery; Reply: CustomerOrdersResponse | ApiErrorResponse }>(
    '/customers/:email/orders',
    async (request, reply) => {
      const page = Math.max(1, Number(request.query.page ?? 1));
      const pageSize = Math.min(100, Math.max(1, Number(request.query.pageSize ?? 20)));
      const skip = (page - 1) * pageSize;
      const email = decodeURIComponent(request.params.email);

      const customer = await getCustomerSummaryByEmail(email);
      if (!customer) {
        return reply.code(404).send({
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found',
          requestId: request.id
        });
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: { customerEmail: email },
          include: { items: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize
        }),
        prisma.order.count({
          where: { customerEmail: email }
        })
      ]);

      return {
        customer,
        orders: {
          items: orders.map(toOrderDto),
          page,
          pageSize,
          total
        }
      };
    }
  );
}
