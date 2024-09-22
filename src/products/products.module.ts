import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Category } from 'src/categories/entities/category.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';

@Module({
  imports: [
    SequelizeModule.forFeature([Product, Category]),
    ElasticsearchModule.register({
      node: process.env.ELASTICSEARCH_HOST,
      maxRetries: 10,
    }),
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
