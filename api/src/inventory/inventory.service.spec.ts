import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Product } from '../catalog/entities/product.entity';
import { Sale } from '../sales/entities/sale.entity';
import { InventoryStock } from './entities/inventory-stock.entity';
import { InventoryService } from './inventory.service';
import { Warehouse } from './entities/warehouse.entity';

type Repo = {
  find: jest.Mock;
  findOne: jest.Mock;
  update: jest.Mock;
  increment: jest.Mock;
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
    'orderBy',
    'limit',
  ]) {
    qb[method] = jest.fn(() => qb);
  }
  qb.getRawMany = jest.fn().mockResolvedValue(result);
  qb.getRawOne = jest.fn().mockResolvedValue(result);
  return qb;
}

function repoMock(): Repo {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    increment: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
}

describe('InventoryService', () => {
  let service: InventoryService;
  let products: Repo;
  let stock: Repo;
  let warehouses: Repo;
  let sales: Repo;

  beforeEach(async () => {
    products = repoMock();
    stock = repoMock();
    warehouses = repoMock();
    sales = repoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: getRepositoryToken(Product), useValue: products },
        { provide: getRepositoryToken(InventoryStock), useValue: stock },
        { provide: getRepositoryToken(Warehouse), useValue: warehouses },
        { provide: getRepositoryToken(Sale), useValue: sales },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  describe('getProductPrice', () => {
    it('returns the product price when found', async () => {
      products.findOne.mockResolvedValue({ id: 1, price: 9.99 });

      await expect(service.getProductPrice(1)).resolves.toBe(9.99);
    });

    it('returns 0 when the product is missing', async () => {
      products.findOne.mockResolvedValue(null);

      await expect(service.getProductPrice(1)).resolves.toBe(0);
    });
  });

  describe('getStock', () => {
    it('returns the warehouse-specific quantity', async () => {
      stock.findOne.mockResolvedValue({ quantity: 12 });

      await expect(service.getStock(1, 3)).resolves.toBe(12);
    });

    it('returns 0 when there is no stock row for the warehouse', async () => {
      stock.findOne.mockResolvedValue(null);

      await expect(service.getStock(1, 3)).resolves.toBe(0);
    });

    it('sums quantity across warehouses when none is given', async () => {
      stock.createQueryBuilder.mockReturnValue(makeQueryBuilder({ q: '40' }));

      await expect(service.getStock(1)).resolves.toBe(40);
    });
  });

  describe('decrementStock', () => {
    it('writes the reduced quantity', async () => {
      stock.findOne.mockResolvedValue({ quantity: 10 });
      stock.update.mockResolvedValue({ affected: 1 });

      await service.decrementStock(1, 2, 3);

      expect(stock.update).toHaveBeenCalledWith(
        { productId: 1, warehouseId: 2 },
        { quantity: 7 },
      );
    });
  });

  describe('filterByWarehouse', () => {
    it('queries stock by warehouse id', async () => {
      const rows = [{ id: 1 }];
      stock.find.mockResolvedValue(rows);

      await expect(service.filterByWarehouse(5)).resolves.toBe(rows);
      expect(stock.find).toHaveBeenCalledWith({
        where: { warehouseId: 5 },
      });
    });
  });

  describe('isProductActive', () => {
    it('is true when the latest sale has a last_touch_at', async () => {
      sales.createQueryBuilder.mockReturnValue(
        makeQueryBuilder({ last_touch_at: new Date() }),
      );

      await expect(service.isProductActive(1)).resolves.toBe(true);
    });

    it('is false when there is no matching sale', async () => {
      sales.createQueryBuilder.mockReturnValue(makeQueryBuilder(undefined));

      await expect(service.isProductActive(1)).resolves.toBe(false);
    });
  });

  describe('inventoryOverview', () => {
    it('returns the joined product/stock rows', async () => {
      const rows = [
        { id: 1, name: 'W', sku: 'S', warehouse: 'Main', quantity: 5 },
      ];
      products.createQueryBuilder.mockReturnValue(makeQueryBuilder(rows));

      await expect(service.inventoryOverview()).resolves.toBe(rows);
    });
  });
});
