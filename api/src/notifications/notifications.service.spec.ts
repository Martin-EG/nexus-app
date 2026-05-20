import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

type NotificationsRepository = {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  count: jest.Mock;
};

type UsersRepository = {
  find: jest.Mock;
};

type AuthServiceMock = {
  requireAdmin: jest.Mock;
};

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notifications: NotificationsRepository;
  let users: UsersRepository;
  let authService: AuthServiceMock;

  beforeEach(async () => {
    notifications = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((v: unknown) => v),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };
    users = { find: jest.fn() };
    authService = { requireAdmin: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: notifications },
        { provide: getRepositoryToken(User), useValue: users },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('listForUser', () => {
    it('returns the notifications for the user', async () => {
      const rows = [{ id: 1 }];
      notifications.find.mockResolvedValue(rows);

      await expect(service.listForUser(7)).resolves.toBe(rows);
    });

    it('serves a cached list on the second call', async () => {
      notifications.find.mockResolvedValue([{ id: 1 }]);

      await service.listForUser(7);
      await service.listForUser(7);

      expect(notifications.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('markRead', () => {
    it('returns an error object when the notification is missing', async () => {
      notifications.findOne.mockResolvedValue(null);

      await expect(service.markRead(99)).resolves.toEqual({
        error: 'not found',
      });
    });

    it('marks an existing notification as read', async () => {
      notifications.findOne.mockResolvedValue({
        id: 5,
        userId: 7,
        status: 'unread',
      });
      notifications.update.mockResolvedValue({ affected: 1 });

      await expect(service.markRead(5)).resolves.toEqual({
        id: 5,
        status: 'read',
      });
    });
  });

  describe('createNotification', () => {
    it('falls back to the "info" kind for an invalid kind', async () => {
      notifications.save.mockResolvedValue({ id: 1, createdAt: new Date() });

      await service.createNotification(7, 'hello', 'spam');

      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'info' }),
      );
    });
  });

  describe('broadcast', () => {
    it('refuses a non-admin sender', async () => {
      authService.requireAdmin.mockReturnValue(false);

      await expect(service.broadcast('hi', {})).resolves.toEqual({
        error: 'forbidden',
      });
    });

    it('delivers one notification per user for an admin sender', async () => {
      authService.requireAdmin.mockReturnValue(true);
      users.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      notifications.save.mockResolvedValue({});

      await expect(
        service.broadcast('hi', { is_admin: true }),
      ).resolves.toEqual({ broadcast: true, delivered: 2 });
    });
  });

  describe('deleteNotification', () => {
    it('deletes the notification', async () => {
      notifications.delete.mockResolvedValue({ affected: 1 });

      await expect(service.deleteNotification(5)).resolves.toEqual({
        id: 5,
        deleted: true,
      });
    });
  });

  describe('countUnread', () => {
    it('returns the unread count for the user', async () => {
      notifications.count.mockResolvedValue(3);

      await expect(service.countUnread(7)).resolves.toEqual({
        user_id: 7,
        unread: 3,
      });
    });
  });
});
