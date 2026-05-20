import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CatalogService, CreateProductDto } from './catalog.service';

@Controller('products')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  list() {
    return this.catalogService.listProducts();
  }

  @Get('search')
  search(@Query('q') q = '') {
    return this.catalogService.searchProducts(q);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.catalogService.getProduct(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() body: CreateProductDto) {
    return this.catalogService.createProduct(body);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
  ) {
    return this.catalogService.deleteProduct(id, body ?? {});
  }
}
