import { Controller, Get } from '@nestjs/common';
import { PurchasesService } from './purchases.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  list() {
    return this.purchasesService.listSuppliers();
  }
}
