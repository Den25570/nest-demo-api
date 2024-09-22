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
  UseFilters,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { SequelizeValidationFilter } from 'src/common/filters/sequelize-validation.filter';

@Controller('categories')
@UseFilters(SequelizeValidationFilter)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return await this.categoriesService.create(createCategoryDto);
  }

  @Get()
  async findAll() {
    return await this.categoriesService.findAll();
  }

  @Get('id/:id')
  async findOneById(@Param('id') id: number) {
    const category = await this.categoriesService.findOneById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const updated = await this.categoriesService.update(id, updateCategoryDto);
    if (!updated) {
      throw new NotFoundException('Category not found');
    }
    return updated;
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    const deleted = await this.categoriesService.remove(id);
    if (!deleted) {
      throw new NotFoundException('Category not found');
    }
    return {
      message: `Category id:${id} deleted`,
    };
  }

  @Get(':slug')
  async findOneBySlug(
    @Param('slug') slug: string,
    @Query('page') page = '1',
    @Query('perPage') perPage = '10',
  ) {
    const pageNumber = parseInt(page, 10);
    const perPageNumber = parseInt(perPage, 10);

    const categoryWithProducts = await this.categoriesService.findOneBySlug(
      slug,
      pageNumber,
      perPageNumber,
    );

    if (!categoryWithProducts) {
      throw new NotFoundException('Category not found');
    }

    return categoryWithProducts;
  }
}