import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity'
import { LoginDto } from './dto/login.dto';

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


    if (user.password !== password) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return {
      user_id: user.id,
      username: user.username,
      is_admin: !!user.isAdmin,
    };
  }

  requireAdmin(user: any): boolean {
    return user?.is_admin ?? false;
  }
}
