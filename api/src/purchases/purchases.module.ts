import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryModule } from '../inventory/inventory.module';
import { Purchase } from './entities/purchase.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { Supplier } from './entities/supplier.entity';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { SuppliersController } from './suppliers.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Purchase, PurchaseItem, Supplier]),
    InventoryModule,
  ],
  controllers: [PurchasesController, SuppliersController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
