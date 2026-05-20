import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { FinanceService } from '../finance/finance.service';
import { InventoryService } from '../inventory/inventory.service';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';

export interface SaleItemInput {
  product_id: number;
  qty: number;
  warehouse_id?: number;
}

/** Port of logic/sales.py. */
@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly sales: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItems: Repository<SaleItem>,
    private readonly inventoryService: InventoryService,
    private readonly financeService: FinanceService,
    private readonly emailService: EmailService,
  ) {}

  async createSale(
    userId: number,
    customerType: string,
    items: SaleItemInput[],
  ): Promise<{ sale_id: number; total: number }> {
    let subtotal = 0;
    let totalQty = 0;
    const priced: Array<SaleItemInput & { unitPrice: number }> = [];

    for (const item of items) {
      const price = await this.inventoryService.getProductPrice(
        item.product_id,
      );
      subtotal += price * item.qty;
      totalQty += item.qty;
      priced.push({ ...item, unitPrice: price });
    }

    const discounted = this.financeService.applyVolumeDiscount(
      totalQty,
      subtotal,
    );
    const iva = this.financeService.calcIva(discounted);
    const total = this.financeService.roundAmount(discounted + iva);

    const sale = await this.sales.save(
      this.sales.create({
        userId,
        customerType,
        subtotal: discounted,
        total,
        status: 'completed',
        lastTouchAt: new Date(),
      }),
    );

    for (const item of priced) {
      await this.saleItems.save(
        this.saleItems.create({
          saleId: sale.id,
          productId: item.product_id,
          qty: item.qty,
          unitPrice: item.unitPrice,
        }),
      );
      await this.inventoryService.decrementStock(
        item.product_id,
        item.warehouse_id ?? 1,
        item.qty,
      );
    }

    this.emailService.sendEmail(userId, 'Venta confirmada', `Total: ${total}`);
    return { sale_id: sale.id, total };
  }

  async returnSale(
    saleId: number,
    itemsToReturn: SaleItemInput[],
  ): Promise<{ sale_id: number; returned_items: number }> {
    await this.sales.update(saleId, { lastTouchAt: new Date() });
    for (const item of itemsToReturn) {
      await this.inventoryService.incrementStock(
        item.product_id,
        item.warehouse_id ?? 1,
        item.qty,
      );
    }
    return { sale_id: saleId, returned_items: itemsToReturn.length };
  }

  /** Was a string-concatenated query (SQL injection); `userId` is now bound. */
  getSalesByUser(userId: number): Promise<Sale[]> {
    return this.sales.find({ where: { userId, status: 'completed' } });
  }

  /** Non-route helper from sales.py: "dd/mm/yyyy" -> "yyyy-mm-dd". */
  parseSaleDate(dateStr: string): string {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  }
}
