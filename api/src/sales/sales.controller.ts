import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { SalesService, SaleItemInput } from './sales.service';

interface CreateSaleDto {
  user_id: number;
  customer_type: string;
  items: SaleItemInput[];
}

interface ReturnSaleDto {
  items: SaleItemInput[];
}

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @HttpCode(201)
  create(@Body() body: CreateSaleDto) {
    return this.salesService.createSale(
      body.user_id,
      body.customer_type,
      body.items,
    );
  }

  @Post(':id/return')
  return(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ReturnSaleDto,
  ) {
    return this.salesService.returnSale(id, body.items);
  }

  @Get('by-user/:uid')
  byUser(@Param('uid', ParseIntPipe) uid: number) {
    return this.salesService.getSalesByUser(uid);
  }
}
