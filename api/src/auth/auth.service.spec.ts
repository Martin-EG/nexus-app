import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

type UsersRepository = {
  findOne: jest.Mock;
  update: jest.Mock;
};

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: UsersRepository;

  beforeEach(async () => {
    usersRepository = { findOne: jest.fn(), update: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
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
      const hash = await bcrypt.hash('correct-password', 10);
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        username: 'alice',
        password: hash,
        isAdmin: false,
      });

      await expect(
        service.login({ username: 'alice', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('accepts a password stored as a bcrypt hash', async () => {
      const hash = await bcrypt.hash('secret', 10);
      usersRepository.findOne.mockResolvedValue({
        id: 7,
        username: 'alice',
        password: hash,
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
      // Already hashed — no upgrade write.
      expect(usersRepository.update).not.toHaveBeenCalled();
    });

    it('rehashes a legacy plaintext password on successful login', async () => {
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
      // The plaintext password is replaced with a bcrypt hash.
      expect(usersRepository.update).toHaveBeenCalledWith(
        7,
        expect.objectContaining({
          password: expect.stringMatching(/^\$2[aby]\$/),
        }),
      );
    });
  });
});
