import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductEntity } from './schema/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
    constructor(@InjectModel(ProductEntity.name) private readonly productModel: Model<ProductEntity>) { }

    async create(createProductDto: CreateProductDto): Promise<ProductEntity> {
        const createdProduct = new this.productModel(createProductDto);
        return createdProduct.save();
    }

    async findAll(): Promise<ProductEntity[]> {
        return this.productModel.find().exec();
    }

    async findOne(id: string): Promise<ProductEntity> {
        const product = await this.productModel.findById(id).exec();
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    }

    async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductEntity> {
        const product = await this.productModel.findByIdAndUpdate(id, updateProductDto, { new: true }).exec();
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    }

    async remove(id: string): Promise<ProductEntity> {
        const product = await this.productModel.findByIdAndDelete(id).exec();
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    }
}
