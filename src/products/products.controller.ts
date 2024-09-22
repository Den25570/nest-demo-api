import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  NotFoundException,
  UseInterceptors,
  UseFilters,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SequelizeValidationFilter } from 'src/common/filters/sequelize-validation.filter';

@Controller('products')
@UseFilters(SequelizeValidationFilter)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    const product = await this.productsService.create(createProductDto);
    return product;
  }

  @Get()
  async findAll() {
    const products = await this.productsService.findAll();
    return products;
  }

  @Get('id/:id')
  async findOneById(@Param('id') id: number) {
    const product = await this.productsService.findOneById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  @Get('search')
  async search(@Query('q') query: string) {
    const products = await this.productsService.search(query);
    return products;
  }

  @Get(':slug')
  @UseInterceptors(CacheInterceptor)
  async findOneBySlug(@Param('slug') slug: string) {
    const product = await this.productsService.findOneBySlug(slug);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const updated = await this.productsService.update(id, updateProductDto);
    if (!updated) {
      throw new NotFoundException('Product not found');
    }
    return updated;
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    const deleted = await this.productsService.remove(id);
    if (!deleted) {
      throw new NotFoundException('Product not found');
    }
    return {
      message: `Product id:${id} deleted`,
    };
  }
}
