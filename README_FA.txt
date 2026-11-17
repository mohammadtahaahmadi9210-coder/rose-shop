# ROSE SHOP — پروژه Cloudflare Pages

این بسته شامل رابط جدید ROSE SHOP، فایل‌های Pages Functions برای ورود امن واسطه و schema دیتابیس D1 است.

## نکته‌های مهم
- آگهی‌ها، ثبت‌نام پلیر و چت فعلاً نمونه نمایشی هستند و فقط در مرورگر همان دستگاه ذخیره می‌شوند؛ هنوز backend مشترک ندارند.
- ورود واسطه فقط پس از ساخت دیتابیس D1، تنظیم شناسه دیتابیس، اجرای schema و ایجاد حساب واسطه فعال می‌شود.
- هرگز رمز عبور یا شناسه محرمانه را داخل GitHub عمومی قرار ندهید.

## انتشار
این پروژه Cloudflare Pages Functions دارد و آپلود Drag & Drop ساده در داشبورد برای آن کافی نیست. از Wrangler استفاده کنید:
1. یک D1 Database با نام `rose-shop-db` بسازید.
2. شناسه دیتابیس را در `wrangler.toml` جایگزین مقدار `REPLACE_WITH_YOUR_D1_DATABASE_ID` کنید.
3. در محیط دارای Node.js و Wrangler، از پوشه پروژه اجرا کنید: `npx wrangler d1 execute rose-shop-db --remote --file=schema.sql`
4. سپس: `npx wrangler pages deploy . --project-name=rose-shop`
5. مطمئن شوید binding با نام `DB` به Pages Functions وصل است.

## فایل‌ها
- `index.html` رابط سایت
- `functions/api/login.js`, `me.js`, `logout.js` API نشست واسطه
- `schema.sql` جداول D1
- `scripts/create-mediator.mjs` ساخت SQL برای حساب واسطه
- `wrangler.toml` تنظیمات انتشار

برای ساخت حساب واسطه از اسکریپت استفاده کنید و SQL خروجی را فقط در D1 Console خصوصی اجرا کنید.
