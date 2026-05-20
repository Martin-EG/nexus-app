import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  overview() {
    return this.inventoryService.inventoryOverview();
  }

  @Get('warehouse/:wh')
  byWarehouse(@Param('wh', ParseIntPipe) wh: number) {
    return this.inventoryService.filterByWarehouse(wh);
  }
}
