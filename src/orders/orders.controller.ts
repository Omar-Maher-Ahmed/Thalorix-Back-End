import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/enums/roles.enum';
import { Role } from 'src/auth/decorators/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Controller('orders')
@UseGuards(AccessTokenGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 🛒 Create Order (Buyer)
  @Post()
  create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(req.user.userId, createOrderDto);
  }

  // 📦 Get My Orders (Buyer)
  @Get('my-orders')
  findMyOrders(@Request() req) {
    return this.ordersService.findUserOrders(req.user.userId);
  }

  // 🔍 Get Single Order (Buyer أو Seller)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.ordersService.findOne(id, req.user.userId);
  }

  // ✅ Complete Order (Seller only)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Role(Roles.Seller)
  @Patch(':id/complete')
  completeOrder(@Param('id') id: string, @Request() req) {
    return this.ordersService.completeOrder(id, req.user.userId);
  }

  // 💸 Refund Order (Seller only)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Role(Roles.Seller)
  @Patch(':id/refund')
  refundOrder(@Param('id') id: string, @Request() req) {
    return this.ordersService.refundOrder(id, req.user.userId);
  }
}