import type { FastifyInstance } from 'fastify';
import type {
  OrderCreateInput,
  OrderDto,
  OrderStatus,
  OrderStatusUpdateInput
} from '@smartshop/types';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/db.js';

type OrdersListQuery = {
  page?: string;
  pageSize?: string;
  status?: OrderStatus;
  createdFrom?: string;
  createdTo?: string;
  search?: string;
};

type OrdersListResponse = {
  items: OrderDto[];
  page: number;
  pageSize: number;
  total: number;
};

type ApiErrorResponse = {
  code: string;
  message: string;
  requestId: string;
};

const AUTO_ARCHIVE_INTERVAL_MS = 60_000;
const PAYMENT_TIMEOUT_MS = 20 * 60_000;

function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === 'created') {
    return to === 'paid' || to === 'archived';
  }
  if (from === 'paid') {
    return to === 'shipped';
  }
  if (from === 'shipped') {
    return to === 'delivered';
  }
  return false;
}

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
    status: order.status as OrderStatus,
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

async function appendStatusHistory(
  orderId: string,
  toStatus: OrderStatus,
  fromStatus: OrderStatus | null,
  reason: string | null,
  changedBy = 'system'
) {
  await prisma.orderStatusHistory.create({
    data: {
      orderId,
      fromStatus,
      toStatus,
      reason,
      changedBy
    }
  });
}

export async function registerOrdersModule(app: FastifyInstance) {
  let archiveTimer: NodeJS.Timeout | null = null;

  app.addHook('onReady', async () => {
    archiveTimer = setInterval(async () => {
      try {
        const threshold = new Date(Date.now() - PAYMENT_TIMEOUT_MS);
        const overdueOrders = await prisma.order.findMany({
          where: {
            status: 'created',
            isPaid: false,
            createdAt: { lt: threshold }
          },
          select: { id: true, status: true }
        });

        for (const order of overdueOrders) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'archived' }
          });
          await appendStatusHistory(order.id, 'archived', order.status as OrderStatus, 'payment_timeout');
        }
      } catch (error) {
        app.log.error({ error }, 'Auto-archive tick failed');
      }
    }, AUTO_ARCHIVE_INTERVAL_MS);
  });

  app.addHook('onClose', async () => {
    if (archiveTimer) {
      clearInterval(archiveTimer);
      archiveTimer = null;
    }
  });

  app.get<{ Querystring: OrdersListQuery; Reply: OrdersListResponse }>('/orders', async (request) => {
    const page = Math.max(1, Number(request.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(request.query.pageSize ?? 20)));
    const skip = (page - 1) * pageSize;

    const createdFrom = request.query.createdFrom ? new Date(request.query.createdFrom) : undefined;
    const createdTo = request.query.createdTo ? new Date(request.query.createdTo) : undefined;
    const search = request.query.search?.trim();

    const where = {
      ...(request.query.status ? { status: request.query.status } : {}),
      ...(createdFrom || createdTo
        ? {
            createdAt: {
              ...(createdFrom ? { gte: createdFrom } : {}),
              ...(createdTo ? { lte: createdTo } : {})
            }
          }
        : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search, mode: 'insensitive' as const } },
              { customerEmail: { contains: search, mode: 'insensitive' as const } },
              { customerPhone: { contains: search, mode: 'insensitive' as const } }
            ]
          }
        : {})
    };

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.order.count({ where })
    ]);

    return {
      items: items.map(toOrderDto),
      page,
      pageSize,
      total
    };
  });

  app.get<{ Params: { id: string }; Reply: OrderDto | ApiErrorResponse }>(
    '/orders/:id',
    async (request, reply) => {
      const order = await prisma.order.findUnique({
        where: { id: request.params.id },
        include: { items: true }
      });

      if (!order) {
        return reply.code(404).send({
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
          requestId: request.id
        });
      }

      return toOrderDto(order);
    }
  );

  app.post<{ Body: OrderCreateInput; Reply: OrderDto }>('/orders', async (request, reply) => {
    const body = request.body;
    const amountTotal = body.items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);

    const order = await prisma.order.create({
      data: {
        status: 'created',
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerEmail: body.customerEmail,
        deliveryMethod: body.deliveryMethod,
        deliveryAddress: body.deliveryAddress,
        paymentMethod: body.paymentMethod,
        amountTotal,
        items: {
          create: body.items.map((item) => ({
            productId: item.productId ?? null,
            quantity: item.quantity,
            titleSnapshot: item.titleSnapshot,
            priceSnapshot: item.priceSnapshot,
            attributesSnapshot: (item.attributesSnapshot ?? {}) as Prisma.InputJsonValue
          }))
        }
      },
      include: { items: true }
    });

    await appendStatusHistory(order.id, 'created', null, null, 'system');

    return reply.code(201).send(toOrderDto(order));
  });

  app.patch<{ Params: { id: string }; Body: OrderStatusUpdateInput; Reply: OrderDto | ApiErrorResponse }>(
    '/orders/:id/status',
    async (request, reply) => {
      const order = await prisma.order.findUnique({
        where: { id: request.params.id },
        include: { items: true }
      });

      if (!order) {
        return reply.code(404).send({
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
          requestId: request.id
        });
      }

      const fromStatus = order.status as OrderStatus;
      const toStatus = request.body.status;

      if (!canTransition(fromStatus, toStatus)) {
        return reply.code(409).send({
          code: 'ORDER_INVALID_STATUS_TRANSITION',
          message: `Transition ${fromStatus} -> ${toStatus} is not allowed`,
          requestId: request.id
        });
      }

      if (toStatus === 'shipped' && !request.body.trackNumber) {
        return reply.code(422).send({
          code: 'ORDER_TRACK_REQUIRED',
          message: 'trackNumber is required for shipped status',
          requestId: request.id
        });
      }

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: toStatus,
          isPaid: toStatus === 'paid' ? true : order.isPaid,
          trackNumber: toStatus === 'shipped' ? request.body.trackNumber ?? null : order.trackNumber
        },
        include: { items: true }
      });

      await appendStatusHistory(order.id, toStatus, fromStatus, null, 'admin');

      return toOrderDto(updated);
    }
  );
}
