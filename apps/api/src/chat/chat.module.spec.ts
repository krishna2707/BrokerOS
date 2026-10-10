import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@brokeros/prisma', () => ({
  PrismaClient: class {},
  prismaClient: { $connect: jest.fn(), $disconnect: jest.fn() },
}));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@vercel/blob', () => ({
  put: jest.fn().mockResolvedValue({ url: 'https://blob.vercel.com/test' }),
}));

import { ChatModule } from './chat.module.js';
import { PrismaModule } from '../lib/database/prisma.module.js';

describe('ChatModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule, ChatModule],
    })
      .overrideProvider('PrismaService')
      .useValue({})
      .compile();
  });

  afterEach(async () => {
    if (module) await module.close();
    jest.clearAllMocks();
  });

  it('should compile and provide ChatService', () => {
    expect(module).toBeDefined();
    const chatModule = module.get<ChatModule>(ChatModule);
    expect(chatModule).toBeDefined();
  });
});
