# تقرير هيكل البيانات وطلبات الـ API (Schema & Requests Report)

هذا التقرير يوضح تفاصيل الـ Schemas (قواعد البيانات) وشكل الـ Body في طلبات الـ API (DTOs) لكل موديول في مشروع Thalorix.

---

## 1. موديول المسؤولين (Admin Module)

### أ. هيكل قاعدة البيانات (Admin Schema)
يتم تخزين بيانات المسؤولين في مجموعة `admin`.

| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `name` | String | اسم المسؤول (يجب أن يحتوي على حروف فقط). |
| `email` | String | البريد الإلكتروني (فريد، أحرف صغيرة). |
| `phone` | String | رقم الهاتف (فريد). |
| `password` | String | كلمة المرور (مخفية في الاستعلامات). |
| `role` | Enum | الدور (القيمة الافتراضية: `admin`). |
| `isVerified` | Boolean | حالة تفعيل الحساب. |
| `isBlocked` | Boolean | هل الحساب محظور؟ |
| `tokenVersion` | Number | إصدار التوكن (لإلغاء جميع الجلسات). |

### ب. طلبات الـ API (Request Bodies)

#### إنشاء مسؤول جديد (Create Admin)
```json
{
  "name": "John Doe",
  "email": "admin@example.com",
  "phone": "+1234567890",
  "password": "StrongP@ssw0rd"
}
```

#### تسجيل الدخول (Login Admin)
```json
{
  "email": "admin@example.com",
  "password": "StrongP@ssw0rd"
}
```

---

## 2. موديول الذكاء الاصطناعي (AI Module)

### أ. هيكل قاعدة البيانات (Project Schema)
يخزن المشاريع التي يتم إنشاؤها بواسطة الذكاء الاصطناعي في `ai_projects`.

| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `sessionId` | String | معرف الجلسة مع API الذكاء الاصطناعي. |
| `status` | Enum | حالة المشروع (`building`, `completed`, `failed`). |
| `previewUrl` | String | رابط معاينة المشروع المباشر. |
| `files` | Array | قائمة الملفات المنشأة (المسار، المحتوى، اللغة). |
| `stack` | String | التقنية المستخدمة (مثلاً: `React 18+ Vite`). |
| `userId` | ObjectId | معرف المستخدم صاحب المشروع. |

### ب. طلبات الـ API (Request Bodies)

#### إنشاء مشروع جديد (Create Project)
```json
{
  "prompt": "Build a full-stack todo app with React 18+ Vite",
  "stack": "React 18+ Vite",
  "userId": "665f9c3b1e4b2a001f000001"
}
```

#### تعديل مشروع موجود (Edit Project)
```json
{
  "prompt": "Add a dark mode toggle to the header"
}
```

---

## 3. موديول المصادقة (Auth Module)

### ب. طلبات الـ API (Request Bodies)

#### إنشاء حساب (Sign Up)
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "phone": "+1234567890",
  "password": "StrongP@ssw0rd",
  "cPassword": "StrongP@ssw0rd"
}
```

#### نسيت كلمة المرور (Forgot Password)
```json
{
  "email": "user@example.com" 
  // أو
  // "phone": "+1234567890"
}
```

#### إعادة تعيين كلمة المرور (Reset Password)
```json
{
  "email": "user@example.com",
  "code": "482931",
  "newPassword": "NewP@ssw0rd!"
}
```

---

## 4. موديول التصنيفات (Categories Module)

### أ. هيكل قاعدة البيانات (Category Schema)
| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `name` | String | اسم التصنيف. |
| `slug` | String | رابط فريد للتصنيف. |
| `marketplaceId` | ObjectId | معرف المتجر المرتبط. |
| `parentId` | ObjectId | معرف التصنيف الأب (للتصنيفات الفرعية). |

### ب. طلبات الـ API (Request Bodies)

#### إنشاء تصنيف (Create Category)
```json
{
  "name": "Electronics",
  "marketplaceId": "60d5ecb8b392d7001f8e8e30",
  "parentId": "60d5ecb8b392d7001f8e8e31"
}
```

---

## 5. موديول الدردشة (Chat Module)

### أ. هيكل قاعدة البيانات
1. **المحادثات (Conversation)**: تخزن المشاركين (`participants`) وآخر رسالة.
2. **الرسائل (Message)**: تخزن المرسل، المستقبل، المحتوى، وحالة القراءة.

### ب. طلبات الـ API

#### إرسال رسالة (Send Message)
```json
{
  "receiverId": "60d5ecb8b392d7001f8e8e30",
  "content": "Hello, how are you?"
}
```

---

## 6. موديول المجتمع (Community Module)

### أ. هيكل قاعدة البيانات
1. **المنشورات (Post)**: تخزن `userId`, `content`, `image`, `likesCount`, `commentsCount`.
2. **التعليقات (Comment)**: تخزن `postId`, `userId`, `content`.

### ب. طلبات الـ API

#### إنشاء منشور (Create Post)
```json
{
  "content": "Hello World!",
  "userId": "60d5ecb8b392d7001f8e8e30",
  "image": "https://example.com/image.jpg"
}
```

---

## 7. موديول المتجر (Market Place Module)

### أ. هيكل قاعدة البيانات (MarketPlace Schema)
| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `name` | String | اسم المنتج. |
| `price` | Number | السعر. |
| `images` | Array | روابط الصور. |
| `templateId` | ObjectId | القالب المرتبط بالمنتج. |
| `owner` | ObjectId | صاحب المنتج. |
| `stockCount` | Number | الكمية المتاحة. |

### ب. طلبات الـ API

#### إضافة منتج للمتجر (Create Market Item)
```json
{
  "name": "Web Template",
  "description": "A highly customizable web template",
  "price": 49.99,
  "templateId": "60d5ecb8b392d7001f8e8e30",
  "currency": "USD",
  "images": ["https://example.com/img1.jpg"],
  "category": "60d5ecb8b392d7001f8e8e31"
}
```

---

## 8. موديول الطلبات (Orders Module)

### أ. هيكل قاعدة البيانات (Order Schema)
| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `buyer` | ObjectId | المشتري. |
| `seller` | ObjectId | البائع. |
| `template` | ObjectId | القالب المطلوب. |
| `price` | Number | السعر وقت الشراء. |
| `orderStatus` | Enum | حالة الطلب (`pending`, `processing`, `completed`, `cancelled`). |
| `paymentStatus` | Enum | حالة الدفع (`unpaid`, `paid`, `failed`). |

### ب. طلبات الـ API

#### إنشاء طلب (Create Order)
```json
{
  "templateId": "60d5ecb8b392d7001f8e8e30",
  "quantity": 1
}
```

---

## 9. موديول أكواد التحقق (OTP Module)

### أ. هيكل قاعدة البيانات (Otp Schema)
تخزن الأكواد المشفرة (`hashedCode`) مع وقت الانتهاء والنوع (`email_verification`, `password_reset`, إلخ).

### ب. طلبات الـ API

#### طلب كود تحقق (Request OTP)
```json
{
  "type": "email_verification",
  "email": "user@example.com",
  "name": "John Doe"
}
```

---

## 10. موديول القوالب (Templates Module)

### أ. هيكل قاعدة البيانات (Template Schema)
| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `title` | String | عنوان القالب. |
| `price` | Number | السعر. |
| `seller` | ObjectId | البائع. |
| `category` | ObjectId | التصنيف. |

### ب. طلبات الـ API

#### إنشاء قالب (Create Template)
```json
{
  "name": "E-commerce Theme",
  "description": "Professional theme for stores",
  "price": 29.99,
  "marketplaceId": "60d5ecb8b392d7001f8e8e30",
  "categoryId": "60d5ecb8b392d7001f8e8e31"
}
```

---

## 11. موديول المستخدمين (Users Module)

### أ. هيكل قاعدة البيانات (User Schema)
مشابه لهيكل الـ Admin ولكن مع أدوار مختلفة (`User`, `Seller`).

### ب. طلبات الـ API

#### استعلام عن مستخدمين (Query Users)
تستخدم غالباً في الـ Admin Panel.
```json
{
  "limit": 10,
  "page": 1
}
```

---

## ملاحظات عامة:
- جميع الـ Schemas تحتوي على `timestamps` تلقائياً (تاريخ الإنشاء والتعديل).
- الحقول التي تنتهي بـ `Id` هي من نوع `ObjectId` وتشير إلى مجموعات أخرى.
- التحقق من البيانات (Validation) يتم باستخدام `class-validator` في الـ DTOs لضمان صحة البيانات المرسلة من العميل.
