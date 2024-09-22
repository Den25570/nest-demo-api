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
import { Category } from 'src/categories/entities/category.entity';
import { ProductCategory } from 'src/product-category/entities/product-category.entity';

@Table
export class Product extends Model<Product> {
  @Column({ type: DataType.STRING, allowNull: false })
  title: string;

  @Column({ type: DataType.STRING, unique: true })
  slug: string;

  @Column({ type: DataType.TEXT })
  description: string;

  @BelongsToMany(() => Category, () => ProductCategory)
  categories: Category[];

  @BeforeCreate
  @BeforeUpdate
  static generateSlug(instance: Product) {
    if (instance.title) {
      instance.slug = slugify(instance.title, { lower: true, strict: true });
    }
  }
}
