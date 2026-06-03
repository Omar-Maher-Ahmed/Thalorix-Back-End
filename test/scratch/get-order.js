const fs = require('fs');
const axios = require('axios');

const envContent = fs.readFileSync('.env', 'utf8');
const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim().replace(/['"]/g, '') : null;
};

const PORT = getEnvVar('PORT') || 5000;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

// Let's use the login details to get a token and call GET /orders/:id
async function run() {
  const testEmail = 'pay_tester_1717438611849@test.com'; // Use a previously registered email or run login
  // We can just register a new one to be fresh
  const uniqueId = Date.now();
  const email = `test_get_${uniqueId}@test.com`;
  const password = 'Pass123$$';
  const phone = `+20102${Math.floor(Math.random() * 10000000)}`;

  try {
    // 1. Register
    const reg = await axios.post(`${BASE_URL}/auth/web/register`, {
      name: 'Get Order Tester',
      email,
      phone,
      password,
      cPassword: password
    });
    const otp = reg.data.otp;

    // 2. Verify
    await axios.post(`${BASE_URL}/otp/verify`, { email, code: otp });

    // 3. Login
    const login = await axios.post(`${BASE_URL}/auth/web/login`, { email, password });
    const token = login.data.accessToken;

    // 4. Create an order to get a valid orderId
    // Let's find any template first
    const mongoose = require('mongoose');
    await mongoose.connect(getEnvVar('MONGODB_URI'));
    const template = await mongoose.connection.db.collection('templates').findOne({ isActive: true });
    await mongoose.disconnect();

    const orderRes = await axios.post(`${BASE_URL}/orders`, {
      templateId: template._id.toString(),
      quantity: 1
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const orderId = orderRes.data._id;
    console.log('✅ Created Order ID:', orderId);

    // 5. Call GET /orders/:id
    console.log(`Calling GET /orders/${orderId}...`);
    const getRes = await axios.get(`${BASE_URL}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ GET Order Response Status:', getRes.status);
    console.log('GET Order Response Data:', getRes.data);

  } catch (err) {
    console.error('❌ Request Failed:', err.response ? JSON.stringify(err.response.data) : err.message);
  }
}

run();
