import type { FastifyInstance } from 'fastify';
import type {
  StorefrontCheckoutInput,
  StorefrontCustomerDto,
  StorefrontLoginCodeRequestInput,
  StorefrontLoginCodeVerifyInput,
  StorefrontLoginPasswordInput,
  StorefrontRegisterInput
} from '@smartshop/types';
import { prisma } from '../../lib/db.js';
import {
  CUSTOMER_SESSION_COOKIE,
  clearCustomerSession,
  createCustomerLoginCode,
  createCustomerSession,
  getCustomerSessionCookieOptions,
  getCustomerSessionFromRequest,
  hashPassword,
  verifyCustomerLoginCode,
  verifyPassword
} from '../../lib/storefront-auth.js';

type ApiErrorResponse = {
  code: string;
  message: string;
  requestId: string;
};

function normalizeCustomerDto(customer: {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}): StorefrontCustomerDto {
  return {
    id: customer.id,
    fullName: customer.fullName,
    email: customer.email,
    phone: customer.phone
  };
}

export async function registerStorefrontAuthModule(app: FastifyInstance) {
  app.post<{ Body: StorefrontRegisterInput; Reply: { customer: StorefrontCustomerDto } | ApiErrorResponse }>(
    '/storefront/auth/register',
    async (request, reply) => {
      const body = request.body;

      if (!body.consent) {
        return reply.code(422).send({
          code: 'CUSTOMER_CONSENT_REQUIRED',
          message: 'consent is required',
          requestId: request.id
        });
      }

      if (!body.fullName.trim() || !body.email.trim() || !body.phone.trim()) {
        return reply.code(422).send({
          code: 'CUSTOMER_REQUIRED_FIELDS',
          message: 'fullName, email and phone are required',
          requestId: request.id
        });
      }

      if (body.password.length < 8) {
        return reply.code(422).send({
          code: 'CUSTOMER_PASSWORD_TOO_SHORT',
          message: 'password must be at least 8 characters',
          requestId: request.id
        });
      }

      if (body.password !== body.passwordConfirm) {
        return reply.code(422).send({
          code: 'CUSTOMER_PASSWORD_CONFIRM_MISMATCH',
          message: 'password and passwordConfirm must match',
          requestId: request.id
        });
      }

      const existing = await prisma.customerAccount.findUnique({
        where: { email: body.email.toLowerCase().trim() }
      });
      if (existing) {
        return reply.code(409).send({
          code: 'CUSTOMER_EMAIL_EXISTS',
          message: 'Customer with this email already exists',
          requestId: request.id
        });
      }

      const customer = await prisma.customerAccount.create({
        data: {
          fullName: body.fullName.trim(),
          email: body.email.toLowerCase().trim(),
          phone: body.phone.trim(),
          passwordHash: hashPassword(body.password)
        }
      });

      const sessionToken = await createCustomerSession(customer.id);
      reply.setCookie(CUSTOMER_SESSION_COOKIE, sessionToken, getCustomerSessionCookieOptions());

      return reply.code(201).send({
        customer: normalizeCustomerDto(customer)
      });
    }
  );

  app.post<{ Body: StorefrontLoginPasswordInput; Reply: { customer: StorefrontCustomerDto } | ApiErrorResponse }>(
    '/storefront/auth/login/password',
    async (request, reply) => {
      const body = request.body;
      const customer = await prisma.customerAccount.findUnique({
        where: { email: body.email.toLowerCase().trim() }
      });

      if (!customer || !verifyPassword(body.password, customer.passwordHash)) {
        return reply.code(401).send({
          code: 'CUSTOMER_INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          requestId: request.id
        });
      }

      const sessionToken = await createCustomerSession(customer.id);
      reply.setCookie(CUSTOMER_SESSION_COOKIE, sessionToken, getCustomerSessionCookieOptions());

      return {
        customer: normalizeCustomerDto(customer)
      };
    }
  );

  app.post<{ Body: StorefrontLoginCodeRequestInput; Reply: { sent: true; devCode?: string } | ApiErrorResponse }>(
    '/storefront/auth/login/code/request',
    async (request, reply) => {
      const body = request.body;
      const customer = await prisma.customerAccount.findUnique({
        where: { email: body.email.toLowerCase().trim() }
      });
      if (!customer) {
        return reply.code(404).send({
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found',
          requestId: request.id
        });
      }

      const code = await createCustomerLoginCode(customer.id);
      const payload: { sent: true; devCode?: string } = { sent: true };
      if (process.env.NODE_ENV !== 'production') {
        payload.devCode = code;
      }
      return payload;
    }
  );

  app.post<{ Body: StorefrontLoginCodeVerifyInput; Reply: { customer: StorefrontCustomerDto } | ApiErrorResponse }>(
    '/storefront/auth/login/code/verify',
    async (request, reply) => {
      const body = request.body;
      const customer = await prisma.customerAccount.findUnique({
        where: { email: body.email.toLowerCase().trim() }
      });
      if (!customer) {
        return reply.code(404).send({
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found',
          requestId: request.id
        });
      }

      const isValidCode = await verifyCustomerLoginCode(customer.id, body.code.trim());
      if (!isValidCode) {
        return reply.code(401).send({
          code: 'CUSTOMER_INVALID_CODE',
          message: 'Invalid or expired login code',
          requestId: request.id
        });
      }

      const sessionToken = await createCustomerSession(customer.id);
      reply.setCookie(CUSTOMER_SESSION_COOKIE, sessionToken, getCustomerSessionCookieOptions());

      return {
        customer: normalizeCustomerDto(customer)
      };
    }
  );

  app.post('/storefront/auth/logout', async (request, reply) => {
    await clearCustomerSession(reply, request);
    return reply.code(204).send();
  });

  app.get<{ Reply: { customer: StorefrontCustomerDto } | ApiErrorResponse }>(
    '/storefront/auth/me',
    async (request, reply) => {
      const session = await getCustomerSessionFromRequest(request);
      if (!session) {
        return reply.code(401).send({
          code: 'CUSTOMER_UNAUTHORIZED',
          message: 'Authentication required',
          requestId: request.id
        });
      }

      const customer = await prisma.customerAccount.findUnique({
        where: { id: session.accountId }
      });
      if (!customer) {
        return reply.code(401).send({
          code: 'CUSTOMER_UNAUTHORIZED',
          message: 'Authentication required',
          requestId: request.id
        });
      }

      return {
        customer: normalizeCustomerDto(customer)
      };
    }
  );

  app.post<{ Body: StorefrontCheckoutInput; Reply: { orderId: string } | ApiErrorResponse }>(
    '/storefront/checkout',
    async (request, reply) => {
      const session = await getCustomerSessionFromRequest(request);
      if (!session) {
        return reply.code(401).send({
          code: 'CUSTOMER_UNAUTHORIZED',
          message: 'Authentication required',
          requestId: request.id
        });
      }

      const customer = await prisma.customerAccount.findUnique({
        where: { id: session.accountId }
      });
      if (!customer) {
        return reply.code(401).send({
          code: 'CUSTOMER_UNAUTHORIZED',
          message: 'Authentication required',
          requestId: request.id
        });
      }

      if (!request.body.items.length) {
        return reply.code(422).send({
          code: 'CHECKOUT_EMPTY_CART',
          message: 'Cart is empty',
          requestId: request.id
        });
      }

      if (request.body.forcePaymentFailure) {
        return reply.code(402).send({
          code: 'CHECKOUT_PAYMENT_FAILED',
          message: 'Payment failed',
          requestId: request.id
        });
      }

      const productIds = request.body.items.map((item) => item.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          deletedAt: null,
          isPublished: true
        }
      });
      const productsMap = new Map(products.map((item) => [item.id, item]));

      for (const item of request.body.items) {
        const product = productsMap.get(item.productId);
        if (!product) {
          return reply.code(404).send({
            code: 'CHECKOUT_PRODUCT_NOT_FOUND',
            message: `Product not found: ${item.productId}`,
            requestId: request.id
          });
        }
        if (item.quantity < 1) {
          return reply.code(422).send({
            code: 'CHECKOUT_INVALID_QUANTITY',
            message: 'Quantity must be at least 1',
            requestId: request.id
          });
        }
      }

      const snapshotItems = request.body.items.map((item) => {
        const product = productsMap.get(item.productId)!;
        return {
          productId: product.id,
          quantity: item.quantity,
          titleSnapshot: product.title,
          priceSnapshot: product.sale ?? product.price
        };
      });
      const amountTotal = snapshotItems.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);

      const order = await prisma.order.create({
        data: {
          status: 'paid',
          customerName: customer.fullName,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          deliveryMethod: request.body.deliveryMethod,
          deliveryAddress: request.body.deliveryAddress,
          paymentMethod: request.body.paymentMethod,
          isPaid: true,
          amountTotal,
          items: {
            create: snapshotItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              titleSnapshot: item.titleSnapshot,
              priceSnapshot: item.priceSnapshot,
              attributesSnapshot: {}
            }))
          },
          history: {
            create: [
              {
                fromStatus: null,
                toStatus: 'created',
                changedBy: 'customer'
              },
              {
                fromStatus: 'created',
                toStatus: 'paid',
                changedBy: 'customer'
              }
            ]
          }
        }
      });

      return reply.code(201).send({
        orderId: order.id
      });
    }
  );
}
