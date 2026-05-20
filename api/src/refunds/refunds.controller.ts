import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RefundsService } from './refunds.service';

interface CreateRefundDto {
  sale_id: number;
  reason: string;
  [key: string]: unknown;
}

@Controller('refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post()
  create(@Body() body: CreateRefundDto) {
    return this.refundsService.createRefund(body.sale_id, body.reason, body);
  }

  @Post(':rid/approve')
  approve(
    @Param('rid', ParseIntPipe) rid: number,
    @Body() body: Record<string, unknown>,
  ) {
    return this.refundsService.approveRefund(rid, body ?? {});
  }

  @Get('search')
  search(@Query('q') q = '') {
    return this.refundsService.searchRefunds(q);
  }

  @Get('by-user/:uid')
  byUser(@Param('uid', ParseIntPipe) uid: number) {
    return this.refundsService.listRefundsByUser(uid);
  }
}
