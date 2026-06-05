# توثيق عملية الدفع باستخدام Stripe (Stripe Payment Documentation)

مستند توضيحي لعمليات الدفع باستخدام بوابة Stripe في مشروع **Thalorix**. يحتوي هذا المستند على تفاصيل endpoints الخاصة بالـ Backend، مع شرح منفصل تماماً لكل من فريق الـ **Frontend (Web)** وفريق الـ **Mobile App** لتجنب أي تداخل أو ارتباك.

---

## 📌 نظرة عامة على آلية العمل (Overview)

يعتمد النظام الحالي على **Stripe Checkout Session**، وهي الطريقة الأكثر أماناً وسهولة:
1. يقوم العميل بطلب الدفع لطلب (Order) معين.
2. يرسل تطبيق الواجهة (Front/Mobile) طلباً للـ Backend لإنشاء جلسة دفع (Checkout Session).
3. يعود الـ Backend برابط دفع فريد من Stripe (`url`) ومعرّف الجلسة (`sessionId`).
4. يقوم التطبيق بتوجيه المستخدم إلى الرابط لإكمال عملية الدفع بأمان على خوادم Stripe.
5. بمجرد انتهاء الدفع (نجاح أو فشل)، يعود المستخدم إلى تطبيقك عبر روابط النجاح/الإلغاء المحددة مسبقاً.
6. يقوم الـ Backend باستقبال إشعار الدفع تلقائياً عبر **Stripe Webhooks** ويقوم بتحديث حالة الطلب في قاعدة البيانات إلى مدفوع (`PAID`) أو فشل (`FAILED`).

---

## 🛠️ تفاصيل الـ API (Backend Endpoints)

### 1. إنشاء جلسة الدفع (Create Checkout Session)

* **رابط المسار:** `/stripe/create-checkout-session`
* **الطريقة (Method):** `POST`
* **المصادقة (Authentication):** Bearer Token (JWT Access Token مطلوب في الـ Header)
* **الـ Headers:**
  ```http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  Content-Type: application/json
  ```
* **جسم الطلب (Request Body - JSON):**
  ```json
  {
    "orderId": "60d5ecb8b392d7001f8e8e30", // معرف الطلب المراد دفعه (مطلوب)
    "successUrl": "https://example.com/payment-success", // رابط التوجيه عند النجاح (اختياري)
    "cancelUrl": "https://example.com/payment-cancel" // رابط التوجيه عند الإلغاء (اختياري)
  }
  ```
  *(ملاحظة للـ Mobile: يمكن تمرير روابط Deep Links مخصصة للتطبيق مثل `thalorix://payment-success`)*

* **استجابة النجاح (Success Response - 201 Created):**
  ```json
  {
    "sessionId": "cs_test_a1b2c3d4...",
    "url": "https://checkout.stripe.com/c/pay/cs_test_..."
  }
  ```

---

# 🌐 دليل تطوير الـ Frontend (Web)

هذا الجزء خاص بمطوري الـ Web (React, Next.js, Vue, Angular, etc.)

### خطوات التكامل:
1. يقوم المستخدم بالنقر على زر "ادفع الآن".
2. يتم إرسال طلب `POST` إلى `/stripe/create-checkout-session` مع إرسال `orderId` وروابط العودة (`successUrl` و `cancelUrl`) الخاصة بموقع الويب.
3. عند استلام الـ `url` من الـ API، قم بتحويل المستخدم مباشرة إليه باستخدام `window.location.href`.

### مثال عملي (Javascript / React):

```javascript
import axios from 'axios';

async function handlePayment(orderId) {
  try {
    // 1. استدعاء الـ API من الـ Backend
    const response = await axios.post(
      'https://api.thalorix.com/stripe/create-checkout-session', 
      {
        orderId: orderId,
        // روابط النجاح والإلغاء الخاصة بالـ Web
        successUrl: `${window.location.origin}/orders/success?orderId=${orderId}`,
        cancelUrl: `${window.location.origin}/orders/cancel?orderId=${orderId}`
      },
      {
        headers: {
          // تأكد من تمرير توكن المستخدم المسجل
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    const { url } = response.data;

    // 2. إعادة توجيه العميل إلى صفحة الدفع الخاصة بـ Stripe
    if (url) {
      window.location.href = url;
    } else {
      console.error('Stripe checkout URL is missing');
    }
  } catch (error) {
    console.error('خطأ في بدء عملية الدفع:', error.response?.data || error.message);
    alert('حدث خطأ أثناء الانتقال لصفحة الدفع. الرجاء المحاولة مرة أخرى.');
  }
}
```

---

# 📱 دليل تطوير الـ Mobile App

هذا الجزء خاص بمطوري الـ Mobile (React Native, Flutter, Swift, Kotlin)

بما أن الـ Backend يرجع رابط دفع ويب لـ Stripe Checkout، هناك طريقتان للتعامل معه في تطبيقات الهواتف:

## الطريقة الأولى: استخدام WebView داخل التطبيق (موصى بها حالياً وسريعة)

تعتمد هذه الطريقة على فتح رابط الدفع المستلم داخل مكون WebView في التطبيق ومراقبة مسار الرابط للتأكد من انتهاء الدفع.

### خطوات التكامل:
1. استدعاء مسار الـ API `/stripe/create-checkout-session` وتمرير الـ `orderId` وروابط نجاح/إلغاء مخصصة (مثال: `https://thalorix.com/payment-success`).
2. فتح الـ `url` المستلم داخل WebView.
3. الاستماع لتغيرات الروابط (Navigation State Changes) داخل الـ WebView.
4. عندما يتغير الرابط ويبدأ برابط النجاح (`successUrl`) أو الإلغاء (`cancelUrl`)، قم بـ:
   - إغلاق الـ WebView.
   - نقل المستخدم إلى شاشة النجاح أو الفشل داخل التطبيق بشكل native.

---

### ⚛️ مثال عملي React Native (`react-native-webview`):

```tsx
import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const SUCCESS_URL = 'https://thalorix.com/payment-success';
const CANCEL_URL = 'https://thalorix.com/payment-cancel';

export default function PaymentScreen({ route, navigation }) {
  const { checkoutUrl, orderId } = route.params;
  const [loading, setLoading] = useState(true);

  // دالة لمراقبة تغيير الرابط داخل الـ WebView
  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;

    if (url.startsWith(SUCCESS_URL)) {
      // الدفع تم بنجاح
      // الـ Backend سيقوم بتحديث الحالة تلقائياً عبر الـ Webhook
      navigation.replace('PaymentSuccess', { orderId });
    } else if (url.startsWith(CANCEL_URL)) {
      // المستخدم ألغى الدفع
      navigation.replace('PaymentFailed', { orderId });
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: checkoutUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />
      {loading && (
        <ActivityIndicator
          size="large"
          color="#0000ff"
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

---

### 💙 مثال عملي Flutter (`webview_flutter`):

```dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class StripePaymentWebView extends StatefulWidget {
  final String checkoutUrl;
  final String orderId;

  const StripePaymentWebView({
    Key? key,
    required this.checkoutUrl,
    required this.orderId,
  }) : super(key: key);

  @override
  _StripePaymentWebViewState createState() => _StripePaymentWebViewState();
}

class _StripePaymentWebViewState extends State<StripePaymentWebView> {
  late final WebViewController _controller;
  final String successUrl = 'https://thalorix.com/payment-success';
  final String cancelUrl = 'https://thalorix.com/payment-cancel';

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (NavigationRequest request) {
            if (request.url.startsWith(successUrl)) {
              // الدفع تم بنجاح
              Navigator.pushReplacementNamed(
                context,
                '/payment-success',
                arguments: widget.orderId,
              );
              return NavigationDecision.prevent;
            } else if (request.url.startsWith(cancelUrl)) {
              // الدفع تم إلغاؤه
              Navigator.pushReplacementNamed(
                context,
                '/payment-failed',
                arguments: widget.orderId,
              );
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.checkoutUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('دفع آمن عبر Stripe')),
      body: WebViewWidget(controller: _controller),
    );
  }
}
```

---

## الطريقة الثانية: استخدام Stripe Mobile SDK (الـ Payment Sheet الأصلي)

إذا أراد فريق الـ Mobile تجربة مستخدم أفضل بكثير ودون فتح WebView (أي يظهر نموذج الدفع كـ Native Sheet مدمج داخل التطبيق)، **يجب تعديل الـ Backend** لدعم آلية الـ **Payment Intents**:

1. يقوم الـ Mobile باستدعاء endpoint مخصص (مثلاً `/stripe/create-payment-intent`).
2. يقوم الـ Backend بإنشاء PaymentIntent و Customer و Ephemeral Key على Stripe.
3. يرجع الـ Backend البيانات التالية:
   - `paymentIntent` (client secret)
   - `ephemeralKey`
   - `customer`
4. يستعمل تطبيق الـ Mobile هذه البيانات لتهيئة الـ SDK الأصلي (`@stripe/stripe-react-native` في React Native أو `flutter_stripe` في Flutter) ويقوم بعرض الـ Payment Sheet مباشرة للمستخدم.

*ملاحظة: إذا رغبتم في تفعيل هذه الطريقة، يرجى إبلاغ مطور الـ Backend لإضافة الـ endpoint المذكور.*

---

## 🔒 التحقق وتحديث حالة الدفع (Stripe Webhooks)

**هام جداً لفريقي الـ Front والـ Mobile:**
لا تقوموا بتحديث حالة الطلب إلى "مدفوع" يدوياً من جهة التطبيق بمجرد نجاح التحويل. 
الـ Backend يقوم بذلك بأمان تام عبر الـ Webhook الخاص بـ Stripe. حيث يستمع الـ Backend للأحداث التالية:
- `checkout.session.completed`: يقوم بتحويل حالة الطلب تلقائياً إلى `PAID`.
- `payment_intent.payment_failed`: يقوم بتحويل حالة الطلب تلقائياً إلى `FAILED`.

كل ما عليكم فعله بعد نجاح الدفع ورجوع العميل للتطبيق هو:
1. توجيه العميل لصفحة النجاح.
2. عمل Refresh لبيانات الطلب من خادم التطبيق الخاص بكم للتأكد من تحديث الحالة.
