import Fastify from 'fastify';
import {
  registerAuthModule,
  registerCatalogModule,
  registerHealthModule,
  registerOrdersModule
} from './modules/index.js';

export function createApp() {
  const app = Fastify({
    logger: true
  });

  app.register(registerHealthModule);
  app.register(registerCatalogModule, { prefix: '/api' });
  app.register(registerAuthModule, { prefix: '/api' });
  app.register(registerOrdersModule, { prefix: '/api' });

  return app;
}
