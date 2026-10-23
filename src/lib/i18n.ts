import { app } from "./store.svelte";

const dict = {
  "app.name": { fa: "روزنه", en: "Rozaneh" },
  "popup.tagline": { fa: "تب تازه، آرام و خصوصی", en: "A fresh, calm, private tab" },
  "popup.active": { fa: "روزنه فعال است", en: "Rozaneh is on" },
  "popup.activeHint": { fa: "تب جدید با داشبورد روزنه باز می‌شود", en: "New tabs open the Rozaneh dashboard" },
  "popup.inactive": { fa: "روزنه خاموش است", en: "Rozaneh is off" },
  "popup.inactiveHint": { fa: "تب جدید صفحه‌ی خاموش را نشان می‌دهد", en: "New tabs show the off screen" },
  "popup.openTab": { fa: "باز کردن روزنه", en: "Open Rozaneh" },
  "popup.openTabHint": { fa: "همه‌ی ابزارک‌ها در یک نگاه", en: "All your widgets at a glance" },
  "popup.theme": { fa: "ظاهر", en: "Appearance" },
  "popup.themeHint": { fa: "تم تب جدید", en: "New-tab theme" },
  "popup.auto": { fa: "سایت‌های پرتکرار", en: "Most-visited sites" },
  "popup.autoHint": {
    fa: "پیشنهاد خودکار در نوار میانبر",
    en: "Automatic suggestions in the shortcut bar",
  },
  "popup.permissionGrant": { fa: "اجازه‌ی دسترسی بده", en: "Grant permission" },
  "popup.permissionBusy": { fa: "در حال دریافت اجازه…", en: "Requesting permission…" },
  "popup.permissionDenied": {
    fa: "اجازه داده نشد؛ بدون آن هم همه‌چیز کار می‌کند.",
    en: "Permission was not granted; everything still works without it.",
  },
  "popup.settings": { fa: "تنظیمات", en: "Settings" },
  "popup.guide": { fa: "راهنما", en: "Guide" },
  "popup.privacy": { fa: "همه‌چیز روی دستگاه تو می‌ماند", en: "Everything stays on your device" },

  "disabled.title": { fa: "روزنه خاموش است", en: "Rozaneh is off" },
  "disabled.body": {
    fa: "برای دیدن داشبورد، روزنه را دوباره روشن کن. تنظیمات و میانبرهایت حفظ می‌شوند.",
    en: "Turn Rozaneh back on to see your dashboard. Your settings and shortcuts are kept.",
  },
  "disabled.enable": { fa: "روشن کردن روزنه", en: "Turn Rozaneh on" },
  "common.close": { fa: "بستن", en: "Close" },
  "common.back": { fa: "بازگشت", en: "Back" },
  "common.save": { fa: "ذخیره", en: "Save" },
  "common.add": { fa: "افزودن", en: "Add" },
  "common.delete": { fa: "حذف", en: "Delete" },

  "shortcuts.edit": { fa: "ویرایش", en: "Edit" },
  "shortcuts.remove": { fa: "حذف", en: "Remove" },
  "shortcuts.full": { fa: "جای بیشتری برای میانبر نیست", en: "No room for more shortcuts" },
  "shortcuts.autoHint": {
    fa: "از سایت‌های پرتکرار اضافه شده",
    en: "Added from your most-visited sites",
  },
  "shortcuts.listLabel": { fa: "میانبرها", en: "Shortcuts" },

  "shortcut.addTitle": { fa: "افزودن میانبر", en: "Add shortcut" },
  "shortcut.editTitle": { fa: "ویرایش میانبر", en: "Edit shortcut" },
  "shortcut.titleLabel": { fa: "عنوان", en: "Title" },
  "shortcut.titlePlaceholder": { fa: "مثلا بانک خوب", en: "e.g. My Bank" },
  "shortcut.urlLabel": { fa: "آدرس", en: "URL" },
  "shortcut.uploadIcon": { fa: "بارگذاری آیکون", en: "Upload icon" },
  "shortcut.suggested": { fa: "سایت‌های پیشنهادی برای اضافه کردن", en: "Suggested sites to add" },

  "city.selectLabel": { fa: "انتخاب شهر", en: "Select city" },
  "city.placeholder": { fa: "نام شهر را بنویسید…", en: "Type a city name…" },
  "city.searching": { fa: "در حال جستجو…", en: "Searching…" },
  "city.notFound": { fa: "شهری پیدا نشد", en: "No city found" },

  "bookmarks.importTitle": { fa: "وارد کردن از مرورگر", en: "Import from browser" },
  "bookmarks.permissionExplain": {
    fa: "برای وارد کردن بوکمارک‌ها، روزنه به اجازه‌ی دسترسی به بوکمارک‌های مرورگر شما نیاز دارد.",
    en: "To import bookmarks, Rozaneh needs permission to access your browser's bookmarks.",
  },
  "bookmarks.grantContinue": { fa: "اجازه دسترسی و ادامه", en: "Grant access & continue" },
  "bookmarks.loading": { fa: "در حال بارگذاری بوکمارک‌ها…", en: "Loading bookmarks…" },
  "bookmarks.loadError": { fa: "دریافت بوکمارک‌ها ممکن نشد.", en: "Couldn't load bookmarks." },
  "bookmarks.confirmCount": { fa: "تایید و افزودن لیست ({count})", en: "Confirm & add ({count})" },
  "bookmarks.expandFolder": { fa: "باز کردن پوشه", en: "Expand folder" },
  "bookmarks.collapseFolder": { fa: "بستن پوشه", en: "Collapse folder" },

  "calendar.backToToday": { fa: "بازگشت به امروز", en: "Back to today" },
  "calendar.prevMonth": { fa: "ماه قبل", en: "Previous month" },
  "calendar.nextMonth": { fa: "ماه بعد", en: "Next month" },
  "calendar.prevYear": { fa: "سال قبل", en: "Previous year" },
  "calendar.nextYear": { fa: "سال بعد", en: "Next year" },

  "weather.loading": { fa: "در حال دریافت…", en: "Loading…" },
  "weather.unavailable": { fa: "اطلاعات آب‌وهوا در دسترس نیست", en: "Weather data unavailable" },

  "prayer.title": { fa: "اوقات شرعی", en: "Prayer times" },

  "prices.unavailable": { fa: "قیمت‌ها در دسترس نیست", en: "Prices unavailable" },
  "prices.loading": { fa: "در حال دریافت قیمت‌ها…", en: "Loading prices…" },
  "prices.refresh": { fa: "به‌روزرسانی قیمت‌ها", en: "Refresh prices" },
  "prices.tomanSuffix": { fa: "ت", en: "T" },

  "occasions.none": { fa: "مناسبتی برای نمایش نیست", en: "No occasions to show" },

  "settings.title": { fa: "تنظیمات", en: "Settings" },
  "settings.sectionGeneral": { fa: "عمومی", en: "General" },
  "settings.sectionTools": { fa: "ابزارها", en: "Tools" },
  "settings.tabTheme": { fa: "تم و رنگ", en: "Theme & color" },
  "settings.tabBackground": { fa: "تصویر زمینه", en: "Background image" },
  "settings.tabClock": { fa: "ساعت", en: "Clock" },
  "settings.tabWeather": { fa: "آب و هوا", en: "Weather" },
  "settings.tabCalendar": { fa: "تقویم و رویدادها", en: "Calendar & events" },

  "settings.autoShortcutsLabel": {
    fa: "افزودن خودکار سایت‌های پرتکرار",
    en: "Add most-visited sites automatically",
  },
  "settings.autoShortcutsDesc": {
    fa: "سایت‌هایی که بیشتر بازدید می‌کنی، خودکار به نوار میانبرها اضافه می‌شوند و مثل بقیه قابل ویرایش و حذف هستند.",
    en: "Sites you visit most are added to the shortcut bar automatically; they stay editable and removable like any other shortcut.",
  },
  "settings.autoShortcutsPrivacy": {
    fa: "این فهرست فقط روی همین دستگاه خوانده می‌شود و جایی ارسال نمی‌شود. برای فعال‌کردن، مرورگر اجازه‌ی خواندن سایت‌های پرتکرار را می‌پرسد.",
    en: "The list is read only on this device and is never sent anywhere. Enabling it asks the browser for permission to read your most-visited sites.",
  },
  "settings.autoShortcutsDenied": {
    fa: "اجازه داده نشد. بدون این اجازه هم همه‌چیز کار می‌کند؛ فقط پیشنهادها اضافه نمی‌شوند.",
    en: "Permission was not granted. Everything still works; only the suggestions are skipped.",
  },
  "settings.autoShortcutsReset": {
    fa: "پاک‌کردن فهرست نادیده‌گرفته‌شده‌ها",
    en: "Reset dismissed suggestions",
  },
  "settings.replayWelcome": {
    fa: "نمایش دوباره راهنما",
    en: "Show the welcome guide again",
  },

  "welcome.greeting": { fa: "به روزنه خوش آمدی", en: "Welcome to Rozaneh" },
  "welcome.subtitle": {
    fa: "یک تب تازه، آرام و خصوصی برای شروع روز.",
    en: "A fresh, calm, private tab for the start of your day.",
  },
  "welcome.featuresTitle": { fa: "همه‌چیز دم دست", en: "Everything in one place" },
  "welcome.featuresSubtitle": {
    fa: "ساعت، تقویم شمسی، قمری و میلادی، آب‌وهوا و میانبرهایت — بدون شلوغی.",
    en: "Clock, Persian, Hijri and Gregorian calendars, weather and your shortcuts — without the noise.",
  },
  "welcome.featureClock": { fa: "ساعت", en: "Clock" },
  "welcome.featureCalendar": { fa: "تقویم سه‌گانه", en: "Tri-calendar" },
  "welcome.featureWeather": { fa: "آب‌وهوا", en: "Weather" },
  "welcome.featureShortcuts": { fa: "میانبرها", en: "Shortcuts" },
  "welcome.personalizeTitle": { fa: "مال خودت کن", en: "Make it yours" },
  "welcome.personalizeSubtitle": {
    fa: "شهرت را انتخاب کن. اگر بخواهی، سایت‌های پرتکرارت هم خودکار اضافه می‌شوند.",
    en: "Pick your city. If you like, your most-visited sites can be added automatically.",
  },
  "welcome.autoTitle": { fa: "سایت‌های پرتکرار", en: "Most-visited sites" },
  "welcome.autoDesc": {
    fa: "فقط روی همین دستگاه خوانده می‌شوند و جایی ارسال نمی‌شوند. هر زمان می‌توانی خاموشش کنی.",
    en: "Read only on this device and never sent anywhere. You can turn it off at any time.",
  },
  "welcome.autoGrant": { fa: "فعال‌کردن پیشنهادها", en: "Enable suggestions" },
  "welcome.autoWorking": { fa: "در حال دریافت اجازه…", en: "Requesting permission…" },
  "welcome.autoDenied": {
    fa: "اجازه داده نشد؛ بدون آن هم همه‌چیز کار می‌کند.",
    en: "Permission was not granted; everything still works without it.",
  },
  "welcome.skip": { fa: "رد کردن", en: "Skip" },
  "welcome.back": { fa: "بازگشت", en: "Back" },
  "welcome.next": { fa: "بعدی", en: "Next" },
  "welcome.start": { fa: "شروع", en: "Start" },

  "settings.widgetLayoutLabel": { fa: "مدل نمایش ابزارک‌ها", en: "Widget layout" },
  "settings.layoutBalanced": { fa: "متعادل", en: "Balanced" },
  "settings.layoutMinimalSoon": { fa: "مینیمال (بزودی)", en: "Minimal (soon)" },
  "settings.languageLabel": { fa: "زبان", en: "Language" },

  "settings.paletteLabel": { fa: "پالت رنگی", en: "Color palette" },
  "theme.light": { fa: "روشن", en: "Light" },
  "theme.dark": { fa: "تیره", en: "Dark" },
  "theme.auto": { fa: "خودکار", en: "Auto" },
  "settings.widgetAlignLabel": { fa: "چیدمان ابزارک‌ها", en: "Widget alignment" },
  "align.center": { fa: "در مرکز", en: "Centered" },
  "align.centerDesc": { fa: "ابزارک‌ها در مرکز جمع می‌شوند", en: "Widgets gather in the center" },
  "align.top": { fa: "رو به بالا", en: "Top-aligned" },
  "align.topDesc": { fa: "ابزارک‌ها به سمت بالای صفحه می‌روند", en: "Widgets move toward the top of the page" },

  "bg.default": { fa: "پیش‌فرض", en: "Default" },
  "bg.random": { fa: "تصادفی", en: "Random" },
  "bg.uploadImage": { fa: "بارگذاری تصویر", en: "Upload image" },
  "bg.dimLabel": { fa: "تیرگی", en: "Dim" },
  "bg.blurLabel": { fa: "محو‌شدگی", en: "Blur" },

  "settings.clockFaceLabel": { fa: "صفحه ساعت", en: "Clock face" },
  "clockFace.digital": { fa: "دیجیتال", en: "Digital" },
  "clockFace.classic": { fa: "کلاسیک", en: "Classic" },
  "clockFace.modern": { fa: "مدرن", en: "Modern" },
  "settings.tempUnitLabel": { fa: "واحد دما", en: "Temperature unit" },
  "unit.celsius": { fa: "سلسیوس °C", en: "Celsius °C" },
  "unit.fahrenheit": { fa: "فارنهایت °F", en: "Fahrenheit °F" },

  "settings.calendarTypeLabel": { fa: "نوع تقویم", en: "Calendar type" },
  "cal.persian": { fa: "هجری شمسی", en: "Solar Hijri" },
  "cal.hijri": { fa: "هجری قمری", en: "Lunar Hijri" },
  "cal.gregory": { fa: "میلادی", en: "Gregorian" },
  "settings.showOccasionsLabel": { fa: "نشان دادن مناسبت‌ها", en: "Show occasions" },
  "occ.nationalLabel": { fa: "مناسبت‌های ملی", en: "National occasions" },
  "occ.nationalDesc": { fa: "مثل نوروز و شب یلدا", en: "Like Nowruz and Yalda Night" },
  "occ.religiousLabel": { fa: "مناسبت‌های مذهبی", en: "Religious occasions" },
  "occ.religiousDesc": {
    fa: "مثل عید فطر و تولد امام علی",
    en: "Like Eid al-Fitr and Imam Ali's birthday",
  },
  "occ.internationalLabel": { fa: "مناسبت‌های بین‌المللی", en: "International occasions" },
  "occ.internationalDesc": { fa: "مثل روز جهانی مادر", en: "Like World Mother's Day" },
  "occ.culturalLabel": { fa: "جشن‌های باستانی و فرهنگی", en: "Ancient & cultural festivals" },
  "occ.culturalDesc": { fa: "مثل جشن سده و مهرگان", en: "Like Sadeh and Mehregan" },

  "settings.showPrayerTimesLabel": { fa: "نمایش اوقات شرعی", en: "Show prayer times" },
  "settings.showPrayerTimesDesc": {
    fa: "نمای کوچکی از اذان بعدی را کنار سایر موارد نشان می‌دهد",
    en: "Shows a small next-prayer indicator alongside other items",
  },

  "settings.backupLabel": { fa: "پشتیبان‌گیری و بازیابی", en: "Backup & restore" },
  "about.exportBtn": { fa: "خروجی گرفتن تنظیمات", en: "Export settings" },
  "about.importBtn": { fa: "وارد کردن تنظیمات", en: "Import settings" },
  "about.resetBtn": { fa: "بازنشانی به پیش‌فرض", en: "Reset to defaults" },
  "about.importSuccess": { fa: "تنظیمات با موفقیت وارد شد", en: "Settings imported successfully" },
  "about.importError": { fa: "فایل نامعتبر است", en: "Invalid file" },

  "toggle.defaultLabel": { fa: "تغییر وضعیت", en: "Toggle" },
};

export type MessageKey = keyof typeof dict;

export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  let text = dict[key][app.locale];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, String(v));
  }
  return text;
}
