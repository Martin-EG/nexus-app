import {
  Controller,
  Get,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Controller('health')
export class HealthController {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  @Get()
  async health(): Promise<{ status: string; db: string }> {
    try {
      const count = await this.users.count();
      return { status: 'ok', db: count > 0 ? 'ready' : 'empty' };
    } catch (err) {
      throw new InternalServerErrorException({
        status: 'error',
        msg: (err as Error).message,
      });
    }
  }
}
