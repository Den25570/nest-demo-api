import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import slugify from 'slugify';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Cache } from 'cache-manager';
import { Op } from 'sequelize';
import { Product } from './entities/product.entity';
import { Category } from 'src/categories/entities/category.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product) private productModel: typeof Product,
    @InjectModel(Category) private categoryModel: typeof Category,
    private readonly elasticsearchService: ElasticsearchService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async onModuleInit() {
    await this.createIndex();
    await this.indexProducts();
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const slug = slugify(createProductDto.title, { lower: true, strict: true });

    const product = await this.productModel.create({
      ...createProductDto,
      slug,
    });

    if (
      createProductDto.categoryIds &&
      createProductDto.categoryIds.length > 0
    ) {
      const categories = await this.categoryModel.findAll({
        where: { id: createProductDto.categoryIds },
      });
      await product.$set('categories', categories);
    }

    await this.indexToElasticsearch(product);

    return product;
  }

  async findAll(): Promise<Product[]> {
    return await this.productModel.findAll({
      include: [
        {
          model: Category,
          attributes: ['id', 'slug', 'title'],
          through: {
            attributes: [],
          },
        },
      ],
      attributes: ['id', 'slug', 'title', 'description'],
    });
  }

  async findOneById(id: number): Promise<Product> {
    return await this.productModel.findByPk(id, {
      include: [
        {
          model: Category,
          attributes: ['id', 'slug', 'title'],
          through: {
            attributes: [],
          },
        },
      ],
      attributes: ['id', 'slug', 'title', 'description'],
    });
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productModel.findByPk(id);

    if (!product) {
      return null;
    }

    if (updateProductDto.title) {
      product.title = updateProductDto.title;
    }
    if (updateProductDto.description) {
      product.description = updateProductDto.description;
    }

    await product.save();

    if (updateProductDto.categoryIds) {
      const categories = await this.categoryModel.findAll({
        where: { id: updateProductDto.categoryIds },
      });
      await product.$set('categories', categories);
    }

    await this.updateElasticsearchIndex(product);

    await this.cacheManager.del(`product_${product.slug}`);

    return await this.findOneById(id);
  }

  async remove(id: number): Promise<boolean> {
    const product = await this.productModel.findByPk(id);

    if (!product) {
      return false;
    }

    await product.destroy();

    await this.elasticsearchService.delete({
      index: 'products',
      id: id.toString(),
    });

    await this.cacheManager.del(`product_${product.slug}`);

    return true;
  }

  async findOneBySlug(slug: string): Promise<Product> {
    const product = await this.productModel.findOne({
      where: { slug },
      include: [
        {
          model: Category,
          attributes: ['id', 'slug', 'title'],
          through: {
            attributes: [],
          },
        },
      ],
      attributes: ['id', 'slug', 'title', 'description'],
    });

    if (!product) {
      return null;
    }

    return product;
  }

  async search(query: string): Promise<Product[]> {
    const { hits } = await this.elasticsearchService.search<Product>({
      index: 'products',
      body: {
        query: {
          match: {
            title: {
              query,
              fuzziness: 'AUTO',
              fuzzy_rewrite: 'constant_score',
            },
          },
        },
      },
    });

    const ids = hits.hits.map((hit) => hit._source.id);

    const products = await this.productModel.findAll({
      where: { id: { [Op.in]: ids } },
      include: [
        {
          model: Category,
          attributes: ['id', 'slug', 'title'],
          through: {
            attributes: [],
          },
        },
      ],
      attributes: ['id', 'slug', 'title', 'description'],
    });

    return products;
  }

  private async indexToElasticsearch(product: Product) {
    await this.elasticsearchService.index({
      index: 'products',
      id: product.id.toString(),
      body: {
        id: product.id,
        title: product.title,
        description: product.description,
      },
    });
  }

  private async updateElasticsearchIndex(product: Product) {
    await this.elasticsearchService.update({
      index: 'products',
      id: product.id.toString(),
      body: {
        doc: {
          title: product.title,
          description: product.description,
        },
      },
    });
  }

  private async createIndex() {
    const indexExists = await this.elasticsearchService.indices.exists({
      index: 'products',
    });

    if (!indexExists) {
      await this.elasticsearchService.indices.create({
        index: 'products',
        body: {
          mappings: {
            properties: {
              id: { type: 'integer' },
              title: { type: 'text' },
              slug: { type: 'text' },
              description: { type: 'text' },
            },
          },
        },
      });
      console.log('Index "products" created successfully');
    } else {
      console.log('Index "products" already exists');
    }
  }

  private async indexProducts() {
    const products = await this.productModel.findAll();
    const bulkOperations = products.flatMap((product) => [
      { index: { _index: 'products', _id: product.id } },
      {
        id: product.id,
        title: product.title,
        slug: product.slug,
        description: product.description,
      },
    ]);

    if (bulkOperations.length > 0) {
      await this.elasticsearchService.bulk({
        refresh: true,
        body: bulkOperations,
      });
      console.log(`Indexed ${products.length} products into Elasticsearch`);
    } else {
      console.log('No products found for indexing');
    }
  }
}
