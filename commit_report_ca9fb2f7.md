# تقرير تفصيلي وشامل عن التغييرات في الكوميت `ca9fb2f777bc3c89e3cf0d82f6db55c174b00045`

مرحباً بك. يحتوي هذا التقرير على تفاصيل كاملة وتحليل شامل لكل ما تم تعديله، إضافته، أو حذفه في الكوميت المحدد لمنصة **Thalorix**.

---

## 📌 معلومات عامة عن الكوميت (Commit Overview)

* **المعرّف (Hash):** `ca9fb2f777bc3c89e3cf0d82f6db55c174b00045`
* **المطور (Author):** Ziad-El-Bakry (`zezomamdouh6@gmail.com`)
* **التاريخ:** الثلاثاء، 2 يونيو 2026 الساعة 05:24 مساءً بتوقيت مصر (`Tue Jun 2 17:24:27 2026 +0300`)
* **الرسالة:** `feat: implement initial backend architecture, core modules, and CRUD services for Thalorix platform`
* **عدد الملفات المتأثرة:** 66 ملفاً (2257 إضافة و 2024 حذفاً).

---

## 🚀 ملخص التغييرات الجوهرية (Executive Summary of Major Changes)

1. **دمج نظام علاقات وطلبات الصداقة (Consolidation of Social & Friend Requests):**
   * تم حذف موديول طلبات الصداقة المنفصل `src/friend-request/` بالكامل.
   * تم نقل ودمج جميع وظائفه (إرسال الطلبات، القبول، الرفض، الإلغاء، المتابعة، الحظر، اقتراح الأصدقاء، والأصدقاء المشتركين) لتصبح جزءاً أساسياً ومباشراً من موديول المستخدمين `src/users/`.

2. **ترقية وتطوير نظام المحادثات والـ WebSockets (Chat & WebSockets Upgrade):**
   * دعم إرسال مرفقات (`attachmentUrl`) والرد على رسائل معينة (`replyTo`).
   * إضافة حالات قراءة وتوصيل الرسائل (`sent`, `delivered`, `read`) وتوثيق وقت القراءة (`readAt`).
   * تفعيل الحذف المؤقت (Soft Delete) للرسائل والمحادثات بدلاً من الحذف الكلي.
   * دعم تتبع حالة المستخدم إذا كان متصلاً أو غير متصل (Online/Offline) وبث حالته لجميع الأطراف المتصلة لحظياً عبر WebSockets.

3. **حماية أمنية مشددة للملفات المرفوعة (Cloudinary Security Hardening):**
   * إضافة فلترة صارمة تمنع رفع ملفات ضارة أو تنفيذية (`.exe`, `.bat`, `.cmd`, `.js`, `.ps1`) لحماية الخادم.
   * تحديد حد أقصى لحجم الملفات حتى 500 ميجابايت للسماح برفع الفيديوهات الكبيرة.

4. **تكامل عملية الدفع Stripe والطلبات (Payment & Orders Automation):**
   * ربط Stripe بموديل الطلبات (`Orders`) من خلال تمرير رقم الطلب `orderId` داخل بيانات الـ Metadata لجلسة الدفع.
   * معالجة الـ Stripe Webhook تلقائياً لتحديث حالة الطلب إلى "مدفوع" (Paid) فور نجاح الدفع.
   * تعطيل قيود الشراء الذاتي للـ Templates وتكرار الطلبات غير المدفوعة مؤقتاً لتسهيل عملية الاختبار (Testing).

5. **تحديث إستراتيجية التحقق من الجلسات (JWT Security Enhancements):**
   * تعديل `JwtStrategy` للتحقق من الـ Access Token بمقارنته مع التوكن المشفّر المخزن في قاعدة البيانات في كل طلب لمنع الاستخدام المتوازي للتوكنات ولضمان الأمان وتسجيل خروج حقيقي.

6. **تحسين أداء واستقرار قاعدة البيانات (MongoDB Database Stability):**
   * زيادة عدد محاولات إعادة الاتصال إلى 10 مرات وإضافة مستمعين (Listeners) لطباعة حالات الاتصال والتحذيرات والأخطاء بوضوح في الـ Console.

7. **توسيع النماذج (Schemas) والبيانات الشخصية (Profiles Expansion):**
   * إضافة مصفوفات الخبرات والمهارات (`expertise`)، الحسابات الاجتماعية، والسيرة الذاتية (`bio`) للمستخدمين والمسؤولين (Admins).
   * دعم الحذف المؤقت للبائعين (`isDeleted`)، ورفع غلاف البائع (`banner`)، ونظام تقييم ومراجعات البائعين مع توفير بيانات تجريبية (Mock Reviews) للـ UI الجميل.

---

## 📂 تفاصيل التغييرات التفصيلية لكل موديول (Component-by-Component Details)

### 1. موديول المستخدمين والعلاقات الاجتماعية (`src/users/` & `src/friend-request/` [DELETED])
* **الإجراء:** تم التخلص من موديول `friend-request` المنفصل، ودمج خدماته في موديول المستخدمين `src/users/`.
* **التعديلات في الملفات:**
  * **[MODIFY] [user.schema.ts](file:///d:/lime-work/Thalorix-Back-End/src/users/schema/user.schema.ts):**
    * تعديل شرط التحقق من الاسم (Validation) للسماح بالأرقام وبعض الرموز مثل النقاط والشرطات: `/^[\u0600-\u06FFa-zA-Z0-9\s._-]+$/`.
    * إضافة حقول: المهارات (`expertise`)، الروابط الاجتماعية (`socialLinks`).
    * إضافة مصفوفات العلاقات الاجتماعية: المتابِعون (`followers`)، المتابَعون (`following`)، الأصدقاء (`friends`)، المستخدمون المحظورون (`blockedUsers`).
    * إضافة عدادات لـ: `followersCount`, `followingCount`, `friendsCount`.
  * **[MODIFY] [users.service.ts](file:///d:/lime-work/Thalorix-Back-End/src/users/users.service.ts):**
    * إضافة دوال شاملة لإدارة الصداقة والمتابعة والحظر:
      * `toggleFollow`: لمتابعة/إلغاء متابعة مستخدم أو متجر وتعديل العدادات.
      * `getRelationship`: لجلب حالة العلاقة بين مستخدمين (هل يتابعه؟ هل هو صديق؟ هل حظره؟ هل أرسل/استقبل طلب صداقة؟).
      * `sendFriendRequest` / `cancelFriendRequest` / `acceptFriendRequest` / `rejectFriendRequest`.
      * `blockUser` / `unblockUser` (عند الحظر يتم حذف الصداقة والمتابعة تلقائياً).
      * `getFriends` / `getFollowers` / `getFollowing`.
      * `getMutualFriends`: لحساب الأصدقاء المشتركين.
      * `getSuggestions`: لاقتراح أصدقاء جدد (باستخدام `$sample` لجلب 5 مستخدمين عشوائيين غير مرتبطين بالمستخدم الحالي).
      * `getPendingFriendRequests`: لجلب طلبات الصداقة المعلقة.
  * **[MODIFY] [users.controller.ts](file:///d:/lime-work/Thalorix-Back-End/src/users/users.controller.ts):**
    * إضافة Endpoints جديدة لتغليف العمليات السابقة:
      * `GET /users/suggestions` (اقتراحات الصداقة).
      * `GET /users/friend-requests/pending` (طلبات الصداقة المعلقة).
      * `POST /users/:id/follow` (متابعة/إلغاء متابعة).
      * `GET /users/:id/relationship` (حالة العلاقة).
      * `POST /users/:id/friend-request` (إرسال طلب).
      * `DELETE /users/:id/friend-request` (إلغاء طلب).
      * `POST /users/:id/accept-friend` (قبول الصداقة).
      * `POST /users/:id/reject-friend` (رفض الصداقة).
      * `POST /users/:id/block` (حظر مستخدم).
      * `POST /users/:id/unblock` (إلغاء الحظر).
      * `GET /users/:id/friends` (قائمة الأصدقاء).
      * `GET /users/:id/followers` (المتابِعون).
      * `GET /users/:id/following` (المتابَعون).
      * `GET /users/:id/mutual-friends` (الأصدقاء المشتركون).

---

### 2. موديول المحادثات الفورية (`src/chat/`)
* **الإجراء:** إثراء نظام الشات بمميزات متقدمة وحالات رسائل وبث الحالة عبر WebSockets.
* **التعديلات في الملفات:**
  * **[MODIFY] [conversation.schema.ts](file:///d:/lime-work/Thalorix-Back-End/src/chat/schema/conversation.schema.ts):**
    * إضافة نوع المحادثة `type` (إما `direct` أو `group`).
    * إضافة مصفوفة `deletedBy` لتحديد من من المستخدمين قام بحذف المحادثة من واجهته لإخفائها.
  * **[MODIFY] [message.schema.ts](file:///d:/lime-work/Thalorix-Back-End/src/chat/schema/message.schema.ts):**
    * إضافة حالة الرسالة `status` (إما `sent` أو `delivered` أو `read`).
    * إضافة توقيت القراءة `readAt` وحقل الرد المرجعي `replyTo` وحقل الحذف المؤقت `isDeleted`.
  * **[MODIFY] [chat.service.ts](file:///d:/lime-work/Thalorix-Back-End/src/chat/chat.service.ts):**
    * إضافة خيارات المرفقات وتوثيق الردود عند حفظ الرسالة.
    * استثناء المحادثات المحذوفة بواسطة المستخدم (`deletedBy`).
    * إضافة دوال:
      * `startDirectConversation`: لبدء محادثة مباشرة جديدة (مع منع التحدث مع النفس).
      * `deleteMessage`: يغير حالة الرسالة لـ `isDeleted: true` ومحتواها إلى "This message was deleted" (Soft delete).
      * `deleteConversation`: يضيف معرف المستخدم إلى `deletedBy` لإخفاء المحادثة.
      * `searchMessages`: للبحث عن الكلمات داخل المحادثة باستخدام Regex.
      * `markMessagesAsRead`: تحديث الحالات لـ `read` وتخزين توقيت القراءة.
  * **[MODIFY] [chat.gateway.ts](file:///d:/lime-work/Thalorix-Back-End/src/chat/chat.gateway.ts):**
    * عند اتصال المستخدم عبر Socket: بث حالته كمتصل `user_status: online` لجميع المستخدمين، وإرسال قائمة المتصلين حالياً له `online_users`.
    * عند انقطاع الاتصال: بث حالته كغير متصل `user_status: offline`.
    * إضافة معالج لحدث حذف الرسائل `delete_message` وبث حدث الحذف للغرفة والـ Sockets المعنية.

---

### 3. موديول البائعين والمتاجر (`src/sellers/`)
* **الإجراء:** دعم الحذف المؤقت للمتاجر وإضافة الحسابات الاجتماعية وإمكانيات مراجعات البائعين لخدمة واجهة المستخدم.
* **التعديلات في الملفات:**
  * **[MODIFY] [seller.schema.ts](file:///d:/lime-work/Thalorix-Back-End/src/sellers/schema/seller.schema.ts):**
    * إضافة حقل الحذف المؤقت `isDeleted: boolean`.
    * إضافة حقول: الغلاف `banner` ، فئة العمل التجاري `businessCategory` ، الموقع الإلكتروني `website`.
    * حقول التواصل الاجتماعي: `facebook`, `instagram`, `linkedin`, `twitter`.
    * حقول التوثيق: رقم السجل الضريبي `taxNumber` ومستندات التوثيق المرفوعة `verificationDocuments`.
    * عدادات: المراجعات `reviewsCount` والمبيعات `salesCount` والتحميلات `downloadsCount` والمتابعين `followersCount`.
  * **[MODIFY] [sellers.service.ts](file:///d:/lime-work/Thalorix-Back-End/src/sellers/sellers.service.ts):**
    * استبعاد البائعين المحذوفين (`isDeleted: true`) من نتائج البحث والاستعلام.
    * كتابة سجلات التدقيق (Audit Logs) عند تفعيل/تعطيل الحسابات من قبل المسؤولين أو عند الحذف.
    * إضافة دوال تحديث الشعار والغلاف (`updateLogo` / `updateBanner`).
    * إضافة دالة `getSellerTemplates`: لجلب قوالب البائع النشطة.
    * إضافة دالة `getSellerReviews`: لجلب المراجعات الخاصة بالبائع، مع إضافة منطق رائع: **في حال عدم وجود مراجعات حقيقية، يتم إرجاع 3 مراجعات وهمية (Mock Reviews) بجودة عالية لتعبئة واجهة المستخدم بشكل جميل ومبهر.**
    * إضافة دالة `addSellerReview`: لإضافة مراجعة وإعادة احتساب المتوسط الحسابي للتقييم تلقائياً وتحديث حقل الـ `ratings`.
    * تعديل `deleteSeller` ليقوم بتغيير حالة المتجر لـ `isDeleted: true` (Soft Delete) بدلاً من الحذف الفيزيائي من قاعدة البيانات.

---

### 4. موديول المدفوعات والطلبات (`src/orders/` & `src/payment/`)
* **الإجراء:** ربط إتمام الدفع بتحديث الطلبات تلقائياً، وتخفيف قيود التجربة المحلية.
* **التعديلات في الملفات:**
  * **[MODIFY] [orders.service.ts](file:///d:/lime-work/Thalorix-Back-End/src/orders/orders.service.ts):**
    * تعطيل التحقق من عدم شراء المنتج الشخصي (شراء قالب خاص بك) للتسهيل في بيئة التطوير.
    * تعطيل التحقق من وجود طلب غير مدفوع مكرر لنفس القالب للتسهيل أثناء الاختبار.
  * **[MODIFY] [stripe.controller.ts](file:///d:/lime-work/Thalorix-Back-End/src/payment/stripe.controller.ts) & [stripe.service.ts](file:///d:/lime-work/Thalorix-Back-End/src/payment/stripe.service.ts):**
    * تحديث دالة `createCheckoutSession` لاستقبال `orderId` و `successUrl` اختياريين وتمريرهما لـ Stripe.
    * في معالج نجاح الدفع `handleCheckoutSessionCompleted`: يتم استخراج `orderId` من الـ Metadata الخاصة بالدفع، واستدعاء دالة `ordersService.markAsPaid(orderId)` مباشرة لتحديث حالة الطلب وتأكيد عملية الشراء برمجياً.

---

### 5. موديول إدارة المسؤولين (`src/admin/`)
* **الإجراء:** توسيع بيانات حسابات المسؤولين (Admins) وتعديل صلاحيات الجلسات.
* **التعديلات في الملفات:**
  * **[MODIFY] [admin.schema.ts](file:///d:/lime-work/Thalorix-Back-End/src/admin/schema/admin.schema.ts) & [update-admin.dto.ts](file:///d:/lime-work/Thalorix-Back-End/src/admin/dto/update-admin.dto.ts):**
    * إضافة حقول: `avatarUrl`, `bio`, `expertise`, `socialLinks`.
    * تحديث شرط الاسم للسماح بالأرقام والرموز المعتمدة.
  * **[MODIFY] [admin.service.ts](file:///d:/lime-work/Thalorix-Back-End/src/admin/admin.service.ts):**
    * تحديث دالة الـ `update` لربط حقل `avatar` بحقل `avatarUrl` وإعادة بيانات المستخدم المعدلة بدون كلمة المرور.
    * تحسين رسائل الخطأ لتصبح "Invalid credentials" لزيادة الأمان وصعوبة تخمين البيانات الخاطئة.

---

### 6. موديول الخدمات المساعدة وحماية الملفات (`src/services/` & `src/otp/`)
* **التعديلات في الملفات:**
  * **[MODIFY] [cloudinary.controller.ts](file:///d:/lime-work/Thalorix-Back-End/src/services/cloudinary/cloudinary.controller.ts):**
    * إعداد فلتر التحقق من صيغة الملف المرفوع باستخدام `ParseFilePipeBuilder`.
    * قائمة الصيغ المسموحة: الصور، الفيديوهات، الملفات الصوتية، المستندات النصية والـ PDF.
    * **الحماية الأمنية:** منع نهائي ومباشر لرفع الملفات ذات الامتدادات: `.exe`, `.bat`, `.cmd`, `.js`, `.ps1` لحماية الخادم من الثغرات البرمجية.
    * رفع الحد الأقصى للملف الواحد إلى 500 ميجابايت.
  * **[MODIFY] [cloudinary.service.ts](file:///d:/lime-work/Thalorix-Back-End/src/services/cloudinary/cloudinary.service.ts):**
    * تحسين معالجة إنشاء المجلد التلقائي لتجنب فشل الرفع في حالات تعارض Mongo.
    * استخدام `Logger` لتوثيق أخطاء الرفع وتمرير رسائل خطأ واضحة للواجهة الأمامية.
  * **[MODIFY] [otp.service.ts](file:///d:/lime-work/Thalorix-Back-End/src/otp/otp.service.ts):**
    * إتاحة طباعة كود الـ OTP في شاشة الـ Console لجميع أنواع التحقق (مستخدم، بائع، مسؤول) لتسهيل التطوير والاختبار المحلي.
    * تجاوز أخطاء فشل إرسال البريد الإلكتروني في بيئة التطوير (Dev Mode) لمواصلة إنشاء الحساب دون توقف الخادم.

---

### 7. التغييرات في موديول المصادقة والجلسات والتطبيق (`src/auth/` & `src/app.module.ts`)
* **التعديلات في الملفات:**
  * **[MODIFY] [jwt.strategy.ts](file:///d:/lime-work/Thalorix-Back-End/src/auth/token/jwt.strategy.ts):**
    * في دالة `validate`: يتم جلب رمز الـ JWT من ترويسة الطلب ومقارنته بالـ `currentAccessToken` المشفّر المخزن في قاعدة البيانات باستخدام `bcrypt.compare`.
    * إذا اختلف الرمز (تسجيل دخول من جهاز آخر أو انتهاء الصلاحية)، يتم رفض الطلب فوراً بـ `UnauthorizedException`.
    * التحقق من عدم حظر الحساب أو حذفه قبل تمرير الجلسة.
  * **[MODIFY] [app.module.ts](file:///d:/lime-work/Thalorix-Back-End/src/app.module.ts):**
    * دمج اتصالات MongoDB المتقدمة: تفعيل خيارات المهلة للاتصال (`connectTimeoutMS`, `socketTimeoutMS`, `serverSelectionTimeoutMS`).
    * إضافة سجلات واضحة تظهر حالة الاتصال بقاعدة البيانات في الـ Console:
      * عند النجاح: `🔥 MongoDB Connected Successfully!`
      * عند انقطاع الاتصال: `⚠️ MongoDB Disconnected! Retrying connection...`
      * عند الخطأ: `❌ MongoDB connection error:`

---

### 8. ملفات أخرى تم تعديلها أو حذفها
* **[DELETE] `Project_Schema_Report.md`:** تم حذفه لأنه كان تقريراً قديماً عن الهيكل.
* **[DELETE] `seed-folders.js`:** تم حذفه بعد استقرار إعداد المجلدات تلقائياً عبر الخدمة.
* **[DELETE] `test-validator.ts` & `test/history.txt`:** ملفات اختبارية قديمة تم الاستغناء عنها.
* **[NEW] `New folder/update-user.dto.ts` & `New folder/user.schema.ts`:** ملفات احتياطية تم الاحتفاظ بها مؤقتاً في مجلد جديد.
* **[MODIFY] `tsconfig.json` & `tsconfig.build.json`:** ضبط إعدادات الاستبعاد والضم لملفات TypeScript لبيئة البناء والإنتاج.

---

## 📈 ملخص الأثر العام للكوميت (Impact Analysis)

| الجانب المتأثر | طبيعة الأثر والتغيير |
| :--- | :--- |
| **الأمان والحماية (Security)** | حظر شامل للامتدادات التنفيذية + تفعيل الجلسة الأحادية (Single Session) ومقارنة التوكن المشفّر في الـ DB. |
| **تجربة المستخدم (UX/Chat)** | دعم كامل للردود والمرفقات وحالات قراءة الرسائل وبث الاتصال لحظياً (Online/Offline). |
| **بيئة التطوير (Developer Experience)** | تسهيل الاختبار المحلي عبر طباعة كود الـ OTP وتخطي أخطاء الإيميل، وإتاحة مراجعات وهمية للـ UI. |
| **هيكلية الكود (Architecture)** | تبسيط الكود بدمج نظام الصداقات داخل موديول المستخدمين وتجنب التكرار. |
| **استقرار النظام (Stability)** | إدارة ذكية لاتصالات MongoDB مع إعادة محاولة تصل إلى 10 مرات ورسائل مراقبة واضحة. |

---

تم إعداد هذا التقرير بدقة متناهية لتغطية كافة جوانب التغييرات التي طرأت على المشروع في هذا الكوميت. إذا كان لديك أي استفسار آخر أو ترغب في فحص جزء معين بتفصيل أكبر، فلا تتردد في طرحه!
