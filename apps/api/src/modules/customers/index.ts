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

type OrderStats = {
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
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

function toCustomerDto(
  account: { id: string; email: string; fullName: string; phone: string },
  stats?: OrderStats
): CustomerDto {
  return {
    id: account.id,
    email: account.email,
    name: account.fullName,
    phone: account.phone,
    ordersCount: stats?.ordersCount ?? 0,
    totalSpent: stats?.totalSpent ?? 0,
    lastOrderAt: stats?.lastOrderAt ?? null
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
              { email: { contains: search, mode: 'insensitive' as const } },
              { fullName: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search, mode: 'insensitive' as const } }
            ]
          }
        : {};

      const [accounts, total] = await Promise.all([
        prisma.customerAccount.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize
        }),
        prisma.customerAccount.count({ where })
      ]);

      const emails = accounts.map((account) => account.email);
      const groupedOrders = emails.length
        ? await prisma.order.groupBy({
            by: ['customerEmail'],
            where: {
              customerEmail: {
                in: emails
              }
            },
            _count: { _all: true },
            _sum: { amountTotal: true },
            _max: { createdAt: true }
          })
        : [];

      const statsByEmail = new Map(
        groupedOrders.map((group) => [
          group.customerEmail,
          {
            ordersCount: group._count._all,
            totalSpent: group._sum.amountTotal ?? 0,
            lastOrderAt: group._max.createdAt ? group._max.createdAt.toISOString() : null
          } satisfies OrderStats
        ])
      );

      return {
        items: accounts.map((account) => toCustomerDto(account, statsByEmail.get(account.email))),
        page,
        pageSize,
        total
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

      const customerAccount = await prisma.customerAccount.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true
        }
      });

      if (!customerAccount) {
        return reply.code(404).send({
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found',
          requestId: request.id
        });
      }

      const [orders, total, ordersStats] = await Promise.all([
        prisma.order.findMany({
          where: { customerEmail: email },
          include: { items: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize
        }),
        prisma.order.count({
          where: { customerEmail: email }
        }),
        prisma.order.aggregate({
          where: { customerEmail: email },
          _count: { _all: true },
          _sum: { amountTotal: true },
          _max: { createdAt: true }
        })
      ]);

      const customer = toCustomerDto(customerAccount, {
        ordersCount: ordersStats._count._all,
        totalSpent: ordersStats._sum.amountTotal ?? 0,
        lastOrderAt: ordersStats._max.createdAt ? ordersStats._max.createdAt.toISOString() : null
      });

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
