import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  /** Route: GET /api/users — was `SELECT id, username, is_admin FROM users`. */
  listUsers(): Promise<Record<string, unknown>[]> {
    return this.users
      .createQueryBuilder('u')
      .select('u.id', 'id')
      .addSelect('u.username', 'username')
      .addSelect('u.isAdmin', 'is_admin')
      .getRawMany();
  }
}
