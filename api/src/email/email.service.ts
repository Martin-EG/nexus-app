import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  sendEmail(userId: number, subject: string, body: string): void {
    this.logger.log(`email -> user ${userId} | ${subject} | ${body}`);
  }
}
