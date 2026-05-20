import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from './finance.service';

describe('FinanceService', () => {
  let service: FinanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinanceService],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
  });

  describe('calcIva', () => {
    it('applies the built-in 16% IVA hook', () => {
      expect(service.calcIva(100)).toBe(16);
    });

    it('sums the contribution of every registered hook', () => {
      service.registerPricingHook(() => 5);
      expect(service.calcIva(100)).toBe(21);
    });
  });

  describe('applyVolumeDiscount', () => {
    it('gives 10% off above 50 units', () => {
      expect(service.applyVolumeDiscount(51, 100)).toBe(90);
    });

    it('gives 5% off above 10 units', () => {
      expect(service.applyVolumeDiscount(11, 100)).toBe(95);
    });

    it('gives no discount at or below 10 units', () => {
      expect(service.applyVolumeDiscount(10, 100)).toBe(100);
    });
  });

  describe('convertCurrency', () => {
    it('returns the amount unchanged for the same currency', () => {
      expect(service.convertCurrency(100, 'USD', 'USD')).toBe(100);
    });

    it('converts USD to MXN', () => {
      expect(service.convertCurrency(10, 'USD', 'MXN')).toBe(175);
    });

    it('converts MXN to USD', () => {
      expect(service.convertCurrency(175, 'MXN', 'USD')).toBe(10);
    });
  });

  describe('prorateShipping', () => {
    it('returns an empty array when there are no items', () => {
      expect(service.prorateShipping([], 100)).toEqual([]);
    });

    it('splits the shipping cost evenly across items', () => {
      expect(service.prorateShipping([1, 2, 3, 4], 100)).toEqual([
        25, 25, 25, 25,
      ]);
    });
  });

  describe('roundAmount', () => {
    it('rounds to two decimal places', () => {
      expect(service.roundAmount(3.14159)).toBe(3.14);
    });
  });
});
