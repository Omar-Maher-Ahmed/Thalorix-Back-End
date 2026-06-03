const Stripe = require('stripe');

async function testDirect() {
  const stripe = new Stripe('sk_test_51SzyUcCOd99VflS9r8PSiH8uQQQlxjbdfFKKgjwO85ORZXwydsEOgqqRWjpZ9ANqsBKAWS2aOBVyv0G1fW5PPW5B00wMx7RaGF', {
    apiVersion: '2026-02-25.clover',
  });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'E-commerce Theme',
            },
            unit_amount: 2999, // $29.99 in cents
          },
          quantity: 1,
        }
      ],
      mode: 'payment',
      success_url: 'http://localhost:5000/success',
      cancel_url: 'http://localhost:5000/cancel',
      customer_email: 'pay_tester_123@test.com',
      metadata: { orderId: '6a20701de7222f8b6a80a2a7' }
    });

    console.log('✅ Direct Stripe Session Created:', session.url);
  } catch (err) {
    console.error('❌ Direct Stripe Error:', err.message);
    if (err.raw) {
      console.error('Raw Error:', err.raw);
    }
  }
}

testDirect();
