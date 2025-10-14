import { jest } from '@jest/globals';

export const mockHash = {
  hashPassword: jest.fn() as jest.MockedFunction<any>,
  comparePassword: jest.fn() as jest.MockedFunction<any>,
};

export default mockHash;