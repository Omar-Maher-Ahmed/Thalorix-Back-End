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

    const template = await this.templateModel.findById(templateId);

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (!template.isActive) {
      throw new BadRequestException('Template is not active');
    }

    // ❌ منع شراء المنتج من نفسك
    if (template.developerId.toString() === userId) {
      throw new BadRequestException('You cannot purchase your own template');
    }

    // ❌ منع duplicate unpaid order
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

    const price = template.price;
    const totalAmount = price * quantity;

    const order = await this.orderModel.create({
      buyer: userId,
      seller: template.developerId,
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

  // 🔍 Get Single Order (Ownership Protected)
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

  // 💳 Mark As Paid (بعد نجاح الدفع)
  async markAsPaid(orderId: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // 🔒 منع القفز في الحالات
    if (order.orderStatus !== OrderStatus.PENDING) {
      throw new BadRequestException('Invalid state transition');
    }

    if (order.paymentStatus !== PaymentStatus.UNPAID) {
      throw new BadRequestException('Order already processed');
    }

    order.paymentStatus = PaymentStatus.PAID;
    order.orderStatus = OrderStatus.PROCESSING;

    await order.save();

    return order;
  }

  // 📦 Complete Order (Buyer or Seller confirms completion)
  async completeOrder(orderId: string, userId: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Allow either buyer or seller of the order to complete it
    if (
      order.seller.toString() !== userId &&
      order.buyer.toString() !== userId
    ) {
      throw new ForbiddenException(
        'You are not authorized to complete this order',
      );
    }

    // 🔒 منع القفز
    if (
      order.orderStatus !== OrderStatus.PROCESSING ||
      order.paymentStatus !== PaymentStatus.PAID
    ) {
      throw new BadRequestException('Order is not ready to be completed');
    }

    order.orderStatus = OrderStatus.COMPLETED;

    await order.save();

    return order;
  }

  // 💸 Refund Order
  async refundOrder(orderId: string, sellerId: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // 👮‍♂️ فقط البائع (أو admin مستقبلاً)
    if (order.seller.toString() !== sellerId) {
      throw new ForbiddenException('Only seller can refund this order');
    }

    // 🔒 منع القفز
    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Order is not paid');
    }

    if (order.orderStatus === OrderStatus.COMPLETED) {
      throw new BadRequestException(
        'Completed orders require special refund handling',
      );
    }

    order.paymentStatus = PaymentStatus.REFUNDED;
    order.orderStatus = OrderStatus.CANCELLED;

    await order.save();

    return order;
  }

  // 🗑️ Delete Order
  async remove(orderId: string, userId: string, userRole: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // 1. Admin can delete anything
    if (userRole === 'admin') {
      await this.orderModel.findByIdAndDelete(orderId);
      return { message: 'Order deleted successfully by admin' };
    }

    // 2. Buyer or Seller can delete the order
    if (
      order.buyer.toString() === userId ||
      order.seller.toString() === userId
    ) {
      await this.orderModel.findByIdAndDelete(orderId);
      return { message: 'Order deleted successfully' };
    }

    // 3. Otherwise Forbidden
    throw new ForbiddenException('You are not allowed to delete this order');
  }
}