import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'sale_id' })
  saleId!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column()
  reason!: string;

  @Column({ type: 'double precision' })
  amount!: number;

  @Column()
  status!: string;

  @Column({ name: 'approved_by', type: 'int', nullable: true })
  approvedBy!: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
