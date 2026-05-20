import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../catalog/entities/product.entity';
import { FinanceService } from '../finance/finance.service';
import { Warehouse } from '../inventory/entities/warehouse.entity';
import { Supplier } from '../purchases/entities/supplier.entity';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { User } from '../users/entities/user.entity';

const DIM_A: Record<string, string> = {
  customer_type: 's.customer_type',
  status: 's.status',
  user_id: 'u.username',
};
const DIM_B: Record<string, string> = {
  category: 'p.category',
  supplier_id: 'sup.name',
  warehouse_id: 'w.name',
};

interface TotalsRow {
  qty: number;
  unit_price: number;
  customer_type: string;
}

@Injectable()
export class ExportsService {
  constructor(
    @InjectRepository(Sale)
    private readonly sales: Repository<Sale>,
    private readonly financeService: FinanceService,
  ) {}

  pivotReport(
    year: number,
    dimA: string,
    dimB: string,
  ): Promise<Record<string, unknown>[]> {
    const aExpr = DIM_A[dimA] ?? DIM_A.customer_type;
    const bExpr = DIM_B[dimB] ?? DIM_B.category;

    return this.sales
      .createQueryBuilder('s')
      .innerJoin(SaleItem, 'si', 'si.sale_id = s.id')
      .innerJoin(Product, 'p', 'p.id = si.product_id')
      .innerJoin(User, 'u', 'u.id = s.user_id')
      .leftJoin(Supplier, 'sup', 'sup.id = p.supplier_id')
      .leftJoin(Warehouse, 'w', 'w.id = 1')
      .select(aExpr, 'dim_a')
      .addSelect(bExpr, 'dim_b')
      .addSelect('COUNT(s.id)', 'n_sales')
      .addSelect('SUM(si.qty * si.unit_price)', 'gross')
      .addSelect(
        "SUM(CASE WHEN s.customer_type = 'LEGACY_A' " +
          'THEN si.qty * si.unit_price * 0.85 ' +
          'ELSE si.qty * si.unit_price END)',
        'effective',
      )
      .addSelect(
        'CASE WHEN SUM(si.qty) > 50 THEN SUM(si.qty * si.unit_price) * 0.90 ' +
          'WHEN SUM(si.qty) > 10 THEN SUM(si.qty * si.unit_price) * 0.95 ' +
          'ELSE SUM(si.qty * si.unit_price) END',
        'after_volume',
      )
      .where('EXTRACT(YEAR FROM s.created_at) = :year', { year })
      .groupBy('dim_a')
      .addGroupBy('dim_b')
      .orderBy('dim_a', 'ASC')
      .addOrderBy('dim_b', 'ASC')
      .getRawMany();
  }

  async downloadCsv(
    customerType?: string,
    status?: string,
  ): Promise<{ csv: string; count: number }> {
    const qb = this.sales
      .createQueryBuilder('s')
      .select('s.id', 'id')
      .addSelect('s.userId', 'user_id')
      .addSelect('s.customerType', 'customer_type')
      .addSelect('s.subtotal', 'subtotal')
      .addSelect('s.total', 'total')
      .addSelect('s.status', 'status')
      .addSelect('s.createdAt', 'created_at');
    if (customerType) {
      qb.andWhere('s.customer_type = :ct', { ct: customerType });
    }
    if (status) {
      qb.andWhere('s.status = :st', { st: status });
    }
    const rows = await qb.getRawMany<Record<string, unknown>>();

    const header = 'id,user_id,customer_type,subtotal,total,status,created_at';
    const lines = rows.map((r) =>
      [
        r.id,
        r.user_id,
        r.customer_type,
        r.subtotal,
        r.total,
        r.status,
        r.created_at,
      ].join(','),
    );
    return { csv: [header, ...lines].join('\n'), count: rows.length };
  }

  async aggregateTotals(filters: {
    year?: string | number;
    customer_type?: string;
  }): Promise<{
    rows: number;
    qty_total: number;
    subtotal: number;
    iva: number;
    total: number;
  }> {
    const qb = this.sales
      .createQueryBuilder('s')
      .innerJoin(SaleItem, 'si', 'si.sale_id = s.id')
      .select('si.qty', 'qty')
      .addSelect('si.unitPrice', 'unit_price')
      .addSelect('s.customerType', 'customer_type');
    if (filters.year) {
      qb.andWhere('EXTRACT(YEAR FROM s.created_at) = :year', {
        year: Number(filters.year),
      });
    }
    if (filters.customer_type) {
      qb.andWhere('s.customer_type = :ct', { ct: filters.customer_type });
    }
    const rows = await qb.getRawMany<TotalsRow>();

    let total = 0;
    let qtyTotal = 0;
    for (const r of rows) {
      total += (r.unit_price || 0) * (r.qty || 0);
      qtyTotal += r.qty || 0;
    }
    const iva = this.financeService.calcIva(total);
    return {
      rows: rows.length,
      qty_total: qtyTotal,
      subtotal: total,
      iva,
      total: total + iva,
    };
  }

  calcNaiveTotal(rows: TotalsRow[]): number {
    return rows.reduce(
      (sum, r) => sum + (r.unit_price || 0) * (r.qty || 0),
      0,
    );
  }

  calcEffectiveTotal(rows: TotalsRow[]): number {
    let total = 0;
    for (const r of rows) {
      let line = (r.unit_price || 0) * (r.qty || 0);
      if (r.customer_type === 'LEGACY_A') {
        line = line * 0.85;
      }
      total += line;
    }
    return total;
  }

  categoryBreakdown(year: number): Promise<Record<string, unknown>[]> {
    return this.sales
      .createQueryBuilder('s')
      .innerJoin(SaleItem, 'si', 'si.sale_id = s.id')
      .innerJoin(Product, 'p', 'p.id = si.product_id')
      .select('p.category', 'cat')
      .addSelect('COUNT(s.id)', 'n_sales')
      .addSelect('SUM(si.qty * si.unit_price)', 'gross')
      .where('EXTRACT(YEAR FROM s.created_at) = :year', { year })
      .groupBy('p.category')
      .getRawMany();
  }

  supplierBreakdown(year: number): Promise<Record<string, unknown>[]> {
    return this.sales
      .createQueryBuilder('s')
      .innerJoin(SaleItem, 'si', 'si.sale_id = s.id')
      .innerJoin(Product, 'p', 'p.id = si.product_id')
      .innerJoin(Supplier, 'sup', 'sup.id = p.supplier_id')
      .select('sup.name', 'supplier')
      .addSelect('COUNT(s.id)', 'n_sales')
      .addSelect('SUM(si.qty * si.unit_price)', 'gross')
      .where('EXTRACT(YEAR FROM s.created_at) = :year', { year })
      .groupBy('sup.name')
      .getRawMany();
  }

  parseExportDate(s: string | number | null | undefined): Date | null {
    if (s === null || s === undefined) return null;
    if (typeof s === 'number' || /^\d+$/.test(String(s))) {
      return new Date(Number(s) * 1000);
    }
    const text = String(s);
    const patterns: Array<[RegExp, (m: RegExpExecArray) => string]> = [
      [/^(\d{4})-(\d{2})-(\d{2})$/, (m) => `${m[1]}-${m[2]}-${m[3]}`],
      [/^(\d{2})\/(\d{2})\/(\d{4})$/, (m) => `${m[3]}-${m[2]}-${m[1]}`],
      [/^(\d{4})\/(\d{2})\/(\d{2})$/, (m) => `${m[1]}-${m[2]}-${m[3]}`],
      [/^(\d{2})-(\d{2})-(\d{4})$/, (m) => `${m[3]}-${m[2]}-${m[1]}`],
    ];
    for (const [re, build] of patterns) {
      const match = re.exec(text);
      if (match) {
        const parsed = new Date(`${build(match)}T00:00:00Z`);
        if (!Number.isNaN(parsed.getTime())) return parsed;
      }
    }
    return null;
  }

  listRecentExports(
    fromDate: string | null,
    toDate: string | null,
  ): Promise<Record<string, unknown>[]> {
    const from = this.parseExportDate(fromDate);
    const to = this.parseExportDate(toDate);
    const qb = this.sales
      .createQueryBuilder('s')
      .select('s.id', 'id')
      .addSelect('s.customerType', 'customer_type')
      .addSelect('s.total', 'total')
      .addSelect('s.createdAt', 'created_at');
    if (from) {
      qb.andWhere('s.created_at >= :from', { from: from.toISOString() });
    }
    if (to) {
      qb.andWhere('s.created_at <= :to', { to: to.toISOString() });
    }
    return qb.getRawMany();
  }
}
