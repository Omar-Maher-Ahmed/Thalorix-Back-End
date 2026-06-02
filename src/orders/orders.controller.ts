import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/enums/roles.enum';
import { Role } from 'src/auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
@UseGuards(JwtAuthGuard, AccessTokenGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 🛒 Create Order (Buyer)
  @ApiOperation({ summary: 'Create an order', description: 'Creates a new order (Buyer)' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(req.user.userId, createOrderDto);
  }

  // 📦 Get My Orders (Buyer)
  @ApiOperation({ summary: 'Get my orders', description: 'Retrieves all orders for the currently logged-in buyer' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('my-orders')
  findMyOrders(@Request() req) {
    return this.ordersService.findUserOrders(req.user.userId);
  }

  // 🔍 Get Single Order (Buyer أو Seller)
  @ApiOperation({ summary: 'Get an order by ID', description: 'Retrieves a specific order by ID (Buyer or Seller)' })
  @ApiParam({ name: 'id', description: 'Order ID', type: String })
  @ApiResponse({ status: 200, description: 'Order details retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.ordersService.findOne(id, req.user.userId);
  }

  // ✅ Complete Order (Any user)
  @ApiOperation({ summary: 'Complete an order', description: 'Marks an order as complete (Any user)' })
  @ApiParam({ name: 'id', description: 'Order ID', type: String })
  @ApiResponse({ status: 200, description: 'Order completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Patch(':id/complete')
  completeOrder(@Param('id') id: string) {
    return this.ordersService.completeOrder(id);
  }

  // 💸 Refund Order (Seller only)
  @ApiOperation({ summary: 'Refund an order', description: 'Processes a refund for an order (Seller only)' })
  @ApiParam({ name: 'id', description: 'Order ID', type: String })
  @ApiResponse({ status: 200, description: 'Order refunded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @UseGuards(RolesGuard)
  @Role(Roles.Seller)
  @Patch(':id/refund')
  refundOrder(@Param('id') id: string, @Request() req) {
    return this.ordersService.refundOrder(id, req.user.userId);
  }

  // 🗑️ Delete Order
  @ApiOperation({ summary: 'Delete an order', description: 'Deletes an order (Buyer, Seller or Admin)' })
  @ApiParam({ name: 'id', description: 'Order ID', type: String })
  @ApiResponse({ status: 200, description: 'Order deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.ordersService.remove(id, req.user.userId, req.user.role);
  }
}