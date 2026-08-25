# سامانه پیش‌ثبت‌نام دروس گروه آمار — نسخه 0.2

این نسخه برای انتشار روی GitHub Pages و اتصال به Supabase آماده شده است.

## تغییرات نسخه 0.2

- اصلاح کامل خطای `gen_salt(unknown) does not exist` با استفاده صحیح از افزونه `pgcrypto` در schema `extensions`.
- پیام موفقیت واضح پس از ثبت یا ویرایش اطلاعات دانشجو.
- راهنمای صریح برای ورود مجدد از بخش «ویرایش پیش‌ثبت‌نام قبلی».
- نمایش زمان ثبت اطلاعات.
- آماده برای GitHub Pages.

## 1) تنظیم اتصال Supabase

فایل `config.js` را باز کنید و فقط این دو مقدار را وارد کنید:

```javascript
window.APP_CONFIG = {
  SUPABASE_URL: "https://YOUR_PROJECT_REF.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_..."
};
```

هرگز `service_role` یا secret key را داخل پروژه یا GitHub قرار ندهید.

## 2) اجرای SQL

در Supabase وارد SQL Editor شوید و فایل `supabase_setup.sql` را اجرا کنید.

اگر قبلاً نسخه 0.1 را اجرا کرده‌اید، اجرای فایل نسخه 0.2 روی همان پروژه مشکلی ندارد؛ جدول‌های موجود حفظ می‌شوند و توابع لازم به‌روزرسانی می‌شوند.

نکته: پس از زدن Run، تغییرات دیتابیس ذخیره شده‌اند. ذخیره خود Query در SQL Editor اختیاری است و فقط برای نگهداری متن Query در داشبورد Supabase کاربرد دارد.

## 3) تست محلی

در پوشه پروژه:

```bash
python3 -m http.server 8000
```

سپس در مرورگر:

```text
http://localhost:8000
```

## 4) انتشار روی GitHub Pages

1. یک Repository در GitHub بسازید، مثلاً `lu-stat-preregistration`.
2. تمام فایل‌های این پوشه را در ریشه Repository قرار دهید.
3. از Settings > Pages، گزینه Deploy from a branch را انتخاب کنید.
4. Branch را `main` و Folder را `/root` قرار دهید.
5. بعد از Deploy، GitHub آدرس عمومی سایت را نمایش می‌دهد.

## 5) رفتار ثبت موفق

پس از ثبت، دانشجو پیام واضح دریافت می‌کند که اطلاعات ثبت شده و برای اصلاح بعدی باید از بخش «ویرایش پیش‌ثبت‌نام قبلی» با شماره دانشجویی و کد ویرایش استفاده کند.
