import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { InventoryStock } from '../inventory/entities/inventory-stock.entity';
import { Sale } from '../sales/entities/sale.entity';
import { ReportsService } from './reports.service';

type Repo = {
  find: jest.Mock;
  createQueryBuilder: jest.Mock;
};

/** Minimal chainable QueryBuilder mock whose terminal call resolves `result`. */
function makeQueryBuilder(result: unknown): Record<string, jest.Mock> {
  const qb: Record<string, jest.Mock> = {};
  for (const method of [
    'innerJoin',
    'select',
    'addSelect',
    'where',
    'andWhere',
  ]) {
    qb[method] = jest.fn(() => qb);
  }
  qb.getRawMany = jest.fn().mockResolvedValue(result);
  return qb;
}

describe('ReportsService', () => {
  let service: ReportsService;
  let sales: Repo;
  let stock: Repo;

  beforeEach(async () => {
    sales = { find: jest.fn(), createQueryBuilder: jest.fn() };
    stock = { find: jest.fn(), createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Sale), useValue: sales },
        { provide: getRepositoryToken(InventoryStock), useValue: stock },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  describe('monthlyReport', () => {
    it('returns the aggregated rows for the month', async () => {
      const rows = [{ id: 1, line_after_discount: 100 }];
      sales.createQueryBuilder.mockReturnValue(makeQueryBuilder(rows));

      await expect(service.monthlyReport(2025, 1)).resolves.toBe(rows);
    });
  });

  describe('totalSales', () => {
    it('sums line_after_discount across the monthly rows', async () => {
      sales.createQueryBuilder.mockReturnValue(
        makeQueryBuilder([
          { line_after_discount: 100 },
          { line_after_discount: 50 },
        ]),
      );

      await expect(service.totalSales(2025, 1)).resolves.toBe(150);
    });
  });

  describe('exportReport', () => {
    it('exports sales rows for report type "sales"', async () => {
      const rows = [{ id: 2 }];
      sales.createQueryBuilder.mockReturnValue(makeQueryBuilder(rows));

      await expect(service.exportReport('sales', 1)).resolves.toBe(rows);
    });

    it('exports inventory rows for report type "inventory"', async () => {
      const rows = [{ product_id: 2 }];
      stock.createQueryBuilder.mockReturnValue(makeQueryBuilder(rows));

      await expect(service.exportReport('inventory', 1)).resolves.toBe(rows);
    });

    it('rejects an unknown report type', async () => {
      await expect(service.exportReport('payroll', 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('parseAnyDate', () => {
    it('parses an ISO date', () => {
      expect(service.parseAnyDate('2025-03-15')?.getUTCFullYear()).toBe(2025);
    });

    it('returns null for an unrecognised value', () => {
      expect(service.parseAnyDate('not-a-date')).toBeNull();
    });
  });
});
