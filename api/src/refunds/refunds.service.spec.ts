import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { FinanceService } from '../finance/finance.service';
import { InventoryStock } from '../inventory/entities/inventory-stock.entity';
import { InventoryService } from '../inventory/inventory.service';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Refund } from './entities/refund.entity';
import { RefundsService } from './refunds.service';

type Repo = {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  update: jest.Mock;
};

function repoMock(): Repo {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((v: unknown) => v),
    save: jest.fn(),
    update: jest.fn(),
  };
}

describe('RefundsService', () => {
  let service: RefundsService;
  let refunds: Repo;
  let sales: Repo;
  let saleItems: Repo;
  let stock: Repo;
  let financeService: { roundAmount: jest.Mock; calcIva: jest.Mock };
  let inventoryService: { getProductPrice: jest.Mock };
  let authService: { requireAdmin: jest.Mock };

  beforeEach(async () => {
    refunds = repoMock();
    sales = repoMock();
    saleItems = repoMock();
    stock = repoMock();
    financeService = { roundAmount: jest.fn(), calcIva: jest.fn() };
    inventoryService = { getProductPrice: jest.fn() };
    authService = { requireAdmin: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundsService,
        { provide: getRepositoryToken(Refund), useValue: refunds },
        { provide: getRepositoryToken(Sale), useValue: sales },
        { provide: getRepositoryToken(SaleItem), useValue: saleItems },
        { provide: getRepositoryToken(InventoryStock), useValue: stock },
        { provide: FinanceService, useValue: financeService },
        { provide: InventoryService, useValue: inventoryService },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    service = module.get<RefundsService>(RefundsService);
  });

  describe('createRefund', () => {
    it('totals the sale items and stores a pending refund', async () => {
      saleItems.find.mockResolvedValue([{ unitPrice: 10, qty: 2 }]);
      financeService.roundAmount.mockReturnValue(20);
      refunds.save.mockResolvedValue({ id: 1 });

      const result = await service.createRefund(3, 'damaged', { user_id: 7 });

      expect(result).toEqual({
        refund_id: 1,
        sale_id: 3,
        amount: 20,
        status: 'pending',
      });
    });
  });

  describe('approveRefund', () => {
    it('refuses a non-admin requester', async () => {
      authService.requireAdmin.mockReturnValue(false);

      await expect(service.approveRefund(1, {})).resolves.toEqual({
        error: 'forbidden',
      });
    });

    it('returns an error when the refund does not exist', async () => {
      authService.requireAdmin.mockReturnValue(true);
      refunds.findOne.mockResolvedValue(null);

      await expect(
        service.approveRefund(1, { is_admin: true }),
      ).resolves.toEqual({ error: 'not found' });
    });

    it('skips a refund that is not pending', async () => {
      authService.requireAdmin.mockReturnValue(true);
      refunds.findOne.mockResolvedValue({ id: 1, status: 'Approved' });

      await expect(
        service.approveRefund(1, { is_admin: true }),
      ).resolves.toEqual({ refund_id: 1, status: 'Approved', skipped: true });
    });

    it('approves a pending refund', async () => {
      authService.requireAdmin.mockReturnValue(true);
      refunds.findOne.mockResolvedValue({
        id: 1,
        status: 'pending',
        amount: 50,
      });
      refunds.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.approveRefund(1, { is_admin: true, user_id: 9 }),
      ).resolves.toEqual({
        refund_id: 1,
        status: 'Approved',
        approved_by: 9,
        amount: 50,
      });
    });
  });

  describe('searchRefunds', () => {
    it('queries refunds by reason', async () => {
      const rows = [{ id: 1 }];
      refunds.find.mockResolvedValue(rows);

      await expect(service.searchRefunds('dam')).resolves.toBe(rows);
      expect(refunds.find).toHaveBeenCalled();
    });
  });
});
