import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Product } from './entities/product.entity';

export interface CreateProductDto {
  sku: string;
  name: string;
  price: number;
  category: string;
  supplier_id: number;
}

@Injectable()
export class CatalogService {
  private readonly productCache = new Map<number, Product>();

  constructor(
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    private readonly authService: AuthService,
  ) {}

  listProducts(): Promise<Product[]> {
    return this.products.find({ where: { deletedAt: IsNull() } });
  }

  async getProduct(pid: number): Promise<Product> {
    const cached = this.productCache.get(pid);
    if (cached) return cached;

    const product = await this.products.findOne({ where: { id: pid } });
    if (!product) {
      throw new NotFoundException('not found');
    }
    this.productCache.set(pid, product);
    return product;
  }

  async createProduct(data: CreateProductDto): Promise<{ id: number }> {
    const product = await this.products.save(
      this.products.create({
        sku: data.sku,
        name: data.name,
        price: data.price,
        category: data.category,
        supplierId: data.supplier_id,
        deletedAt: null,
      }),
    );
    return { id: product.id };
  }

  async deleteProduct(
    pid: number,
    requester: unknown,
  ): Promise<{ id: number; deleted: boolean }> {
    if (!this.authService.requireAdmin(requester)) {
      throw new ForbiddenException('forbidden');
    }
    await this.products.update(pid, { deletedAt: new Date() });

    this.productCache.delete(pid);
    return { id: pid, deleted: true };
  }


  searchProducts(q: string): Promise<Product[]> {
    return this.products.find({
      where: { name: ILike(`%${q}%`), deletedAt: IsNull() },
    });
  }
}
