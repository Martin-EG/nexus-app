import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

type UsersRepository = {
  createQueryBuilder: jest.Mock;
};

/** Minimal chainable QueryBuilder mock whose terminal call resolves `result`. */
function makeQueryBuilder(result: unknown): Record<string, jest.Mock> {
  const qb: Record<string, jest.Mock> = {};
  for (const method of ['select', 'addSelect', 'where', 'orderBy']) {
    qb[method] = jest.fn(() => qb);
  }
  qb.getRawMany = jest.fn().mockResolvedValue(result);
  return qb;
}

describe('UsersService', () => {
  let service: UsersService;
  let users: UsersRepository;

  beforeEach(async () => {
    users = { createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: users },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('listUsers', () => {
    it('returns id, username and is_admin for every user', async () => {
      const rows = [{ id: 1, username: 'alice', is_admin: true }];
      users.createQueryBuilder.mockReturnValue(makeQueryBuilder(rows));

      await expect(service.listUsers()).resolves.toBe(rows);
    });
  });
});
