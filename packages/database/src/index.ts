import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Logger } from '@nestjs/common'; // ← Add this import

export * from '@prisma/client';

// Use a dedicated logger instance for Prisma-related output
const prismaLogger = new Logger('PrismaClient', {
  timestamp: true, // optional: adds [timestamp] prefix
});

// Global for hot-reloading in dev (your existing pattern)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

// Create the client once
const prismaInstance = new PrismaClient({
  adapter,

  // Only log errors and warnings by default (as you already set)
  log: [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
    // Optional: add info in development only
    ...(process.env.NODE_ENV === 'development' ? [{ emit: 'event', level: 'info' }] : []),
  ],
});

// Forward Prisma events to Nest Logger (structured + colors in dev)
prismaInstance.$on('error', (e) => {
  prismaLogger.error(`Prisma error: ${e.message}`, e.target ? `Target: ${e.target}` : undefined);
});

prismaInstance.$on('warn', (e) => {
  prismaLogger.warn(`Prisma warning: ${e.message}`, e.target ? `Target: ${e.target}` : undefined);
});

prismaInstance.$on('info', (e) => {
  // Only in dev — optional info level (e.g. connection established)
  if (process.env.NODE_ENV === 'development') {
    prismaLogger.log(`Prisma info: ${e.message}`);
  }
});

// Optional: If you ever want query logging back temporarily (dev only)
if (process.env.NODE_ENV === 'development' && process.env.PRISMA_QUERY_LOG === 'true') {
  prismaInstance.$on('query', (e) => {
    prismaLogger.verbose(
      `Query: ${e.query} - Params: ${e.params} - Duration: ${e.duration}ms`,
      `Target: ${e.target}`,
    );
  });
}

// Hot-reload safety in non-prod
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaInstance;
}

export const prisma = prismaInstance;