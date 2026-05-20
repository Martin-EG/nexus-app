import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { NotificationsService } from './notifications.service';

interface CreateNotificationDto {
  user_id: number;
  message: string;
  kind?: string;
}

interface BroadcastDto {
  message: string;
  kind?: string;
  [key: string]: unknown;
}

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly authService: AuthService,
  ) {}

  @Get(':uid')
  list(@Param('uid', ParseIntPipe) uid: number) {
    return this.notificationsService.listForUser(uid);
  }

  @Post('broadcast')
  broadcast(@Body() body: BroadcastDto) {
    // app.py returned 403 at the route level before delegating.
    if (!this.authService.requireAdmin(body)) {
      throw new ForbiddenException('forbidden');
    }
    return this.notificationsService.broadcast(body.message, body);
  }

  @Post(':nid/read')
  markRead(@Param('nid', ParseIntPipe) nid: number) {
    return this.notificationsService.markRead(nid);
  }

  @Post()
  create(@Body() body: CreateNotificationDto) {
    return this.notificationsService.createNotification(
      body.user_id,
      body.message,
      body.kind ?? 'info',
    );
  }

  @Delete(':nid')
  remove(@Param('nid', ParseIntPipe) nid: number) {
    return this.notificationsService.deleteNotification(nid);
  }
}
