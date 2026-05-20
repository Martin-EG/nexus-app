import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { PurchaseItemInput, PurchasesService } from './purchases.service';

interface CreatePurchaseDto {
  supplier_id: number;
  items: PurchaseItemInput[];
  received_date: string;
}

interface ReconcileDto {
  bank_ref: string;
}

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  create(@Body() body: CreatePurchaseDto) {
    return this.purchasesService.createPurchase(
      body.supplier_id,
      body.items,
      body.received_date,
    );
  }

  @Post(':id/reconcile')
  reconcile(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ReconcileDto,
  ) {
    return this.purchasesService.reconcilePurchase(id, body.bank_ref);
  }

  @Get()
  list() {
    return this.purchasesService.listPurchases();
  }
}
