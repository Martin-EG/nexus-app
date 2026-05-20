import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'sale_id' })
  saleId!: number;

  @Column({ name: 'product_id' })
  productId!: number;

  @Column()
  qty!: number;

  @Column({ name: 'unit_price', type: 'double precision' })
  unitPrice!: number;
}
