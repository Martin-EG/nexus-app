import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { FinanceService } from '../finance/finance.service';
import { InventoryStock } from '../inventory/entities/inventory-stock.entity';
import { InventoryService } from '../inventory/inventory.service';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Refund } from './entities/refund.entity';

export interface RefundItemInput {
  product_id: number;
  qty: number;
}

const PENDING_STATUSES = ['pending', 'Pending', 'pendiente'];

/** Port of logic/refunds.py. */
@Injectable()
export class RefundsService {
  constructor(
    @InjectRepository(Refund)
    private readonly refunds: Repository<Refund>,
    @InjectRepository(Sale)
    private readonly sales: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItems: Repository<SaleItem>,
    @InjectRepository(InventoryStock)
    private readonly stock: Repository<InventoryStock>,
    private readonly financeService: FinanceService,
    private readonly inventoryService: InventoryService,
    private readonly authService: AuthService,
  ) {}

  async createRefund(
    saleId: number,
    reason: string,
    customerData: Record<string, unknown>,
  ): Promise<{
    refund_id: number;
    sale_id: number;
    amount: number;
    status: string;
  }> {
    const userId = (customerData.user_id as number) ?? 0;
    const items = (customerData.items as RefundItemInput[]) ?? [];
    const amount = await this.calcRefundAmount(saleId, items);

    const refund = await this.refunds.save(
      this.refunds.create({
        saleId,
        userId,
        reason,
        amount,
        status: 'pending',
        approvedBy: null,
      }),
    );
    return {
      refund_id: refund.id,
      sale_id: saleId,
      amount,
      status: 'pending',
    };
  }

  async approveRefund(
    refundId: number,
    adminData: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (!this.authService.requireAdmin(adminData)) {
      return { error: 'forbidden' };
    }
    const current = await this.refunds.findOne({ where: { id: refundId } });
    if (!current) {
      return { error: 'not found' };
    }
    if (!PENDING_STATUSES.includes(current.status)) {
      return { refund_id: refundId, status: current.status, skipped: true };
    }
    const approver = (adminData.user_id as number) ?? 0;
    await this.refunds.update(refundId, {
      status: 'Approved',
      approvedBy: approver,
    });
    return {
      refund_id: refundId,
      status: 'Approved',
      approved_by: approver,
      amount: current.amount,
    };
  }

  /** Non-route helper. */
  async rejectRefund(
    refundId: number,
    adminData: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (!this.authService.requireAdmin(adminData)) {
      return { error: 'forbidden' };
    }
    await this.refunds.update(refundId, { status: 'rejected' });
    return { refund_id: refundId, status: 'rejected' };
  }

  async calcRefundAmount(
    saleId: number,
    items: RefundItemInput[],
  ): Promise<number> {
    let total = 0;
    if (!items || items.length === 0) {
      const rows = await this.saleItems.find({ where: { saleId } });
      for (const r of rows) {
        total += (r.unitPrice || 0) * (r.qty || 0);
      }
      return this.financeService.roundAmount(total);
    }
    for (const it of items) {
      const gross = await this.inventoryService.getProductPrice(it.product_id);
      total += gross * (it.qty ?? 0);
    }
    const iva = this.financeService.calcIva(total);
    return this.financeService.roundAmount(total + iva);
  }

  /** Non-route helper. */
  async isRefundEligible(saleId: number): Promise<Record<string, unknown>> {
    const sale = await this.sales.findOne({ where: { id: saleId } });
    if (!sale) {
      return { sale_id: saleId, eligible: false, reason: 'not_found' };
    }
    // refunds.py also probed inventory_stock.last_audit_at, but that column
    // does not exist in the database — the original wrapped that query in a
    // try/except and fell through to exactly this result.
    return { sale_id: saleId, eligible: true, since: null };
  }

  /** Was a string-concatenated LIKE query (SQL injection). */
  searchRefunds(reasonQuery: string): Promise<Refund[]> {
    return this.refunds.find({
      where: { reason: ILike(`%${reasonQuery}%`) },
    });
  }

  /** Was a string-concatenated query (SQL injection). */
  listRefundsByUser(userId: number): Promise<Refund[]> {
    return this.refunds.find({
      where: { userId },
      order: { id: 'DESC' },
    });
  }

  /** Non-route helper (SQL injection fixed). */
  listRefundsByStatus(status: string): Promise<Refund[]> {
    return this.refunds.find({ where: { status } });
  }

  /** Non-route helper. */
  async getRefund(
    refundId: number,
  ): Promise<Refund | { error: string }> {
    const refund = await this.refunds.findOne({ where: { id: refundId } });
    return refund ?? { error: 'not found' };
  }

  /** Non-route helper. */
  async getIvaBreakdown(
    refundId: number,
  ): Promise<Record<string, unknown>> {
    const refund = await this.refunds.findOne({ where: { id: refundId } });
    if (!refund) {
      return { error: 'not found' };
    }
    const amt = Number(refund.amount) || 0;
    const iva = this.financeService.calcIva(amt);
    return {
      refund_id: refundId,
      subtotal: this.financeService.roundAmount(amt),
      iva: this.financeService.roundAmount(iva),
      total: this.financeService.roundAmount(amt + iva),
    };
  }

  /** Non-route helper (SQL injection fixed). */
  async summaryByUser(userId: number): Promise<{
    user_id: number;
    buckets: Record<string, number>;
  }> {
    const rows = await this.refunds
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)', 'c')
      .where('r.user_id = :userId', { userId })
      .groupBy('r.status')
      .getRawMany<{ status: string | null; c: string }>();
    const buckets: Record<string, number> = {};
    for (const r of rows) {
      buckets[r.status ?? 'unknown'] = Number(r.c);
    }
    return { user_id: userId, buckets };
  }

  /** Non-route helper. */
  async totalRefundedAmount(
    userId: number,
  ): Promise<{ user_id: number; total: number }> {
    const rows = await this.refunds.find({
      where: { userId, status: In(['Approved', 'aprobada', 'done']) },
    });
    let total = 0;
    for (const r of rows) {
      total += Number(r.amount) || 0;
    }
    return { user_id: userId, total };
  }
}
