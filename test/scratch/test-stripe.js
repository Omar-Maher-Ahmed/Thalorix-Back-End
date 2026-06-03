const fs = require('fs');
const axios = require('axios');
const mongoose = require('mongoose');

// 1. Read .env file to get variables
const envContent = fs.readFileSync('.env', 'utf8');
const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim().replace(/['"]/g, '') : null;
};

const MONGODB_URI = getEnvVar('MONGODB_URI');
const PORT = getEnvVar('PORT') || 5000;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function run() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB!');

  // Define minimal Mongoose models to verify/seed data
  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    phone: String,
    role: String,
    isVerified: { type: Boolean, default: false }
  }, { strict: false }));

  const Template = mongoose.models.Template || mongoose.model('Template', new mongoose.Schema({
    title: String,
    price: Number,
    isActive: Boolean,
    developerId: mongoose.Schema.Types.ObjectId,
    categoryId: mongoose.Schema.Types.ObjectId
  }, { strict: false }));

  const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({
    name: String
  }, { strict: false }));

  // Find or create category
  let category = await Category.findOne();
  if (!category) {
    category = await Category.create({ name: 'Development Templates' });
  }

  // Find or create seller (developer)
  let seller = await User.findOne({ role: 'seller' });
  if (!seller) {
    seller = await User.create({
      name: 'Developer Seller',
      email: `seller_${Date.now()}@test.com`,
      phone: `+20100${Math.floor(Math.random() * 10000000)}`,
      role: 'seller',
      isVerified: true
    });
  }

  // Find or create an active template
  let template = await Template.findOne({ isActive: true });
  if (!template) {
    template = await Template.create({
      title: 'Thalorix Premium Dashboard',
      description: 'A beautiful dashboard template for developers.',
      price: 29.99,
      fileUrl: 'https://example.com/template-file.zip',
      developerId: seller._id,
      categoryId: category._id,
      isActive: true,
      status: 'Approved'
    });
  }

  console.log(`📦 Using Template: "${template.title}" | Price: $${template.price}`);

  // Test User credentials
  const testEmail = `pay_tester_${Date.now()}@test.com`;
  const testPassword = 'Pass123$$';
  const testPhone = `+2010${Math.floor(10000000 + Math.random() * 90000000)}`;

  console.log('\n=========================================');
  console.log('🧪 Step 1: Registering Test User via HTTP...');
  console.log('=========================================');
  
  let registerRes;
  try {
    registerRes = await axios.post(`${BASE_URL}/auth/web/register`, {
      name: 'Payment Tester',
      email: testEmail,
      phone: testPhone,
      password: testPassword,
      cPassword: testPassword
    });
    console.log('✅ Registration requested successfully.');
  } catch (err) {
    console.error('❌ Registration failed:', err.response ? JSON.stringify(err.response.data) : err.message);
    process.exit(1);
  }

  const otpCode = registerRes.data.otp;
  console.log(`🔑 OTP Code received in response: ${otpCode}`);

  console.log('\n=========================================');
  console.log('🧪 Step 2: Verifying OTP via HTTP...');
  console.log('=========================================');
  try {
    await axios.post(`${BASE_URL}/otp/verify`, {
      email: testEmail,
      code: otpCode
    });
    console.log('✅ User account verified successfully!');
  } catch (err) {
    console.error('❌ OTP Verification failed:', err.response ? JSON.stringify(err.response.data) : err.message);
    process.exit(1);
  }

  console.log('\n=========================================');
  console.log('🧪 Step 3: Logging in Test User...');
  console.log('=========================================');
  let loginRes;
  try {
    loginRes = await axios.post(`${BASE_URL}/auth/web/login`, {
      email: testEmail,
      password: testPassword
    });
    console.log('✅ Logged in successfully!');
  } catch (err) {
    console.error('❌ Login failed:', err.response ? JSON.stringify(err.response.data) : err.message);
    process.exit(1);
  }

  const token = loginRes.data.accessToken;
  console.log(`JWT Token: Bearer ${token.substring(0, 30)}...`);

  console.log('\n=========================================');
  console.log('🧪 Step 4: Creating Order...');
  console.log('=========================================');
  let orderRes;
  try {
    orderRes = await axios.post(`${BASE_URL}/orders`, {
      templateId: template._id.toString(),
      quantity: 1
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Order created successfully! ID: ${orderRes.data._id}`);
    console.log(`Total amount: $${orderRes.data.totalAmount}`);
  } catch (err) {
    console.error('❌ Order creation failed:', err.response ? JSON.stringify(err.response.data) : err.message);
    process.exit(1);
  }

  const orderId = orderRes.data._id;

  console.log('\n=========================================');
  console.log('🧪 Step 5: Creating Stripe Checkout Session...');
  console.log('=========================================');
  try {
    const stripeRes = await axios.post(`${BASE_URL}/stripe/create-checkout-session`, {
      orderId: orderId,
      successUrl: `http://localhost:${PORT}/api/v1/orders/${orderId}`,
      cancelUrl: `http://localhost:${PORT}/api/v1/orders/${orderId}`
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('🎉 STRIPE CHECKOUT SESSION CREATED!');
    console.log(`Session ID: ${stripeRes.data.sessionId}`);
    console.log(`Checkout URL: ${stripeRes.data.url}`);
    console.log('\n=========================================');
    console.log('👉 Copy the URL above and open it in a browser to test checkout!');
    console.log('=========================================');

    // Print Postman instructions
    console.log('\n\n📋 POSTMAN TEST DETAILS');
    console.log('-----------------------------------------');
    console.log(`1. Registration: POST ${BASE_URL}/auth/web/register`);
    console.log(`   Body: { "name": "Payment Tester", "email": "${testEmail}", "phone": "${testPhone}", "password": "${testPassword}", "cPassword": "${testPassword}" }`);
    console.log('\n2. OTP Verification: POST ${BASE_URL}/otp/verify');
    console.log(`   Body: { "email": "${testEmail}", "code": "${otpCode}" }`);
    console.log('\n3. Login: POST ${BASE_URL}/auth/web/login');
    console.log(`   Body: { "email": "${testEmail}", "password": "${testPassword}" }`);
    console.log('\n4. Create Order: POST ${BASE_URL}/orders');
    console.log(`   Headers: Authorization: Bearer <token>`);
    console.log(`   Body: { "templateId": "${template._id.toString()}", "quantity": 1 }`);
    console.log('\n5. Stripe Checkout Session: POST ${BASE_URL}/stripe/create-checkout-session');
    console.log(`   Headers: Authorization: Bearer <token>`);
    console.log(`   Body: { "orderId": "<orderId_from_step_4>", "successUrl": "http://localhost:3000/success", "cancelUrl": "http://localhost:3000/cancel" }`);
    console.log('-----------------------------------------');

  } catch (err) {
    console.error('❌ Stripe session creation failed:', err.response ? JSON.stringify(err.response.data) : err.message);
    process.exit(1);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
