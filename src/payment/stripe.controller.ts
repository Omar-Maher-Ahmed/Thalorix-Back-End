import {
    Controller,
    Post,
    Body,
    Headers,
    Req,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { StripeService } from './stripe.service';
import { CreateCheckoutSessionDto } from './dtos/create-checkout-session.dto';

@Controller('stripe')
export class StripeController {
    constructor(private stripeService: StripeService) { }

    @Post('create-checkout-session')
    async createCheckoutSession(@Body() createCheckoutDto: CreateCheckoutSessionDto) {
        const session = await this.stripeService.createCheckoutSession(
            createCheckoutDto.items,
            createCheckoutDto.customerEmail,
        );

        return {
            sessionId: session.id,
            url: session.url,
        };
    }

    @Post('webhook')
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

                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }

            return { received: true };
        } catch (error) {
            throw new Error(`Webhook Error: ${error.message}`);
        }
    }

    private async handleCheckoutSessionCompleted(session: any) {
        // هنا بقى الشغل الكبير
        // 1. تخزين الـ transaction في الداتابيز
        // 2. تحديث حالة الـ order
        // 3. إرسال إيميل تأكيد
        // 4. تفعيل الخدمة للمستخدم
        console.log('Payment successful for session:', session.id);
        console.log('Customer email:', session.customer_details?.email);
        console.log('Amount:', session.amount_total / 100, session.currency);
    }

    private async handleInvoicePaymentSucceeded(invoice: any) {
        // للاشتراكات الشهرية/السنوية
        console.log('Subscription payment succeeded:', invoice.subscription);
    }

    private async handlePaymentIntentSucceeded(paymentIntent: any) {
        // لو بتستخدم Payment Intents API مباشرة
        console.log('Payment intent succeeded:', paymentIntent.id);
    }
}