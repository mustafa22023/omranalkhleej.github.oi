# شركة عمران الخليج - تشغيل سريع

## روابط
- نسخة العميل: `index.html?clean=1`
- نسخة المطور: `index.html?developer=1&clean=1`

## قاعدة الحفظ الصحيحة
1) عدل من نسخة المطور.
2) اضغط `حفظ ملف المشروع` واختر `site-config.json` داخل نفس المجلد.
3) ارفع بـ `./publish-github.sh`.

> نسخة العميل لا تقرأ localStorage. تقرأ فقط `site-config.json` المنشور.

## أفضل صيغة صور
- الأقسام: `assets/sections/<section-id>.<ext>`
- المنتجات: `assets/products/<product-slug>.<ext>`
- استخدم أسماء إنجليزية صغيرة بشرطات `-` لتجنب مشاكل الترميز.
