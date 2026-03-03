
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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

    // منع إن الـ seller يشتري من نفسه
    if (template.seller.toString() === userId) {
      throw new BadRequestException('You cannot purchase your own template');
    }

    const existingOrder = await this.orderModel.findOne({
      buyer: userId,
      template: templateId,
      paymentStatus: PaymentStatus.UNPAID,
    });

    if (existingOrder) {
      throw new BadRequestException(
        'You already have a pending order for this template',
      );
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
async findOne(orderId: string, userId: string) {
  const order = await this.orderModel
    .findById(orderId)
    .populate('template')
    .populate('buyer', '-password')
    .populate('seller', '-password');

  if (!order) {
    throw new NotFoundException('Order not found');
  }

  if (
    order.buyer._id.toString() !== userId &&
    order.seller._id.toString() !== userId
  ) {
    throw new ForbiddenException('You are not allowed to view this order');
  }

  return order;
}

  // 💳 Mark As Paid (جاهزة للـ Payment Integration)
async markAsPaid(orderId: string) {
  const order = await this.orderModel.findById(orderId);

  if (!order) {
    throw new NotFoundException('Order not found');
  }

  if (order.paymentStatus === PaymentStatus.PAID) {
    throw new BadRequestException('Order already paid');
  }

  order.paymentStatus = PaymentStatus.PAID;
  order.orderStatus = OrderStatus.PAID;

  await order.save();

  return order;
  }
}