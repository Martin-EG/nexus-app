import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryService } from '../inventory/inventory.service';
import { Purchase } from './entities/purchase.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { Supplier } from './entities/supplier.entity';

export interface PurchaseItemInput {
  product_id: number;
  qty: number;
  unit_cost: number;
  warehouse_id?: number;
}

export interface PurchaseRow {
  id: number;
  supplier_id: number;
  supplier_name: string | null;
  total: number;
  received_date: string;
  status: string;
  bank_ref: string | null;
}

/** Port of logic/purchases.py. */
@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private readonly purchases: Repository<Purchase>,
    @InjectRepository(PurchaseItem)
    private readonly purchaseItems: Repository<PurchaseItem>,
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
    private readonly inventoryService: InventoryService,
  ) {}

  async createPurchase(
    supplierId: number,
    items: PurchaseItemInput[],
    receivedDate: string,
  ): Promise<{ purchase_id: number }> {
    if (!this.validateIsoDate(receivedDate)) {
      throw new BadRequestException('date must be YYYY-MM-DD');
    }

    const purchase = await this.purchases.save(
      this.purchases.create({
        supplierId,
        total: this.calcPurchaseTotal(items),
        receivedDate,
        status: 'received',
      }),
    );

    for (const item of items) {
      await this.purchaseItems.save(
        this.purchaseItems.create({
          purchaseId: purchase.id,
          productId: item.product_id,
          qty: item.qty,
          unitCost: item.unit_cost,
        }),
      );
      await this.inventoryService.incrementStock(
        item.product_id,
        item.warehouse_id ?? 1,
        item.qty,
      );
    }

    return { purchase_id: purchase.id };
  }

  async reconcilePurchase(
    purchaseId: number,
    bankRef: string,
  ): Promise<{ purchase_id: number; bank_ref: string }> {
    await this.purchases.update(purchaseId, {
      bankRef,
      status: 'reconciled',
    });
    return { purchase_id: purchaseId, bank_ref: bankRef };
  }

  listSuppliers(): Promise<Supplier[]> {
    return this.suppliers.find({ order: { name: 'ASC' } });
  }

  listPurchases(limit = 50): Promise<PurchaseRow[]> {
    return this.purchases
      .createQueryBuilder('p')
      .leftJoin(Supplier, 's', 's.id = p.supplier_id')
      .select('p.id', 'id')
      .addSelect('p.supplier_id', 'supplier_id')
      .addSelect('s.name', 'supplier_name')
      .addSelect('p.total', 'total')
      .addSelect('p.received_date', 'received_date')
      .addSelect('p.status', 'status')
      .addSelect('p.bank_ref', 'bank_ref')
      .orderBy('p.id', 'DESC')
      .limit(limit)
      .getRawMany<PurchaseRow>();
  }

  private validateIsoDate(s: string): boolean {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      return false;
    }
    const parsed = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime());
  }

  private calcPurchaseTotal(items: PurchaseItemInput[]): number {
    return items.reduce((sum, item) => sum + item.qty * item.unit_cost, 0);
  }
}
