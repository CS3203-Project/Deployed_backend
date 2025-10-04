import { PrismaClient } from '@prisma/client';

// Singleton Prisma client to prevent multiple instances
class DatabaseManager {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new PrismaClient({
        log: ['warn', 'error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });

      // Handle graceful shutdown
      process.on('beforeExit', async () => {
        await DatabaseManager.instance.$disconnect();
      });

      process.on('SIGINT', async () => {
        await DatabaseManager.instance.$disconnect();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await DatabaseManager.instance.$disconnect();
        process.exit(0);
      });
    }

    return DatabaseManager.instance;
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseManager.instance) {
      await DatabaseManager.instance.$disconnect();
    }
  }
}

// Export the singleton instance
export const prisma = DatabaseManager.getInstance();
