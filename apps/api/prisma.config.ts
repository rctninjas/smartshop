import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const defaultDatabaseUrl = 'postgresql://smartshop:smartshop@localhost:5452/smartshop?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? defaultDatabaseUrl
  }
});
