import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import slugify from 'slugify';
import { Category } from './entities/category.entity';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category) private categoryModel: typeof Category,
    @InjectModel(Product) private productModel: typeof Product,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const slug = slugify(createCategoryDto.title, {
      lower: true,
      strict: true,
    });

    const category = await this.categoryModel.create({
      ...createCategoryDto,
      slug,
    });

    return category;
  }

  async findAll(): Promise<Category[]> {
    return await this.categoryModel.findAll({
      attributes: ['id', 'slug', 'title'],
    });
  }

  async findOneById(id: number): Promise<Category> {
    return await this.categoryModel.findByPk(id, {
      attributes: ['id', 'slug', 'title'],
    });
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.categoryModel.findByPk(id);

    if (!category) {
      return null;
    }

    if (updateCategoryDto.title) {
      category.title = updateCategoryDto.title;
    }

    await category.save();

    return category;
  }

  async remove(id: number): Promise<boolean> {
    const deleted = await this.categoryModel.destroy({ where: { id } });
    return deleted ? true : false;
  }

  async findOneBySlug(
    slug: string,
    page: number,
    perPage: number,
  ): Promise<{
    category: Category;
    products: Product[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const category = await this.categoryModel.findOne({
      where: { slug },
    });

    if (!category) {
      return null;
    }

    const { rows: products, count: total } =
      await this.productModel.findAndCountAll({
        include: [
          {
            model: Category,
            where: { id: category.id },
            attributes: [],
          },
        ],
        limit: perPage,
        offset: (page - 1) * perPage,
        distinct: true,
      });

    return {
      category,
      products,
      total,
      page,
      perPage,
    };
  }
}
