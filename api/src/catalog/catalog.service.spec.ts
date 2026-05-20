import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { Product } from './entities/product.entity';
import { CatalogService } from './catalog.service';

type ProductsRepository = {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  update: jest.Mock;
};

type AuthServiceMock = {
  requireAdmin: jest.Mock;
};

describe('CatalogService', () => {
  let service: CatalogService;
  let productsRepository: ProductsRepository;
  let authService: AuthServiceMock;

  beforeEach(async () => {
    productsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    authService = { requireAdmin: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        {
          provide: getRepositoryToken(Product),
          useValue: productsRepository,
        },
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  describe('List of products', () => {
    it('returns the list of products', async () => {
      const rows = [{ id: 1 }];
      productsRepository.find.mockResolvedValue(rows);

      await expect(service.listProducts()).resolves.toBe(rows);
    });
  });

  describe('Find product', () => {
    it('returns the product when it exists', async () => {
      const product = { id: 1, name: 'Widget' };
      productsRepository.findOne.mockResolvedValue(product);

      await expect(service.getProduct(1)).resolves.toBe(product);
    });

    it('throws NotFound when the product does not exist', async () => {
      productsRepository.findOne.mockResolvedValue(null);

      await expect(service.getProduct(99)).rejects.toThrow(NotFoundException);
    });

    it('serves a cached product on the second call', async () => {
      productsRepository.findOne.mockResolvedValue({ id: 1 });

      await service.getProduct(1);
      await service.getProduct(1);

      expect(productsRepository.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('Create product', () => {
    it('persists the product and returns its id', async () => {
      productsRepository.create.mockImplementation((p: unknown) => p);
      productsRepository.save.mockResolvedValue({ id: 42 });

      const result = await service.createProduct({
        sku: 'SKU-1',
        name: 'Widget',
        price: 9.99,
        category: 'tools',
        supplier_id: 2,
      });

      expect(result).toEqual({ id: 42 });
    });
  });

  describe('Delete product', () => {
    it('throws Forbidden when the requester is not an admin', async () => {
      authService.requireAdmin.mockReturnValue(false);

      await expect(service.deleteProduct(1, {})).rejects.toThrow(
        ForbiddenException,
      );
      expect(productsRepository.update).not.toHaveBeenCalled();
    });

    it('soft-deletes the product for an admin requester', async () => {
      authService.requireAdmin.mockReturnValue(true);
      productsRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.deleteProduct(1, { is_admin: true }),
      ).resolves.toEqual({ id: 1, deleted: true });
      expect(productsRepository.update).toHaveBeenCalled();
    });
  });

  describe('Search products', () => {
    it('queries products matching the search term', async () => {
      const rows = [{ id: 1 }];
      productsRepository.find.mockResolvedValue(rows);

      await expect(service.searchProducts('wid')).resolves.toBe(rows);
      expect(productsRepository.find).toHaveBeenCalled();
    });
  });
});
