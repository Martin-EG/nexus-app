import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from '../finance/finance.service';
import { Sale } from '../sales/entities/sale.entity';
import { ExportsService } from './exports.service';

type SalesRepository = {
  createQueryBuilder: jest.Mock;
};

function makeQueryBuilder(result: unknown): Record<string, jest.Mock> {
  const qb: Record<string, jest.Mock> = {};
  for (const method of [
    'innerJoin',
    'leftJoin',
    'select',
    'addSelect',
    'where',
    'andWhere',
    'groupBy',
    'addGroupBy',
    'orderBy',
    'addOrderBy',
  ]) {
    qb[method] = jest.fn(() => qb);
  }
  qb.getRawMany = jest.fn().mockResolvedValue(result);
  return qb;
}

describe('ExportsService', () => {
  let service: ExportsService;
  let sales: SalesRepository;
  let financeService: { calcIva: jest.Mock };

  beforeEach(async () => {
    sales = { createQueryBuilder: jest.fn() };
    financeService = { calcIva: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportsService,
        { provide: getRepositoryToken(Sale), useValue: sales },
        { provide: FinanceService, useValue: financeService },
      ],
    }).compile();

    service = module.get<ExportsService>(ExportsService);
  });

  describe('aggregateTotals', () => {
    it('sums quantities and amounts and adds IVA', async () => {
      sales.createQueryBuilder.mockReturnValue(
        makeQueryBuilder([{ qty: 2, unit_price: 10, customer_type: 'NORMAL' }]),
      );
      financeService.calcIva.mockReturnValue(3.2);

      await expect(service.aggregateTotals({})).resolves.toEqual({
        rows: 1,
        qty_total: 2,
        subtotal: 20,
        iva: 3.2,
        total: 23.2,
      });
    });
  });

  describe('downloadCsv', () => {
    it('builds a CSV with a header row and one line per sale', async () => {
      sales.createQueryBuilder.mockReturnValue(
        makeQueryBuilder([
          {
            id: 1,
            user_id: 7,
            customer_type: 'NORMAL',
            subtotal: 10,
            total: 11,
            status: 'completed',
            created_at: '2025-01-01',
          },
        ]),
      );

      const result = await service.downloadCsv();

      expect(result.count).toBe(1);
      expect(result.csv.split('\n')).toHaveLength(2);
      expect(result.csv).toContain(
        'id,user_id,customer_type,subtotal,total,status,created_at',
      );
    });
  });

  describe('pivotReport', () => {
    it('returns the aggregated pivot rows', async () => {
      const rows = [{ dim_a: 'NORMAL', dim_b: 'tools', n_sales: 3 }];
      sales.createQueryBuilder.mockReturnValue(makeQueryBuilder(rows));

      await expect(
        service.pivotReport(2025, 'customer_type', 'category'),
      ).resolves.toBe(rows);
    });
  });

  describe('calcNaiveTotal', () => {
    it('multiplies qty by unit price across rows', () => {
      expect(
        service.calcNaiveTotal([
          { qty: 2, unit_price: 10, customer_type: 'NORMAL' },
          { qty: 1, unit_price: 5, customer_type: 'NORMAL' },
        ]),
      ).toBe(25);
    });
  });

  describe('calcEffectiveTotal', () => {
    it('applies the 0.85 factor to LEGACY_A rows', () => {
      expect(
        service.calcEffectiveTotal([
          { qty: 2, unit_price: 10, customer_type: 'LEGACY_A' },
        ]),
      ).toBe(17);
    });
  });

  describe('parseExportDate', () => {
    it('parses an ISO date', () => {
      expect(service.parseExportDate('2025-03-15')?.getUTCFullYear()).toBe(
        2025,
      );
    });

    it('returns null for an unrecognised value', () => {
      expect(service.parseExportDate('garbage')).toBeNull();
    });
  });
});
