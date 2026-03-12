import { PrismaClient } from '@prisma/client';

function buildDatabaseUrl(): string {
  // If DATABASE_URL is already set, use it directly
  if (process.env.DATABASE_URL) {
    const base = process.env.DATABASE_URL;
    // Add connection pool limit if not already present
    if (!base.includes('connection_limit')) {
      return base + (base.includes('?') ? '&' : '?') + 'connection_limit=5';
    }
    return base;
  }

  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const name = process.env.DB_NAME || 'maintpro';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || '';
  const ssl = process.env.DB_SSL === 'true' ? '&sslmode=require' : '';

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}?connection_limit=5${ssl}`;
}

const url = buildDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: { db: { url } },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
