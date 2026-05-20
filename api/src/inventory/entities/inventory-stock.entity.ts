import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('inventory_stock')
export class InventoryStock {
  // The table has no surrogate key — a stock row is identified by the
  // (product_id, warehouse_id) pair.
  @PrimaryColumn({ name: 'product_id' })
  productId!: number;

  @PrimaryColumn({ name: 'warehouse_id' })
  warehouseId!: number;

  @Column({ default: 0 })
  quantity!: number;
}
