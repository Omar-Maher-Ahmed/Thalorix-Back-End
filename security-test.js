const axios = require('axios');

const BASE_URL = 'http://localhost:5001'; // غيرها لو السيرفر على بورت تاني
const TEST_EMAIL = `test${Date.now()}@test.com`; // ايميل فريد كل مرة
const TEST_PHONE = `+20100${Math.floor(Math.random() * 10000000)}`; // رقم فريد

// الألوان للعرض في الـ terminal
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m'
};

console.log(`${colors.blue}========================================`);
console.log(`🔐 بدء اختبار الاختراق للتطبيق`);
console.log(`========================================${colors.reset}\n`);

// دالة للتسجيل
async function signup(userData) {
    try {
        const response = await axios.post(`${BASE_URL}/api/v1/auth/web/register`, userData);
        return { success: true, data: response.data };
    } catch (error) {
        if (error.response) {
            return { success: false, status: error.response.status, data: error.response.data };
        }
        return { success: false, error: error.message };
    }
}

// اختبار XSS
async function testXSS() {
    console.log(`${colors.yellow}📌 اختبار XSS (Cross-Site Scripting)${colors.reset}`);

    const xssPayloads = [
        {
            name: '<script>alert("XSS")</script>',
            desc: 'Basic script tag',
            shouldFail: true
        },
        {
            name: '<img src=x onerror=alert("XSS")>',
            desc: 'Image with onerror',
            shouldFail: true
        },
        {
            name: '"><script>alert("XSS")</script>',
            desc: 'Breaking out of attribute',
            shouldFail: true
        },
        {
            name: 'javascript:alert("XSS")',
            desc: 'JavaScript protocol',
            shouldFail: true
        },
        {
            name: '<ScRiPt>alert("XSS")</ScRiPt>',
            desc: 'Case insensitive script',
            shouldFail: true
        },
        {
            name: '<<script>script>alert("XSS")</</script>script>',
            desc: 'Nested script tags',
            shouldFail: true
        },
        {
            name: '<body onload=alert("XSS")>',
            desc: 'Body onload event',
            shouldFail: true
        },
        {
            name: '<svg onload=alert("XSS")>',
            desc: 'SVG onload event',
            shouldFail: true
        },
        {
            name: '"><img src=x onerror=alert("XSS")>',
            desc: 'Breaking out of HTML',
            shouldFail: true
        }
    ];

    for (const payload of xssPayloads) {
        const userData = {
            email: `xss${Date.now()}${Math.random()}@test.com`,
            password: "TestPass123$$",
            cPassword: "TestPass123$$",
            name: payload.name,
            phone: `+20100${Math.floor(Math.random() * 10000000)}`,
            role: "user"
        };

        const result = await signup(userData);

        if (result.success) {
            // لو نجح التسجيل، نشوف الاسم اتحفظ زي ما هو ولا اتنضف
            const savedName = result.data.user?.name || 'unknown';
            if (savedName.includes('<script>') || savedName.includes('alert')) {
                console.log(`${colors.red}❌ ${payload.desc}: غير آمن - الاسم اتحفظ: ${savedName}${colors.reset}`);
            } else if (savedName.length < 3) {
                console.log(`${colors.green}✅ ${payload.desc}: آمن - الاسم اتصفر${colors.reset}`);
            } else {
                console.log(`${colors.green}✅ ${payload.desc}: آمن - الاسم اتنضف: ${savedName}${colors.reset}`);
            }
        } else {
            if (result.status === 400 || result.status === 403) {
                console.log(`${colors.green}✅ ${payload.desc}: آمن - مرفوض: ${result.data.message || result.status}${colors.reset}`);
            } else {
                console.log(`${colors.yellow}⚠️ ${payload.desc}: مش متأكد - Status: ${result.status}, ${result.data}${colors.reset}`);
            }
        }
    }
    console.log('');
}

// اختبار NoSQL Injection
async function testNoSQLInjection() {
    console.log(`${colors.yellow}📌 اختبار NoSQL Injection${colors.reset}`);

    const payloads = [
        { field: 'email', value: { '$ne': null } },
        { field: 'email', value: { '$gt': '' } },
        { field: 'email', value: 'test@test.com\' OR 1=1 --' },
        { field: 'password', value: { '$ne': 'wrong' } },
        { field: 'email', value: '{"$regex": ".*"}' }
    ];

    for (const payload of payloads) {
        const userData = {
            email: payload.field === 'email' ? payload.value : `test${Date.now()}@test.com`,
            password: payload.field === 'password' ? payload.value : "TestPass123$$",
            cPassword: "TestPass123$$",
            name: "Test User",
            phone: `+20100${Math.floor(Math.random() * 10000000)}`,
            role: "user"
        };

        if (payload.field === 'email') {
            userData.email = payload.value;
        }
        if (payload.field === 'password') {
            userData.password = payload.value;
        }

        const result = await signup(userData);

        if (result.success) {
            console.log(`${colors.red}❌ NoSQL Injection: نجح مع ${JSON.stringify(payload)}${colors.reset}`);
        } else if (result.status === 400 || result.status === 403) {
            console.log(`${colors.green}✅ NoSQL Injection: مرفوض مع ${JSON.stringify(payload)}${colors.reset}`);
        } else {
            console.log(`${colors.yellow}⚠️ NoSQL Injection: Status ${result.status} مع ${JSON.stringify(payload)}${colors.reset}`);
        }
    }
    console.log('');
}

// اختبار Mass Assignment
async function testMassAssignment() {
    console.log(`${colors.yellow}📌 اختبار Mass Assignment (حقن حقول ممنوعة)${colors.reset}`);

    const extraFields = [
        { field: 'isAdmin', value: true },
        { field: 'isVerified', value: true },
        { field: 'role', value: 'admin' },
        { field: '_id', value: '12345' },
        { field: '__v', value: 0 },
        { field: 'createdAt', value: new Date() },
        { field: 'password', value: 'hacked123' }, // محاولة تغيير الباسورد
        { field: 'verificationToken', value: null }
    ];

    for (const extra of extraFields) {
        const userData = {
            email: `mass${Date.now()}${Math.random()}@test.com`,
            password: "TestPass123$$",
            cPassword: "TestPass123$$",
            name: "Test User",
            phone: `+20100${Math.floor(Math.random() * 10000000)}`,
            role: "user",
            [extra.field]: extra.value
        };

        const result = await signup(userData);

        if (result.success) {
            if (result.data.user && result.data.user[extra.field] === extra.value) {
                console.log(`${colors.red}❌ Mass Assignment: الحقل ${extra.field} اتحفظ بقيمة ${extra.value}${colors.reset}`);
            } else {
                console.log(`${colors.green}✅ Mass Assignment: الحقل ${extra.field} مرفوض${colors.reset}`);
            }
        } else if (result.status === 400) {
            console.log(`${colors.green}✅ Mass Assignment: مرفوض مع ${extra.field}${colors.reset}`);
        } else {
            console.log(`${colors.yellow}⚠️ Mass Assignment: Status ${result.status} مع ${extra.field}${colors.reset}`);
        }
    }
    console.log('');
}

// اختبار Validation Bypass
async function testValidationBypass() {
    console.log(`${colors.yellow}📌 اختبار التحايل على الفاليديشن${colors.reset}`);

    const testCases = [
        { desc: 'ضعف كلمة السر', data: { password: '123', cPassword: '123' } },
        { desc: 'ايميل غلط', data: { email: 'not-an-email' } },
        { desc: 'رقم تليفون غلط', data: { phone: '123' } },
        { desc: 'اسم طويل جداً', data: { name: 'a'.repeat(200) } },
        { desc: 'اسم قصير', data: { name: 'a' } },
        { desc: 'باسورد غير متطابق', data: { password: 'Pass123$$', cPassword: 'Different123$$' } },
        { desc: 'دور غير صحيح', data: { role: 'superadmin' } }
    ];

    for (const testCase of testCases) {
        const userData = {
            email: testCase.data.email || `valid${Date.now()}@test.com`,
            password: testCase.data.password || "ValidPass123$$",
            cPassword: testCase.data.cPassword || "ValidPass123$$",
            name: testCase.data.name || "Valid Name",
            phone: testCase.data.phone || "+201006667788",
            role: testCase.data.role || "user",
            ...testCase.data
        };

        const result = await signup(userData);

        if (result.success) {
            console.log(`${colors.red}❌ ${testCase.desc}: الفاليديشن فشل - اتسجل غلط${colors.reset}`);
        } else if (result.status === 400) {
            console.log(`${colors.green}✅ ${testCase.desc}: الفاليديشن شغال - ${result.data.message}${colors.reset}`);
        } else {
            console.log(`${colors.yellow}⚠️ ${testCase.desc}: Status ${result.status}${colors.reset}`);
        }
    }
    console.log('');
}

// تشغيل كل الاختبارات
async function runTests() {
    console.log(`${colors.blue}🚀 بدء الاختبارات على ${BASE_URL}${colors.reset}\n`);

    await testXSS();
    await testNoSQLInjection();
    await testMassAssignment();
    await testValidationBypass();

    console.log(`${colors.blue}========================================`);
    console.log(`✅ انتهت الاختبارات`);
    console.log(`========================================${colors.reset}`);
}

runTests().catch(console.error);