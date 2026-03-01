
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Order,
  OrderDocument,
  OrderStatus,
  PaymentStatus,
} from './schema/order.schema';

import { CreateOrderDto } from './dto/create-order.dto';

import {
  Template,
  TemplateDocument,
} from '../templates/schema/template.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,

    @InjectModel(Template.name)
    private templateModel: Model<TemplateDocument>,
  ) {}

  // 🛒 Create Order
  async create(userId: string, createOrderDto: CreateOrderDto) {
    const { templateId } = createOrderDto;
    const quantity = createOrderDto.quantity || 1;

    // 1️⃣ Get Template
    const template = await this.templateModel.findById(templateId);

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (!template.isActive) {
      throw new BadRequestException('Template is not active');
    }

    // 2️⃣ Snapshot price
    const price = template.price;
    const totalAmount = price * quantity;

    // 3️⃣ Create Order
    const order = await this.orderModel.create({
      buyer: userId,
      seller: template.seller,
      template: template._id,
      price,
      quantity,
      totalAmount,
      orderStatus: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
    });

    return order;
  }

  // 📦 Get My Orders
  async findUserOrders(userId: string) {
    return this.orderModel
      .find({ buyer: userId })
      .populate('template')
      .sort({ createdAt: -1 });
  }

  // 🔍 Get Single Order
  async findOne(orderId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('template')
      .populate('buyer', '-password')
      .populate('seller', '-password');

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // 💳 Mark As Paid (جاهزة للـ Payment Integration)
  async markAsPaid(orderId: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.orderStatus = OrderStatus.PAID;
    order.paymentStatus = PaymentStatus.PAID;

    await order.save();

    return order;
  }
}