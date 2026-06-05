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
    // 1. Gather all items to process
    const itemsToProcess: { templateId: string; quantity: number }[] = [];

    if (createOrderDto.items && createOrderDto.items.length > 0) {
      itemsToProcess.push(...createOrderDto.items);
    } else if (createOrderDto.templateIds && createOrderDto.templateIds.length > 0) {
      const qty = createOrderDto.quantity || 1;
      for (const tid of createOrderDto.templateIds) {
        itemsToProcess.push({ templateId: tid, quantity: qty });
      }
    } else if (createOrderDto.templateId) {
      itemsToProcess.push({
        templateId: createOrderDto.templateId,
        quantity: createOrderDto.quantity || 1,
      });
    } else {
      throw new BadRequestException(
        'At least one templateId, templateIds, or items array must be provided',
      );
    }

    // 2. Validate and build items list
    const orderItems = [];
    let totalAmount = 0;
    let firstTemplate: any = null;

    for (const item of itemsToProcess) {
      const { templateId, quantity } = item;
      const template = await this.templateModel.findById(templateId);

      if (!template) {
        throw new NotFoundException(`Template with ID ${templateId} not found`);
      }

      if (!template.isActive) {
        throw new BadRequestException(`Template ${template.title || templateId} is not active`);
      }

      const price = template.price;
      const amount = price * quantity;
      totalAmount += amount;

      if (!firstTemplate) {
        firstTemplate = template;
      }

      orderItems.push({
        template: template._id,
        seller: template.developerId,
        price,
        quantity,
      });
    }

    // Create a single Order document with the items array
    const order = await this.orderModel.create({
      buyer: userId,
      seller: firstTemplate ? firstTemplate.developerId : null,
      template: firstTemplate ? firstTemplate._id : null,
      price: firstTemplate ? firstTemplate.price : 0,
      quantity: itemsToProcess.length === 1 ? itemsToProcess[0].quantity : 1,
      items: orderItems,
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
      .populate('items.template')
      .sort({ createdAt: -1 });
  }

  // 🔍 Get Single Order (Ownership Protected)
  async findOne(orderId: string, userId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('template')
      .populate('items.template')
      .populate('items.seller', '-password')
      .populate('buyer', '-password')
      .populate('seller', '-password');

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const buyerIdStr = order.buyer ? (order.buyer._id || order.buyer).toString() : '';
    
    let isSeller = false;
    if (order.seller) {
      const sellerIdStr = (order.seller._id || order.seller).toString();
      if (sellerIdStr === userId.toString()) {
        isSeller = true;
      }
    }
    if (!isSeller && order.items && order.items.length > 0) {
      isSeller = order.items.some(item => {
        const itemSellerId = item.seller ? (item.seller._id || item.seller).toString() : '';
        return itemSellerId === userId.toString();
      });
    }

    if (buyerIdStr !== userId.toString() && !isSeller) {
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

  // 💳 Mark As Failed (في حال فشل الدفع)
  async markAsFailed(orderId: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus !== PaymentStatus.UNPAID) {
      throw new BadRequestException('Order already processed');
    }

    order.paymentStatus = PaymentStatus.FAILED;
    order.orderStatus = OrderStatus.CANCELLED;

    await order.save();

    return order;
  }

  // 📦 Complete Order (Any user can complete any order)
  async completeOrder(orderId: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
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
    let isSeller = false;
    if (order.seller && order.seller.toString() === sellerId) {
      isSeller = true;
    } else if (order.items && order.items.length > 0) {
      isSeller = order.items.some(item => item.seller.toString() === sellerId);
    }

    if (!isSeller) {
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

  // 🗑️ Delete Order (Any user can delete any order)
  async remove(orderId: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.orderModel.findByIdAndDelete(orderId);
    return { message: 'Order deleted successfully' };
  }
}