import { jest } from '@jest/globals';

export const mockPrisma = {
  admin: {
    create: jest.fn() as jest.MockedFunction<any>,
    findUnique: jest.fn() as jest.MockedFunction<any>,
    findMany: jest.fn() as jest.MockedFunction<any>,
    update: jest.fn() as jest.MockedFunction<any>,
    delete: jest.fn() as jest.MockedFunction<any>,
  },
  serviceProvider: {
    findMany: jest.fn() as jest.MockedFunction<any>,
    findUnique: jest.fn() as jest.MockedFunction<any>,
    update: jest.fn() as jest.MockedFunction<any>,
  },
  user: {
    count: jest.fn() as jest.MockedFunction<any>,
    findMany: jest.fn() as jest.MockedFunction<any>,
  },
  service: {
    findMany: jest.fn() as jest.MockedFunction<any>,
  },
  payment: {
    findMany: jest.fn() as jest.MockedFunction<any>,
    aggregate: jest.fn() as jest.MockedFunction<any>,
    groupBy: jest.fn() as jest.MockedFunction<any>,
  },
};

export default mockPrisma;