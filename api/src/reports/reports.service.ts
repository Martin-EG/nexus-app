import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../catalog/entities/product.entity';
import { InventoryStock } from '../inventory/entities/inventory-stock.entity';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { User } from '../users/entities/user.entity';

export interface MonthlyReportRow {
  id: number;
  user_id: number;
  customer_type: string;
  subtotal: number;
  total: number;
  created_at: Date;
  product_name: string;
  product_price: number;
  qty: number;
  unit_price: number;
  username: string;
  effective_subtotal: number;
  line_after_discount: number;
}

/** Port of logic/reports.py. */
@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private readonly sales: Repository<Sale>,
    @InjectRepository(InventoryStock)
    private readonly stock: Repository<InventoryStock>,
  ) {}

  /**
   * `created_at` is a free-form text column (dd/mm/yyyy, ISO, or epoch
   * seconds), so the year/month filter is applied in JS via `parseAnyDate`
   * rather than SQL `EXTRACT`, which only works on real date columns.
   */
  async monthlyReport(
    year: number,
    month: number,
  ): Promise<MonthlyReportRow[]> {
    const rows = await this.sales
      .createQueryBuilder('s')
      .innerJoin(SaleItem, 'si', 'si.sale_id = s.id')
      .innerJoin(Product, 'p', 'p.id = si.product_id')
      .innerJoin(User, 'u', 'u.id = s.user_id')
      .select('s.id', 'id')
      .addSelect('s.userId', 'user_id')
      .addSelect('s.customerType', 'customer_type')
      .addSelect('s.subtotal', 'subtotal')
      .addSelect('s.total', 'total')
      .addSelect('s.createdAt', 'created_at')
      .addSelect('p.name', 'product_name')
      .addSelect('p.price', 'product_price')
      .addSelect('si.qty', 'qty')
      .addSelect('si.unitPrice', 'unit_price')
      .addSelect('u.username', 'username')
      .addSelect(
        "CASE WHEN s.customer_type = 'LEGACY_A' THEN s.subtotal * 0.85 ELSE s.subtotal END",
        'effective_subtotal',
      )
      .addSelect(
        'CASE WHEN si.qty > 50 THEN si.unit_price * si.qty * 0.90 ' +
          'WHEN si.qty > 10 THEN si.unit_price * si.qty * 0.95 ' +
          'ELSE si.unit_price * si.qty END',
        'line_after_discount',
      )
      .where('s.status IN (:...statuses)', {
        statuses: ['completed', 'COMPLETED', 'done'],
      })
      .getRawMany<MonthlyReportRow>();

    return rows.filter((row) => {
      const parsed = this.parseAnyDate(
        row.created_at as unknown as string | number | null,
      );
      return (
        parsed !== null &&
        parsed.getUTCFullYear() === year &&
        parsed.getUTCMonth() + 1 === month
      );
    });
  }

  async totalSales(year: number, month: number): Promise<number> {
    const rows = await this.monthlyReport(year, month);
    return rows.reduce((sum, r) => sum + (Number(r.line_after_discount) || 0), 0);
  }

  /**
   * reports.py concatenated `filter_clause` straight into `WHERE id > ...`
   * (SQL injection). The filter is now coerced to an integer lower bound.
   */
  async exportReport(
    reportType: string,
    minId: number,
  ): Promise<Record<string, unknown>[]> {
    if (reportType === 'sales') {
      return this.sales
        .createQueryBuilder('s')
        .select('s.id', 'id')
        .addSelect('s.userId', 'user_id')
        .addSelect('s.total', 'total')
        .addSelect('s.status', 'status')
        .where('s.id > :minId', { minId })
        .getRawMany();
    }
    if (reportType === 'inventory') {
      return this.stock
        .createQueryBuilder('s')
        .select('s.productId', 'product_id')
        .addSelect('s.warehouseId', 'warehouse_id')
        .addSelect('s.quantity', 'quantity')
        .addSelect('0', 'pad')
        .where('s.productId > :minId', { minId })
        .getRawMany();
    }
    throw new BadRequestException('unknown report_type');
  }

  /** Non-route helper (reports.py): all sales for a user, any status. */
  getSalesByUser(userId: number): Promise<Sale[]> {
    return this.sales.find({ where: { userId } });
  }

  /** Non-route helper (reports.py). */
  productSalesHistory(productId: number): Promise<Record<string, unknown>[]> {
    return this.sales
      .createQueryBuilder('s')
      .innerJoin(SaleItem, 'si', 'si.sale_id = s.id')
      .innerJoin(Product, 'p', 'p.id = si.product_id')
      .select('s.id', 'id')
      .addSelect('s.createdAt', 'created_at')
      .addSelect('s.total', 'total')
      .addSelect('p.name', 'name')
      .where('p.id = :productId', { productId })
      .getRawMany();
  }

  /** Non-route helper (reports.py): best-effort multi-format date parsing. */
  parseAnyDate(s: string | number | null | undefined): Date | null {
    if (s === null || s === undefined) return null;
    if (typeof s === 'number' || /^\d+$/.test(String(s))) {
      return new Date(Number(s) * 1000);
    }
    const text = String(s);
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    if (iso) {
      return new Date(`${text}T00:00:00Z`);
    }
    const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
    if (dmy) {
      return new Date(`${dmy[3]}-${dmy[2]}-${dmy[1]}T00:00:00Z`);
    }
    return null;
  }
}
