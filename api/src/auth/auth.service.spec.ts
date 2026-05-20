import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

type UsersRepository = {
  findOne: jest.Mock
};

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: UsersRepository;

  beforeEach(async () => {
    usersRepository = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { 
          provide: getRepositoryToken(User),
          useValue: usersRepository
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('throws Unauthorized when username and password are not passed', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.login({} as LoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws Unauthorized when the user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ username: 'ghost', password: 'whatever' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws Unauthorized when the password does not match', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        username: 'alice',
        password: 'correct-password',
        isAdmin: false,
      });

      await expect(
        service.login({ username: 'alice', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns the user payload for valid credentials', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 7,
        username: 'alice',
        password: 'secret',
        isAdmin: true,
      });

      const result = await service.login({
        username: 'alice',
        password: 'secret',
      });

      expect(result).toEqual({
        user_id: 7,
        username: 'alice',
        is_admin: true,
      });
    });
  });
});
