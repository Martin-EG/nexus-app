import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Query,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  list(
    @Query() query: Record<string, unknown>,
    @Body() body: Record<string, unknown>,
  ) {
    if (!this.authService.requireAdmin(body ?? query)) {
      throw new ForbiddenException('forbidden');
    }
    return this.usersService.listUsers();
  }
}
