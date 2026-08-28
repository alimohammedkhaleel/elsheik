# نظام إدارة ومتابعة عملاء التوزيع | مؤسسة الشيخ
## Distribution Customer Management System

نظام ويب متكامل لإدارة ومتابعة عملاء التوزيع، الحسابات، المبيعات، الفواتير والتحصيلات لـ **مؤسسة الشيخ**.

> **تم الإنشاء والتطوير والإشراف البرمجي بواسطة:**
> **المهندس:** علي محمد علي خليل
> **رقم التواصل / واتساب:** `01121360605` (+201121360605)

---

## 🛠️ التقنيات المستخدمة (Technology Stack)

### الواجهة الأمامية (Frontend):
- **React (TypeScript)** + **Vite**
- **Plain CSS** بنظام Design Tokens فاخر باللون الذهبي والكحلي الملكي
- **GSAP** و **Framer Motion** للحركات والمؤثرات المتقدمة
- **Lucide React** للأيقونات المينيمال
- واجهة عربية أصيلة بنظام اتجاه اليمين إلى اليسار بالكامل (`dir="rtl"`, `lang="ar"`).

### الواجهة الخلفية (Backend):
- **Node.js** + **Express.js (TypeScript)**
- معمارية طبقية نظيفة: Routes ➔ Middleware ➔ Controllers ➔ Services ➔ Repositories ➔ PostgreSQL
- **REST API** بنظام استجابة موحد ودعم Serverless Functions على Vercel.

### قاعدة البيانات (Database):
- **PostgreSQL** المستضافة على **Neon Cloud** مع وضع الذاكرة المتزامن للاختبار (Memory Fallback).
- اتصال مشفر ببروتوكول SSL.

---

## 📁 هيكل المشروع (Project Structure)

```
distribution-management-system/
├── api/             # مدخل دوال Vercel Serverless Functions
├── client/          # واجهة المستخدم React Vite + TS
├── server/          # خادم الـ Express REST API
├── database/        # مجلدات المايجريشن والجداول
├── vercel.json      # ملف إعدادات النشر على Vercel
├── .env.example     # نموذج متغيرات البيئة
├── .gitignore       # استبعاد الملفات السرية والمخرجات
└── package.json     # إدارة تشغيل وبناء المشروع الموحد
```

---

## 🚀 التشغيل والتطوير المحلي (Local Development)

### 1. تثبيت الاعتمادات
```bash
npm install
cd server && npm install
cd ../client && npm install
```

### 2. تشغيل بيئة التطوير
```bash
# تشغيل الخادم والواجهة معاً
npm run dev

# أو تشغيل كل جزء منفرداً:
npm run dev:server   # يعمل على http://localhost:5000
npm run dev:client   # يعمل على http://localhost:5173
```

---

## 🌐 النشر على منصة Vercel (Deployment)

المشروع مهيأ بالكامل للنشر الفوري عبر منصة **Vercel** من خلال مستودع GitHub:
`https://github.com/alimohammedkhaleel/elsheik`

### خطوات النشر على Vercel:
1. ارفع الكود إلى مستودع GitHub:
   ```bash
   git add .
   git commit -m "feat: complete enterprise login redesign, footer, and vercel config"
   git push origin main
   ```
2. ادخل إلى لوحة تحكم [Vercel](https://vercel.com) واختر **Add New Project**.
3. قم باستيراد مستودع `alimohammedkhaleel/elsheik`.
4. الإعدادات الافتراضية محددة تلقائياً عبر `vercel.json`:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build --workspace=client`
   - **Output Directory**: `client/dist`
5. أضف متغيرات البيئة في Vercel (Environment Variables):
   - `DATABASE_URL`: رابط اتصال Neon PostgreSQL.
   - `JWT_SECRET`: مفتاح التشفير الآمن.
   - `NODE_ENV`: `production`
6. اضغط **Deploy** وسيعمل الموقع فورياً مع إعادة التوجيه التلقائية للروابط والـ API.
