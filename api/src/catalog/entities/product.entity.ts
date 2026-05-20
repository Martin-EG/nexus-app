import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  sku!: string;

  @Column()
  name!: string;

  @Column({ type: 'double precision' })
  price!: number;

  @Column()
  category!: string;

  @Column({ name: 'supplier_id', type: 'int', nullable: true })
  supplierId!: number | null;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
