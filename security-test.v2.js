const axios = require('axios');
const https = require('https');

const BASE_URL = 'http://localhost:5001/api/v1/auth';
const axiosInstance = axios.create({
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    timeout: 5000
});

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

console.log(`${colors.blue}╔════════════════════════════════════════╗`);
console.log(`║   🔐 اختبار الاختراق الشامل للتطبيق   ║`);
console.log(`╚════════════════════════════════════════╝${colors.reset}\n`);

// Helper function
async function signup(userData) {
    try {
        const response = await axiosInstance.post(`${BASE_URL}/web/register`, userData);
        return { success: true, status: response.status, data: response.data };
    } catch (error) {
        if (error.response) {
            return { success: false, status: error.response.status, data: error.response.data };
        }
        return { success: false, error: error.message };
    }
}

async function login(credentials) {
    try {
        const response = await axiosInstance.post(`${BASE_URL}/web/login`, credentials);
        return { success: true, status: response.status, data: response.data };
    } catch (error) {
        if (error.response) {
            return { success: false, status: error.response.status, data: error.response.data };
        }
        return { success: false, error: error.message };
    }
}

// 1. XSS المتقدم
async function testAdvancedXSS() {
    console.log(`${colors.cyan}📌 1. اختبار XSS المتقدم (15 نوع)${colors.reset}`);

    const xssPayloads = [
        // Basic XSS
        { name: '<script>alert("XSS")</script>', desc: 'Script tag' },
        { name: '<img src=x onerror=alert("XSS")>', desc: 'Image onerror' },
        { name: '"><script>alert("XSS")</script>', desc: 'Breaking attribute' },

        // Advanced XSS
        { name: '<ScRiPt>alert("XSS")</ScRiPt>', desc: 'Case insensitive' },
        { name: '<<script>script>alert("XSS")<</script>/script>', desc: 'Nested scripts' },
        { name: '<img src="javascript:alert(\'XSS\')">', desc: 'JavaScript in src' },
        { name: '<body onload=alert("XSS")>', desc: 'Body onload' },
        { name: '<svg onload=alert("XSS")>', desc: 'SVG onload' },
        { name: '<iframe src="javascript:alert(\'XSS\')">', desc: 'Iframe JS' },

        // Unicode/Encoding XSS
        { name: '\\u003cscript\\u003ealert("XSS")\\u003c/script\\u003e', desc: 'Unicode encoding' },
        { name: '&#x3C;script&#x3E;alert("XSS")&#x3C;/script&#x3E;', desc: 'HTML entities' },
        { name: '%3Cscript%3Ealert("XSS")%3C/script%3E', desc: 'URL encoding' },

        // Event handlers
        { name: '<div onmouseover="alert(\'XSS\')">Hover me</div>', desc: 'Mouse event' },
        { name: '<input onfocus="alert(\'XSS\')" autofocus>', desc: 'Focus event' },
        { name: '<form onsubmit="alert(\'XSS\')">', desc: 'Form event' },

        // CSS XSS
        { name: '<style>body { background: url("javascript:alert(\'XSS\')") }</style>', desc: 'CSS JS' },
        { name: '<div style="width: expression(alert(\'XSS\'));">', desc: 'CSS expression' }
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
            console.log(`${colors.red}❌ ${payload.desc}: غير آمن - اتقبل${colors.reset}`);
        } else if (result.status === 400 || result.status === 403) {
            console.log(`${colors.green}✅ ${payload.desc}: آمن - مرفوض${colors.reset}`);
        } else {
            console.log(`${colors.yellow}⚠️ ${payload.desc}: Status ${result.status}${colors.reset}`);
        }
    }
    console.log('');
}

// 2. SQL/NoSQL Injection المتقدم
async function testAdvancedInjection() {
    console.log(`${colors.cyan}📌 2. اختبار Injection المتقدم (20 نوع)${colors.reset}`);

    const payloads = [
        // MongoDB operators
        { field: 'email', value: { '$ne': null }, desc: '$ne operator' },
        { field: 'email', value: { '$gt': '' }, desc: '$gt operator' },
        { field: 'password', value: { '$regex': '.*' }, desc: '$regex operator' },
        { field: 'email', value: { '$where': 'function() { return true }' }, desc: '$where JS' },

        // Array injection
        { field: 'email', value: ['admin@test.com'], desc: 'Array injection' },
        { field: 'password', value: ['password', { '$ne': '' }], desc: 'Mixed array' },

        // Logical operators
        { field: 'email', value: { '$or': [{ 'email': 'admin' }, { 'password': 'hacked' }] }, desc: '$or injection' },
        { field: 'email', value: { '$and': [{ 'email': 'admin' }, { 'password': { '$ne': '' } }] }, desc: '$and injection' },

        // SQL style
        { field: 'email', value: "' OR '1'='1", desc: 'SQL classic' },
        { field: 'email', value: "admin'--", desc: 'SQL comment' },
        { field: 'email', value: "'; DROP TABLE users; --", desc: 'SQL drop table' },
        { field: 'email', value: "' UNION SELECT * FROM users --", desc: 'SQL union' },

        // NoSQL special
        { field: 'email', value: { '$func': 'var x = 1' }, desc: 'Custom function' },
        { field: 'email', value: { '$eval': 'return true' }, desc: '$eval injection' },
        { field: 'email', value: { '$cmd': 'find' }, desc: '$cmd injection' },

        // JSON injection
        { field: 'email', value: '{"$ne": null}', desc: 'JSON string' },
        { field: 'email', value: '{"$regex": "^.*$"}', desc: 'JSON regex' },

        // Multiple fields
        { field: 'email', value: 'test@test.com', extra: { 'password': { '$ne': '' } }, desc: 'Multi-field' },

        // Null bytes
        { field: 'email', value: 'admin@test.com\0', desc: 'Null byte' },
        { field: 'password', value: 'password\0extra', desc: 'Null byte in password' }
    ];

    for (const payload of payloads) {
        const userData = {
            email: "test@test.com",
            password: "TestPass123$$",
            cPassword: "TestPass123$$",
            name: "Test User",
            phone: "+201006667788",
            role: "user"
        };

        if (payload.field === 'email') userData.email = payload.value;
        if (payload.field === 'password') userData.password = payload.value;
        if (payload.extra) Object.assign(userData, payload.extra);

        const result = await signup(userData);

        if (result.success) {
            console.log(`${colors.red}❌ ${payload.desc}: غير آمن - نجح${colors.reset}`);
        } else if (result.status === 400 || result.status === 403) {
            console.log(`${colors.green}✅ ${payload.desc}: آمن - مرفوض${colors.reset}`);
        } else {
            console.log(`${colors.yellow}⚠️ ${payload.desc}: Status ${result.status}${colors.reset}`);
        }
    }
    console.log('');
}

// 3. Authentication & Authorization
async function testAuthSecurity() {
    console.log(`${colors.cyan}📌 3. اختبار الأمان في المصادقة والصلاحيات${colors.reset}`);

    // Create test user first
    const testUser = {
        email: `auth${Date.now()}@test.com`,
        password: "TestPass123$$",
        cPassword: "TestPass123$$",
        name: "Auth Test User",
        phone: `+20100${Math.floor(Math.random() * 10000000)}`,
        role: "user"
    };

    await signup(testUser);

    // Test cases
    const tests = [
        { desc: 'Login with wrong password', creds: { email: testUser.email, password: 'wrong' }, should: 401 },
        { desc: 'Login with non-existent email', creds: { email: 'nonexistent@test.com', password: 'test' }, should: 401 },
        { desc: 'Empty email', creds: { email: '', password: 'test' }, should: 400 },
        { desc: 'Empty password', creds: { email: testUser.email, password: '' }, should: 400 },
        { desc: 'SQL injection in login', creds: { email: "' OR '1'='1", password: 'anything' }, should: 401 },
        { desc: 'NoSQL injection in login', creds: { email: { '$ne': null }, password: 'anything' }, should: 401 },
        { desc: 'Long email', creds: { email: 'a'.repeat(300) + '@test.com', password: 'test' }, should: 400 },
        { desc: 'Long password', creds: { email: testUser.email, password: 'a'.repeat(200) }, should: 400 },
        { desc: 'Special chars in email', creds: { email: 'test<>()@test.com', password: 'test' }, should: 400 },
        { desc: 'Login with extra fields', creds: { email: testUser.email, password: testUser.password, admin: true }, should: 200 }
    ];

    for (const test of tests) {
        const result = await login(test.creds);

        if (result.status === test.should) {
            console.log(`${colors.green}✅ ${test.desc}: متوقع ${test.should} - جاب ${result.status}${colors.reset}`);
        } else {
            console.log(`${colors.red}❌ ${test.desc}: غير متوقع - جاب ${result.status} والمفروض ${test.should}${colors.reset}`);
        }
    }
    console.log('');
}

// 4. Rate Limiting & Brute Force
async function testRateLimiting() {
    console.log(`${colors.cyan}📌 4. اختبار Rate Limiting والحماية من التكرار${colors.reset}`);

    const testUser = {
        email: `rate${Date.now()}@test.com`,
        password: "TestPass123$$",
        phone: `+20100${Math.floor(Math.random() * 10000000)}`
    };

    console.log('محاولة تسجيل دخول فاشلة 20 مرة متتالية...');

    let successCount = 0;
    let blockCount = 0;

    for (let i = 0; i < 20; i++) {
        const result = await login({
            email: testUser.email,
            password: 'wrongpassword'
        });

        if (result.status === 429) {
            blockCount++;
            console.log(`${colors.yellow}⏱️  المحاولة ${i + 1}: تم الحظر (Rate limit)${colors.reset}`);
        } else if (result.status === 401) {
            successCount++;
            console.log(`${colors.blue}ℹ️  المحاولة ${i + 1}: مرفوض (401)${colors.reset}`);
        }

        // Delay between attempts
        await new Promise(r => setTimeout(r, 100));
    }

    if (blockCount > 0) {
        console.log(`${colors.green}✅ Rate limiting شغال - اتحظر بعد ${successCount} محاولة${colors.reset}`);
    } else {
        console.log(`${colors.red}❌ Rate limiting مش شغال - كل المحاولات اترفضت بدون حظر${colors.reset}`);
    }
    console.log('');
}

// 5. JWT Security
async function testJWTSecurity() {
    console.log(`${colors.cyan}📌 5. اختبار أمان JWT${colors.reset}`);

    // Login first to get token
    const testUser = {
        email: `jwt${Date.now()}@test.com`,
        password: "TestPass123$$",
        cPassword: "TestPass123$$",
        name: "JWT Test",
        phone: `+20100${Math.floor(Math.random() * 10000000)}`,
        role: "user"
    };

    await signup(testUser);

    const loginResult = await login({
        email: testUser.email,
        password: testUser.password
    });

    if (loginResult.success && loginResult.data.access_token) {
        const token = loginResult.data.access_token;

        const jwtTests = [
            { desc: 'Valid token', token: token, should: 200 },
            { desc: 'Expired token', token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMze6x9n8b7xhE9k1Q5vX9Kw', should: 401 },
            { desc: 'Tampered token', token: token.slice(0, -5) + 'xxxxx', should: 401 },
            { desc: 'Empty token', token: '', should: 401 },
            { desc: 'Bearer missing', token: 'Bearer ' + token, should: 200 }, // Some APIs expect Bearer
            { desc: 'Wrong algorithm', token: token.replace('HS256', 'none'), should: 401 },
            { desc: 'Very long token', token: 'a'.repeat(5000), should: 401 }
        ];

        for (const test of jwtTests) {
            try {
                const response = await axiosInstance.get(`${BASE_URL}/auth/profile`, {
                    headers: { Authorization: `Bearer ${test.token}` }
                });

                if (test.should === 200) {
                    console.log(`${colors.green}✅ ${test.desc}: آمن - Status ${response.status}${colors.reset}`);
                } else {
                    console.log(`${colors.red}❌ ${test.desc}: غير آمن - اتقبل والمفروض ${test.should}${colors.reset}`);
                }
            } catch (error) {
                const status = error.response?.status;
                if (status === test.should) {
                    console.log(`${colors.green}✅ ${test.desc}: آمن - Status ${status}${colors.reset}`);
                } else {
                    console.log(`${colors.red}❌ ${test.desc}: مشكلة - Status ${status} والمفروض ${test.should}${colors.reset}`);
                }
            }
        }
    } else {
        console.log(`${colors.red}❌ مشكلة في الـ login${colors.reset}`);
    }
    console.log('');
}

// 6. Business Logic Flaws
async function testBusinessLogic() {
    console.log(`${colors.cyan}📌 6. اختبار الثغرات المنطقية${colors.reset}`);

    const tests = [
        {
            desc: 'تسجيل بنفس الايميل مرتين',
            fn: async () => {
                const email = `dup${Date.now()}@test.com`;
                const userData = {
                    email, password: "TestPass123$$", cPassword: "TestPass123$$",
                    name: "Test", phone: `+20100${Math.floor(Math.random() * 10000000)}`, role: "user"
                };
                await signup(userData);
                return await signup(userData);
            },
            should: 409
        },
        {
            desc: 'تسجيل برقم تليفون مكرر',
            fn: async () => {
                const phone = `+20100${Math.floor(Math.random() * 10000000)}`;
                const user1 = {
                    email: `dup1${Date.now()}@test.com`, password: "TestPass123$$", cPassword: "TestPass123$$",
                    name: "Test1", phone, role: "user"
                };
                const user2 = {
                    email: `dup2${Date.now()}@test.com`, password: "TestPass123$$", cPassword: "TestPass123$$",
                    name: "Test2", phone, role: "user"
                };
                await signup(user1);
                return await signup(user2);
            },
            should: 409
        },
        {
            desc: 'تسجيل بدون دور (default role)',
            fn: async () => {
                const userData = {
                    email: `nodef${Date.now()}@test.com`, password: "TestPass123$$", cPassword: "TestPass123$$",
                    name: "Test", phone: `+20100${Math.floor(Math.random() * 10000000)}`
                };
                return await signup(userData);
            },
            should: 201
        },
        {
            desc: 'باسورد ضعيف جداً',
            fn: async () => {
                const userData = {
                    email: `weak${Date.now()}@test.com`, password: "123", cPassword: "123",
                    name: "Test", phone: `+20100${Math.floor(Math.random() * 10000000)}`, role: "user"
                };
                return await signup(userData);
            },
            should: 400
        }
    ];

    for (const test of tests) {
        const result = await test.fn();
        if (result.status === test.should) {
            console.log(`${colors.green}✅ ${test.desc}: متوقع ${test.should} - جاب ${result.status}${colors.reset}`);
        } else {
            console.log(`${colors.red}❌ ${test.desc}: مشكلة - جاب ${result.status} والمفروض ${test.should}${colors.reset}`);
        }
    }
    console.log('');
}

// 7. Headers Security
async function testSecurityHeaders() {
    console.log(`${colors.cyan}📌 7. اختبار رؤوس الأمان (Security Headers)${colors.reset}`);

    try {
        const response = await axiosInstance.get(`${BASE_URL}/`);
        const headers = response.headers;

        const requiredHeaders = [
            'x-frame-options',
            'x-content-type-options',
            'x-xss-protection',
            'strict-transport-security',
            'content-security-policy',
            'referrer-policy',
            'cache-control'
        ];

        for (const header of requiredHeaders) {
            if (headers[header]) {
                console.log(`${colors.green}✅ ${header}: موجود - ${headers[header]}${colors.reset}`);
            } else {
                console.log(`${colors.yellow}⚠️ ${header}: مش موجود${colors.reset}`);
            }
        }
    } catch (error) {
        console.log(`${colors.yellow}⚠️ مشكلة في جلب الـ headers${colors.reset}`);
    }
    console.log('');
}

// Run all tests
async function runAllTests() {
    console.log(`${colors.blue}بدء مجموعة الاختبارات المتقدمة...\n${colors.reset}`);

    await testAdvancedXSS();
    await testAdvancedInjection();
    await testAuthSecurity();
    await testRateLimiting();
    await testJWTSecurity();
    await testBusinessLogic();
    await testSecurityHeaders();

    console.log(`${colors.green}╔════════════════════════════════════════╗`);
    console.log(`║   ✅ جميع الاختبارات اكتملت!          ║`);
    console.log(`╚════════════════════════════════════════╝${colors.reset}`);
}

runAllTests().catch(console.error);