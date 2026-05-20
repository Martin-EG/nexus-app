import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('purchase_items')
export class PurchaseItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'purchase_id' })
  purchaseId!: number;

  @Column({ name: 'product_id' })
  productId!: number;

  @Column()
  qty!: number;

  @Column({ name: 'unit_cost', type: 'double precision' })
  unitCost!: number;
}
