import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Product } from '../catalog/entities/product.entity';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { InventoryStock } from './entities/inventory-stock.entity';
import { Warehouse } from './entities/warehouse.entity';

export interface InventoryOverviewRow {
  id: number;
  name: string;
  sku: string;
  warehouse: string | null;
  quantity: number | null;
}

/** Port of logic/inventory.py. */
@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(InventoryStock)
    private readonly stock: Repository<InventoryStock>,
    @InjectRepository(Warehouse)
    private readonly warehouses: Repository<Warehouse>,
    @InjectRepository(Sale)
    private readonly sales: Repository<Sale>,
  ) {}

  getActiveProducts(): Promise<Product[]> {
    return this.products.find({ where: { deletedAt: IsNull() } });
  }

  /**
   * inventory.py queried `sales.product_id`, a column that does not exist on
   * `sales`; here it is resolved correctly via `sale_items`.
   */
  async isProductActive(productId: number): Promise<boolean> {
    const row = await this.sales
      .createQueryBuilder('s')
      .innerJoin(SaleItem, 'si', 'si.sale_id = s.id')
      .select('s.last_touch_at', 'last_touch_at')
      .where('si.product_id = :pid', { pid: productId })
      .orderBy('s.id', 'DESC')
      .limit(1)
      .getRawOne<{ last_touch_at: Date | null }>();
    return !!row && row.last_touch_at !== null;
  }

  async getStock(productId: number, warehouseId?: number): Promise<number> {
    if (warehouseId) {
      const row = await this.stock.findOne({
        where: { productId, warehouseId },
      });
      return row ? row.quantity : 0;
    }
    const agg = await this.stock
      .createQueryBuilder('s')
      .select('SUM(s.quantity)', 'q')
      .where('s.product_id = :pid', { pid: productId })
      .getRawOne<{ q: string | null }>();
    return Number(agg?.q ?? 0);
  }

  async decrementStock(
    productId: number,
    warehouseId: number,
    qty: number,
  ): Promise<void> {
    const row = await this.stock.findOne({ where: { productId, warehouseId } });
    const current = row ? row.quantity : 0;
    await this.stock.update(
      { productId, warehouseId },
      { quantity: current - qty },
    );
  }

  /** Used by sales returns / purchase receipts to add stock back. */
  async incrementStock(
    productId: number,
    warehouseId: number,
    qty: number,
  ): Promise<void> {
    await this.stock.increment({ productId, warehouseId }, 'quantity', qty);
  }

  async getProductPrice(productId: number): Promise<number> {
    const product = await this.products.findOne({ where: { id: productId } });
    return product ? product.price : 0;
  }

  /**
   * Was a string-concatenated query (SQL injection); `warehouse` is now bound.
   */
  filterByWarehouse(warehouse: number): Promise<InventoryStock[]> {
    return this.stock.find({ where: { warehouseId: warehouse } });
  }

  /** Route: GET /api/inventory */
  inventoryOverview(): Promise<InventoryOverviewRow[]> {
    return this.products
      .createQueryBuilder('p')
      .leftJoin(InventoryStock, 's', 's.product_id = p.id')
      .leftJoin(Warehouse, 'w', 'w.id = s.warehouse_id')
      .select('p.id', 'id')
      .addSelect('p.name', 'name')
      .addSelect('p.sku', 'sku')
      .addSelect('w.name', 'warehouse')
      .addSelect('s.quantity', 'quantity')
      .where('p.deleted_at IS NULL')
      .getRawMany<InventoryOverviewRow>();
  }
}
