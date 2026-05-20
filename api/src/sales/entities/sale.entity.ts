import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ name: 'customer_type' })
  customerType!: string;

  @Column({ type: 'double precision' })
  subtotal!: number;

  @Column({ type: 'double precision' })
  total!: number;

  @Column()
  status!: string;

  @Column({ name: 'last_touch_at', type: 'timestamptz', nullable: true })
  lastTouchAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
