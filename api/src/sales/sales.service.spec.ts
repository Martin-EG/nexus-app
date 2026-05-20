import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../email/email.service';
import { FinanceService } from '../finance/finance.service';
import { InventoryService } from '../inventory/inventory.service';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SalesService } from './sales.service';

type Repo = {
  find: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  update: jest.Mock;
};

describe('SalesService', () => {
  let service: SalesService;
  let sales: Repo;
  let saleItems: Repo;
  let inventoryService: {
    getProductPrice: jest.Mock;
    decrementStock: jest.Mock;
    incrementStock: jest.Mock;
  };
  let financeService: {
    applyVolumeDiscount: jest.Mock;
    calcIva: jest.Mock;
    roundAmount: jest.Mock;
  };
  let emailService: { sendEmail: jest.Mock };

  beforeEach(async () => {
    sales = {
      find: jest.fn(),
      create: jest.fn((v: unknown) => v),
      save: jest.fn(),
      update: jest.fn(),
    };
    saleItems = {
      find: jest.fn(),
      create: jest.fn((v: unknown) => v),
      save: jest.fn(),
      update: jest.fn(),
    };
    inventoryService = {
      getProductPrice: jest.fn(),
      decrementStock: jest.fn(),
      incrementStock: jest.fn(),
    };
    financeService = {
      applyVolumeDiscount: jest.fn(),
      calcIva: jest.fn(),
      roundAmount: jest.fn(),
    };
    emailService = { sendEmail: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: getRepositoryToken(Sale), useValue: sales },
        { provide: getRepositoryToken(SaleItem), useValue: saleItems },
        { provide: InventoryService, useValue: inventoryService },
        { provide: FinanceService, useValue: financeService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  describe('createSale', () => {
    it('prices the items, persists the sale and emails the customer', async () => {
      inventoryService.getProductPrice.mockResolvedValue(10);
      financeService.applyVolumeDiscount.mockReturnValue(20);
      financeService.calcIva.mockReturnValue(3.2);
      financeService.roundAmount.mockReturnValue(23.2);
      sales.save.mockResolvedValue({ id: 1 });
      saleItems.save.mockResolvedValue({});

      const result = await service.createSale(7, 'NORMAL', [
        { product_id: 5, qty: 2 },
      ]);

      expect(result).toEqual({ sale_id: 1, total: 23.2 });
      expect(inventoryService.decrementStock).toHaveBeenCalledWith(5, 1, 2);
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('returnSale', () => {
    it('touches the sale and restocks every returned item', async () => {
      sales.update.mockResolvedValue({ affected: 1 });

      const result = await service.returnSale(3, [
        { product_id: 5, qty: 1 },
        { product_id: 6, qty: 2, warehouse_id: 4 },
      ]);

      expect(result).toEqual({ sale_id: 3, returned_items: 2 });
      expect(inventoryService.incrementStock).toHaveBeenCalledWith(5, 1, 1);
      expect(inventoryService.incrementStock).toHaveBeenCalledWith(6, 4, 2);
    });
  });

  describe('getSalesByUser', () => {
    it('returns only completed sales for the user', async () => {
      const rows = [{ id: 1 }];
      sales.find.mockResolvedValue(rows);

      await expect(service.getSalesByUser(7)).resolves.toBe(rows);
      expect(sales.find).toHaveBeenCalledWith({
        where: { userId: 7, status: 'completed' },
      });
    });
  });

  describe('parseSaleDate', () => {
    it('converts dd/mm/yyyy to yyyy-mm-dd', () => {
      expect(service.parseSaleDate('01/02/2003')).toBe('2003-02-01');
    });

    it('returns the input unchanged when it is not a slash date', () => {
      expect(service.parseSaleDate('2003-02-01')).toBe('2003-02-01');
    });
  });
});
