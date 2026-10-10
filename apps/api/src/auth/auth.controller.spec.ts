import { Test, TestingModule } from '@nestjs/testing';

jest.mock('../lib/database/prisma.service.js', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({})),
}));

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call authService.login on login', async () => {
    const loginDto: LoginDto = {
      phoneNumber: '1234567890',
      password: 'password123',
    };
    const expectedResponse = {
      access_token: 'jwt-token',
      user: { id: 'u-1', name: 'User 1', phoneNumber: '1234567890' },
    };

    mockAuthService.login.mockResolvedValue(expectedResponse);

    const result = await controller.login(loginDto);
    expect(authService.login).toHaveBeenCalledWith(loginDto);
    expect(result).toEqual(expectedResponse);
  });
});
