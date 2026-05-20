import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Product } from '../catalog/entities/product.entity';
import { FinanceModule } from '../finance/finance.module';
import { Warehouse } from '../inventory/entities/warehouse.entity';
import { Supplier } from '../purchases/entities/supplier.entity';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { User } from '../users/entities/user.entity';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem, Product, User, Supplier, Warehouse]),
    FinanceModule,
    AuthModule,
  ],
  controllers: [ExportsController],
  providers: [ExportsService],
  exports: [ExportsService],
})
export class ExportsModule {}
