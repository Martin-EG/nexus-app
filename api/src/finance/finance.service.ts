import { Injectable } from '@nestjs/common';

/**
 * A pricing hook receives an amount plus an arbitrary context object and
 * returns a contribution to the final price (mirrors finance.py's hooks).
 */
export type PricingHook = (
  amount: number,
  ctx: Record<string, unknown>,
) => number;

/** Port of logic/finance.py. */
@Injectable()
export class FinanceService {
  readonly USD_MXN_RATE = 17.5;

  // app.py kept `_PRICING_HOOKS` as a module-global list; finance.py appended
  // the IVA hook to it on import. Here the list lives on the singleton service
  // and is seeded in the constructor.
  private readonly pricingHooks: PricingHook[] = [];

  constructor() {
    this.pricingHooks.push((amount) => this.round2(amount * 0.16));
  }

  /** Register an extra pricing hook (kept for parity with the hook pattern). */
  registerPricingHook(hook: PricingHook): void {
    this.pricingHooks.push(hook);
  }

  calcIva(amount: number): number {
    let total = 0;
    for (const hook of this.pricingHooks) {
      total += hook(amount, {});
    }
    return total;
  }

  roundAmount(val: number): number {
    return this.round2(val);
  }

  convertCurrency(amount: number, fromCcy: string, toCcy: string): number {
    if (fromCcy === toCcy) return amount;
    if (fromCcy === 'USD' && toCcy === 'MXN') return amount * this.USD_MXN_RATE;
    if (fromCcy === 'MXN' && toCcy === 'USD') return amount / this.USD_MXN_RATE;
    return amount;
  }

  prorateShipping(items: unknown[], totalShipping: number): number[] {
    if (!items || items.length === 0) return [];
    const perItem = totalShipping / items.length;
    return items.map(() => this.round2(perItem));
  }

  applyVolumeDiscount(qty: number, subtotal: number): number {
    if (qty > 50) return subtotal * 0.9;
    if (qty > 10) return subtotal * 0.95;
    return subtotal;
  }

  private round2(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }
}
