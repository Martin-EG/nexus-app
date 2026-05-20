import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../inventory/inventory.service';
import { Purchase } from './entities/purchase.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { PurchasesService } from './purchases.service';
import { Supplier } from './entities/supplier.entity';

type Repo = {
  find: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  update: jest.Mock;
  createQueryBuilder: jest.Mock;
};

/** Minimal chainable QueryBuilder mock whose terminal call resolves `result`. */
function makeQueryBuilder(result: unknown): Record<string, jest.Mock> {
  const qb: Record<string, jest.Mock> = {};
  for (const method of ['leftJoin', 'select', 'addSelect', 'orderBy', 'limit']) {
    qb[method] = jest.fn(() => qb);
  }
  qb.getRawMany = jest.fn().mockResolvedValue(result);
  return qb;
}

function repoMock(): Repo {
  return {
    find: jest.fn(),
    create: jest.fn((v: unknown) => v),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
}

describe('PurchasesService', () => {
  let service: PurchasesService;
  let purchases: Repo;
  let purchaseItems: Repo;
  let suppliers: Repo;
  let inventoryService: { incrementStock: jest.Mock };

  beforeEach(async () => {
    purchases = repoMock();
    purchaseItems = repoMock();
    suppliers = repoMock();
    inventoryService = { incrementStock: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasesService,
        { provide: getRepositoryToken(Purchase), useValue: purchases },
        { provide: getRepositoryToken(PurchaseItem), useValue: purchaseItems },
        { provide: getRepositoryToken(Supplier), useValue: suppliers },
        { provide: InventoryService, useValue: inventoryService },
      ],
    }).compile();

    service = module.get<PurchasesService>(PurchasesService);
  });

  describe('createPurchase', () => {
    it('rejects a received_date that is not YYYY-MM-DD', async () => {
      await expect(
        service.createPurchase(1, [], 'not-a-date'),
      ).rejects.toThrow(BadRequestException);
    });

    it('persists the purchase and restocks each item', async () => {
      purchases.save.mockResolvedValue({ id: 9 });
      purchaseItems.save.mockResolvedValue({});

      const result = await service.createPurchase(
        1,
        [{ product_id: 5, qty: 4, unit_cost: 2.5 }],
        '2025-01-15',
      );

      expect(result).toEqual({ purchase_id: 9 });
      expect(inventoryService.incrementStock).toHaveBeenCalledWith(5, 1, 4);
    });
  });

  describe('reconcilePurchase', () => {
    it('updates the purchase and echoes the bank reference', async () => {
      purchases.update.mockResolvedValue({ affected: 1 });

      await expect(service.reconcilePurchase(9, 'BR-1')).resolves.toEqual({
        purchase_id: 9,
        bank_ref: 'BR-1',
      });
    });
  });

  describe('listSuppliers', () => {
    it('returns suppliers ordered by name', async () => {
      const rows = [{ id: 1, name: 'ACME' }];
      suppliers.find.mockResolvedValue(rows);

      await expect(service.listSuppliers()).resolves.toBe(rows);
    });
  });

  describe('listPurchases', () => {
    it('returns the joined purchase rows', async () => {
      const rows = [{ id: 9, supplier_name: 'ACME' }];
      purchases.createQueryBuilder.mockReturnValue(makeQueryBuilder(rows));

      await expect(service.listPurchases()).resolves.toBe(rows);
    });
  });
});
