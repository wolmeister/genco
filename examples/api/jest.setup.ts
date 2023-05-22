/// <reference types="@types/jest" />

import { mockReset } from 'jest-mock-extended';

import { prismaMock } from './src/testing';

jest.mock('./src/prisma.ts', () => ({
  __esModule: true,
  prisma: prismaMock,
}));

beforeEach(() => {
  mockReset(prismaMock);
});
