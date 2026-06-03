import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY')!,
      {
        apiVersion: '2026-02-25.clover',
      },
    );
  }

  async createCheckoutSession(
    items: any[],
    customerEmail?: string,
    orderId?: string,
    successUrl?: string,
    cancelUrl?: string,
  ) {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: item.images ? [item.images] : undefined,
          },
          unit_amount: item.amount,
        },
        quantity: item.quantity || 1,
      })),
      mode: 'payment',
      success_url: successUrl || this.configService.get('FRONTEND_SUCCESS_URL'),
      cancel_url: cancelUrl || this.configService.get('FRONTEND_CANCEL_URL'),
      customer_email: customerEmail,
      metadata: orderId ? { orderId } : undefined,
    });

    return session;
  }

  async constructEventFromPayload(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');

    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }
}