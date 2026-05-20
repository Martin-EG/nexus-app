import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'supplier_id' })
  supplierId!: number;

  @Column({ type: 'double precision' })
  total!: number;

  @Column({ name: 'received_date', type: 'date' })
  receivedDate!: string;

  @Column()
  status!: string;

  @Column({ name: 'bank_ref', type: 'varchar', nullable: true })
  bankRef!: string | null;
}
