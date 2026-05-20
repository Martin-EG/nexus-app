import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  describe('sendEmail', () => {
    it('logs the message without throwing', () => {
      const logSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => undefined);

      expect(() =>
        service.sendEmail(1, 'Venta confirmada', 'Total: 100'),
      ).not.toThrow();
      expect(logSpy).toHaveBeenCalledTimes(1);

      logSpy.mockRestore();
    });
  });
});
