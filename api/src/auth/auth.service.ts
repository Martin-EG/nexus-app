import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.usersRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (!(await this.verifyPassword(user, password))) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return {
      user_id: user.id,
      username: user.username,
      is_admin: !!user.isAdmin,
    };
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  requireAdmin(user: any): boolean {
    return user?.is_admin ?? false;
  }

  private async verifyPassword(
    user: User,
    password: string,
  ): Promise<boolean> {
    if (this.isBcryptHash(user.password)) {
      return bcrypt.compare(password, user.password);
    }

    // Legacy plaintext password.
    if (user.password !== password) {
      return false;
    }
    await this.usersRepository.update(user.id, {
      password: await bcrypt.hash(password, BCRYPT_ROUNDS),
    });
    return true;
  }

  private isBcryptHash(value: string): boolean {
    return /^\$2[aby]\$\d{2}\$/.test(value);
  }
}
