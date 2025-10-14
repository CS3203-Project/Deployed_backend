import { jest } from '@jest/globals';

export const mockJwt = {
  sign: jest.fn() as jest.MockedFunction<any>,
  verify: jest.fn() as jest.MockedFunction<any>,
};

export default mockJwt;