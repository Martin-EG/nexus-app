import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('inventory_stock')
export class InventoryStock {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'product_id' })
  productId!: number;

  @Column({ name: 'warehouse_id' })
  warehouseId!: number;

  @Column({ default: 0 })
  quantity!: number;

  @Column({ name: 'last_audit_at', type: 'timestamptz', nullable: true })
  lastAuditAt!: Date | null;
}
