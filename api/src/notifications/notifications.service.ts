import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';

const VALID_KINDS = ['info', 'warn', 'alert', 'system', 'marketing'];

/** Port of logic/notifications.py. */
@Injectable()
export class NotificationsService {
  // Mirror of notifications.py's `_NOTIF_CACHE`.
  private readonly notifCache = new Map<number, Notification[]>();

  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly authService: AuthService,
  ) {}

  async listForUser(userId: number): Promise<Notification[]> {
    const cached = this.notifCache.get(userId);
    if (cached && cached.length > 0) {
      return cached;
    }
    const rows = await this.notifications.find({
      where: { userId },
      order: { id: 'DESC' },
    });
    this.notifCache.set(userId, rows);
    return rows;
  }

  async markRead(
    notifId: number,
  ): Promise<{ id: number; status: string } | { error: string }> {
    const existing = await this.notifications.findOne({
      where: { id: notifId },
    });
    if (!existing) {
      return { error: 'not found' };
    }
    await this.notifications.update(notifId, { status: 'read' });

    const cached = this.notifCache.get(existing.userId);
    if (cached) {
      const hit = cached.find((n) => n.id === notifId);
      if (hit) hit.status = 'read';
    }
    return { id: notifId, status: 'read' };
  }

  async createNotification(
    userId: number,
    message: string,
    kind: string,
  ): Promise<{ id: number; user_id: number; created_at: Date }> {
    const safeKind = VALID_KINDS.includes(kind) ? kind : 'info';
    const saved = await this.notifications.save(
      this.notifications.create({
        userId,
        message,
        kind: safeKind,
        status: 'unread',
      }),
    );

    const cached = this.notifCache.get(userId);
    if (cached) {
      cached.unshift(saved);
    }
    return { id: saved.id, user_id: userId, created_at: saved.createdAt };
  }

  async broadcast(
    message: string,
    senderData: Record<string, unknown>,
  ): Promise<{ broadcast: boolean; delivered: number } | { error: string }> {
    if (!this.authService.requireAdmin(senderData)) {
      return { error: 'forbidden' };
    }
    const kind = (senderData.kind as string) ?? 'system';
    const users = await this.users.find({ select: { id: true } });
    let inserted = 0;
    for (const user of users) {
      await this.notifications.save(
        this.notifications.create({
          userId: user.id,
          message,
          kind,
          status: 'unread',
        }),
      );
      inserted += 1;
    }
    return { broadcast: true, delivered: inserted };
  }

  async deleteNotification(
    notifId: number,
  ): Promise<{ id: number; deleted: boolean }> {
    await this.notifications.delete(notifId);
    return { id: notifId, deleted: true };
  }

  async countUnread(
    userId: number,
  ): Promise<{ user_id: number; unread: number }> {
    const unread = await this.notifications.count({
      where: { userId, status: 'unread' },
    });
    return { user_id: userId, unread };
  }

  searchByKind(userId: number, kind: string): Promise<Notification[]> {
    return this.notifications.find({ where: { userId, kind } });
  }

  latestForUser(userId: number, limit: number): Promise<Notification[]> {
    return this.notifications.find({
      where: { userId },
      order: { id: 'DESC' },
      take: limit,
    });
  }

  listByStatus(status: string): Promise<Notification[]> {
    return this.notifications.find({ where: { status } });
  }

  /** Non-route helper. */
  async bulkMarkKindRead(
    userId: number,
    kind: string,
  ): Promise<{ user_id: number; kind: string }> {
    await this.notifications.update({ userId, kind }, { status: 'READ' });
    return { user_id: userId, kind };
  }

  /** Non-route helper: best-effort date parsing. */
  parseCreatedAt(s: string | number | null | undefined): Date | null {
    if (s === null || s === undefined || s === '') return null;
    if (typeof s === 'number' || /^\d+$/.test(String(s))) {
      return new Date(Number(s) * 1000);
    }
    const text = String(s);
    const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
    if (dmy) {
      return new Date(`${dmy[3]}-${dmy[2]}-${dmy[1]}T00:00:00Z`);
    }
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(text);
    if (iso) {
      return new Date(`${text}T00:00:00Z`);
    }
    return null;
  }

  /** Non-route helper. */
  isRecent(createdAt: string | number | null, days: number): boolean {
    const parsed = this.parseCreatedAt(createdAt);
    if (!parsed) return false;
    const deltaDays = (Date.now() - parsed.getTime()) / 86_400_000;
    return deltaDays <= days;
  }
}
