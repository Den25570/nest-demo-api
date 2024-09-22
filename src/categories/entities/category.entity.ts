import {
  Table,
  Column,
  Model,
  DataType,
  BelongsToMany,
  BeforeCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import slugify from 'slugify';
import { ProductCategory } from 'src/product-category/entities/product-category.entity';
import { Product } from 'src/products/entities/product.entity';

@Table
export class Category extends Model<Category> {
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  title: string;

  @Column({ type: DataType.STRING, unique: true })
  slug: string;

  @BelongsToMany(() => Product, () => ProductCategory)
  products: Product[];

  @BeforeCreate
  @BeforeUpdate
  static generateSlug(instance: Product) {
    if (instance.title) {
      instance.slug = slugify(instance.title, { lower: true, strict: true });
    }
  }
}
