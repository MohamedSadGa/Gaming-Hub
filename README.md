<div align="center">

# 🎮 GAME HUB — العب وتحدّ نفسك

**منصة ألعاب ويب تفاعلية تضم 50 تحدياً سريعاً في الذاكرة، السرعة، الدقة، والمنطق — مع حفظ تلقائي للتقدم وتخصيص كامل للتجربة.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-76f0c4?style=for-the-badge&logo=github&logoColor=10111d)](https://mohamedsadga.github.io/Gaming-Hub/)
[![Language](https://img.shields.io/badge/Language-AR%20%7C%20EN-6c63ff?style=for-the-badge)](#)
[![Games Count](https://img.shields.io/badge/Challenges-50%20Games-ff6b6b?style=for-the-badge)](#مكتبة-الألعاب)
[![Storage](https://img.shields.io/badge/Progress-localStorage-ffb703?style=for-the-badge&logo=javascript&logoColor=10111d)](#)

</div>

---

## ✨ أبرز المزايا

* **50 تحدياً متنوعاً:** ألعاب سرعة واستجابة، ذاكرة، أرقام، منطق، أركيد، دقة، بقاء، ومهارة — مع بحث فوري وتصنيفات سريعة.
* **حفظ تلقائي للتقدم:** تخزين النقاط والنتائج والتفضيلات محلياً عبر `localStorage` دون الحاجة لتسجيل حساب.
* **تخصيص متكامل للواجهة والتجربة:**
  * دعم الوضع الداكن والفاتح (`Dark / Light`) ووضع راحة العينين وتخصيص اللون الرئيسي.
  * التحكم في المؤثرات الصوتية ومستوى الصوت وحركات الواجهة، بالإضافة إلى إمكانية تخصيص الأيقونات.
  * دعم تبديل اللغة وتعدد الصفحات (`index.html`, `about.html`, `contact.html`, `privacy.html`, `language.html`, `appearance.html`, `hdr.html`).
* **تكامل إعلاني ونظام مكافآت:** ربط وحدات إعلانات **A-Ads** (`#2463378` و `#2463380`) مع فلترة الفئات غير المناسبة، ونظام مكافآت (`+25` نقطة و`+1` حياة عبر `GameHub.completeRewardedAd()`).

---

## 🕹️ مكتبة الألعاب

يضم المشروع **50 لعبة** مصنّفة عبر فئات متعددة لتناسب الجلسات السريعة وكسر الأرقام القياسية، مثل:

| الفئة | أمثلة من التحديات |
| :--- | :--- |
| **السرعة والردّة** | عدّاء النقر، إشارة الانطلاق، ردّة البرق، صائد النجوم |
| **الأركيد والمهارة** | فقاعات طائرة، لكمة البكسل، تحديات التركيز والدقة |
| **الذاكرة والمنطق** | ألعاب الذاكرة، الأرقام، والمنطق الذهني السريع |

---

## 🛠️ التقنيات المستخدمة

* **HTML5 & CSS3** (تصميم متجاوب يدعم RTL/LTR، المتغيرات اللونية، والحركات الانتقالية)
* **Vanilla JavaScript** (`storage.js`, `i18n.js`, `games.js`, `site.js`, `code.js`)
* **PWA Manifest & Web Fonts** (`Rubik`, `Amiri`, `Press Start 2P`)
* **GitHub Pages** للاستضافة والنشر المباشر

---

## 📁 هيكل المشروع

```text
Gaming-Hub/
├── index.html          # الصفحة الرئيسية ومكتبة الـ 50 لعبة
├── about.html          # صفحة من نحن
├── contact.html        # صفحة التواصل
├── privacy.html        # سياسة الخصوصية
├── language.html       # إعدادات اللغة
├── appearance.html     # تخصيص الألوان والمظهر
├── hdr.html            # صفحة تجربة HDR
├── style.css           # التنسيقات الرئيسية والسمات
├── manifest.json       # إعدادات تطبيق الويب التقدمي
├── games.png           # شعار وأيقونة المشروع
└── js/
    ├── storage.js      # إدارة حفظ البيانات في localStorage
    ├── i18n.js         # الترجمة وتبديل اللغة
    ├── games.js        # بيانات ومنطق الألعاب الـ 50
    ├── site.js         # سلوك الواجهة والتفضيلات
    └── code.js         # إدارة الجولات والمكافآت
