import {
    Controller,
    Post,
    Body,
    Headers,
    Req,
    HttpCode,
    HttpStatus,
    UseGuards,
    ForbiddenException,
    BadRequestException
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { StripeService } from './stripe.service';
import { CreateCheckoutSessionDto } from './dtos/create-checkout-session.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from '../orders/orders.service';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { PaymentStatus } from '../orders/schema/order.schema';

@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
    constructor(
        private stripeService: StripeService,
        private ordersService: OrdersService,
    ) { }

    @ApiOperation({ summary: 'Create checkout session', description: 'Creates a new Stripe checkout session' })
    @ApiBearerAuth('access-token')
    @UseGuards(JwtAuthGuard, AccessTokenGuard)
    @ApiBody({ type: CreateCheckoutSessionDto })
    @ApiResponse({ status: 201, description: 'Checkout session created successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @Post('create-checkout-session')
    async createCheckoutSession(@Req() req: any, @Body() createCheckoutDto: CreateCheckoutSessionDto) {
        // 1. Resolve orderIds to process
        const orderIds = createCheckoutDto.orderIds || (createCheckoutDto.orderId ? [createCheckoutDto.orderId] : []);
        if (orderIds.length === 0) {
            throw new BadRequestException('Either orderId or orderIds must be provided');
        }

        const items = [];
        for (const orderId of orderIds) {
            // 2. Fetch order from DB
            const order = await this.ordersService.findOne(orderId, req.user.userId);
            
            // 3. Validate that the logged-in user is the buyer of this order
            const buyerIdStr = order.buyer ? (order.buyer._id || order.buyer).toString() : '';
            if (buyerIdStr !== req.user.userId.toString()) {
                throw new ForbiddenException(`You are not allowed to check out order ${orderId}`);
            }

            // 4. Validate that the order is unpaid
            if (order.paymentStatus !== PaymentStatus.UNPAID) {
                throw new BadRequestException(`Order ${orderId} is already paid`);
            }

            // 5. Construct secure items from order & populated template
            const template = order.template as any;
            if (!template) {
                throw new BadRequestException(`Template details not found in order ${orderId}`);
            }

            items.push({
                name: template.title,
                amount: Math.round(order.price * 100), // convert to cents
                quantity: order.quantity || 1,
                images: template.image ? template.image : undefined,
            });
        }

        // 6. Call service to create session with comma-separated IDs
        const session = await this.stripeService.createCheckoutSession(
            items,
            req.user.email,
            orderIds.join(','),
            createCheckoutDto.successUrl,
            createCheckoutDto.cancelUrl,
        );

        return {
            sessionId: session.id,
            url: session.url,
        };
    }

    @ApiOperation({ summary: 'Handle Stripe Webhook', description: 'Handles webhook events from Stripe' })
    @ApiHeader({ name: 'stripe-signature', description: 'Stripe webhook signature', required: true })
    @ApiResponse({ status: 200, description: 'Webhook handled successfully' })
    @Post(process.env.STRIPE_WEBHOOK_PATH || 'webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('stripe-signature') signature: string,
    ) {
        try {
            if (!req.rawBody) {
                throw new Error('Webhook raw body is missing');
            }

            const event = await this.stripeService.constructEventFromPayload(
                signature,
                req.rawBody,
            );

            switch (event.type) {
                case 'checkout.session.completed':
                    await this.handleCheckoutSessionCompleted(event.data.object);
                    break;

                case 'invoice.payment_succeeded':
                    await this.handleInvoicePaymentSucceeded(event.data.object);
                    break;

                case 'payment_intent.succeeded':
                    await this.handlePaymentIntentSucceeded(event.data.object);
                    break;

                case 'payment_intent.payment_failed':
                    await this.handlePaymentIntentFailed(event.data.object);
                    break;

                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }

            return { received: true };
        } catch (error) {
            throw new Error(`Webhook Error: ${error.message}`);
        }
    }

    private async handleCheckoutSessionCompleted(session: any) {
        const orderIdMetadata = session.metadata?.orderId;
        if (orderIdMetadata) {
            const orderIds = orderIdMetadata.split(',');
            console.log(`Payment successful for orders: ${orderIds.join(', ')}`);
            for (const orderId of orderIds) {
                try {
                    await this.ordersService.markAsPaid(orderId);
                    console.log(`Order ${orderId} marked as PAID`);
                } catch (error) {
                    console.error(`Error marking order ${orderId} as paid:`, error.message);
                }
            }
        } else {
            console.warn('Payment successful but no orderId found in metadata for session:', session.id);
        }
        console.log('Customer email:', session.customer_details?.email);
        console.log('Amount:', session.amount_total / 100, session.currency);
    }

    private async handleInvoicePaymentSucceeded(invoice: any) {
        // للاشتراكات الشهرية/السنوية
        console.log('Subscription payment succeeded:', invoice.subscription);
    }

    private async handlePaymentIntentSucceeded(paymentIntent: any) {
        // لو بتستخدم Payment Intents API مباشرة
        console.log('payment intent succeeded:', paymentIntent.id);
    }

    private async handlePaymentIntentFailed(paymentIntent: any) {
        const orderIdMetadata = paymentIntent.metadata?.orderId;
        if (orderIdMetadata) {
            const orderIds = orderIdMetadata.split(',');
            console.log(`Payment failed for orders: ${orderIds.join(', ')}`);
            for (const orderId of orderIds) {
                try {
                    await this.ordersService.markAsFailed(orderId);
                    console.log(`Order ${orderId} marked as FAILED`);
                } catch (error) {
                    console.error(`Error marking order ${orderId} as failed:`, error.message);
                }
            }
        } else {
            console.warn('Payment failed but no orderId found in metadata for paymentIntent:', paymentIntent.id);
        }
        console.log('Error Message:', paymentIntent.last_payment_error?.message);
    }
}