// =============================================================================
// translations.js
// All English, Urdu & Pashto text for Bijli-Dost
// =============================================================================

export const translations = {
  en: {
    // Auth Screen
    authWhatName:     "What should we call you?",
    authHint:         "Enter your name once — we'll remember it forever.",
    authPlaceholder:  "e.g. Usman",
    authBtn:          "Let's Go ⚡",
    authSelectLang:   "Select Language",
    authLangHint:     "You can change this anytime from the home screen",

    // Home Screen
    welcome:          "Welcome",
    heroTagline:      "AI Electricity Slab Scheduler",
    heroDesc:         "Protecting Pakistani households from accidentally crossing the NEPRA 199-unit protected slab limit",
    nepraBtn:         "🏛️ Powered by NEPRA Guidelines",
    langToggle:       "English / اُردُو / پښتو",

    // DISCO Card
    discoTitle:       "Your Electricity Company",
    discoSub:         "Select your regional DISCO / WAPDA provider",
    discoPlaceholder: "Tap to select your company →",
    discoNote:        "ⓘ All DISCO companies follow NEPRA's 199-unit protected slab rule",
    discoModalTitle:  "🇵🇰 Select Your DISCO Company",
    discoModalSub:    "All companies follow NEPRA's 199-unit rule",

    // Billing Card
    billingTitle:     "Billing Information",
    billingSub:       "From your WAPDA/DISCO bill",
    unitsLabel:       "Units Consumed This Month",
    daysLabel:        "Days Remaining in Billing Cycle",
    scanTitle:        "Scan Your Bill Instead",
    scanSub:          "Gemini AI reads meter readings automatically",

    // Status
    safe:             "✅  SAFE",
    warning:          "⚠️  WARNING",
    critical:         "🔴  CRITICAL",
    exceeded:         "❌  EXCEEDED",
    used:             "Used",
    remaining:        "Remaining",
    nepraLimit:       "NEPRA Limit",

    // Button
    runAI:            "⚡  Run AI Scheduler",

    // How it works
    howTitle:         "How It Works",
    step1Title:       "Select Your DISCO Company",
    step1Desc:        "Choose your regional electricity provider anywhere in Pakistan",
    step2Title:       "Enter Your Billing Info",
    step2Desc:        "Input units consumed and days remaining from your bill",
    step3Title:       "Select Your Appliances",
    step3Desc:        "Choose appliances and set your preferred daily hours",
    step4Title:       "Get AI Optimized Schedule",
    step4Desc:        "AI calculates the safest schedule to protect your slab",

    // Footer
    about:            "About",
    help:             "Help",
    contact:          "Contact",
    rate:             "Rate App",
    copyright:        "© 2026 Bijli-Dost · v1.0.0 · Pakistan",
    byNitrosoft:      "by NITROSOFT",

    // Modals
    nepraModalTitle:  "🏛️ NEPRA Guidelines",
    aboutModalTitle:  "⚡ About Bijli-Dost",
    helpModalTitle:   "❓ Help & FAQ",
    contactModalTitle:"📞 Contact Us",
    close:            "Close",

    // Alerts
    selectCompany:    "Select Company",
    selectCompanyMsg: "Please select your electricity distribution company.",
    invalidInput:     "Invalid Input",
    invalidUnits:     "Please enter units between 0 and 199.",
    invalidDays:      "Please enter days between 1 and 30.",
    readingApplied:   "✅ Reading Applied!",
    
    // Appliance Screen
    applianceTitle:    'Select Appliances',
    applianceSub:      'Choose appliances and set daily hours',
    applianceSelected: 'selected',
    applianceHours:    'hrs/day',
    applianceNone:     'No appliances selected yet',
    applianceMin:      'Min',
    applianceMax:      'Max',
    applianceWatts:    'watts',

    // Result Screen
    resultTitle:       'AI Schedule',
    statusSafe:        '✅ STATUS: SAFE',
    statusWarning:     '⚠️ STATUS: WARNING',
    statusCritical:    '🔴 STATUS: CRITICAL',
    statusExceeded:    '❌ STATUS: EXCEEDED',
    totalUnits:        'TOTAL UNITS',
    dailyUsage:        'DAILY USAGE',
    safetyBuffer:      'SAFETY BUFFER',
    dailyBudget:       'DAILY BUDGET',
    kwhProjected:      'kWh projected',
    kwhDay:            'kWh/day',
    unitsSaved:        'units saved',
    kwhAllowed:        'kWh allowed',
    optimizedSchedule: '📋 Optimized Schedule',
    bijliTips:         '💡 Bijli-Dost Tips',
    tryDifferent:      '← Try Different Appliances',
    startOver:         '🏠 Start Over',

    // Bill Scanner Screen
    billScannerTitle:  'Bill Scanner',
    billScannerDesc:   'Take a photo of your electricity bill and our AI will automatically read your meter units',
    howToScan:         '📋 How to Scan',
    scanStep1:         'Take a clear photo of your electricity bill',
    scanStep2:         'Make sure meter readings are visible',
    scanStep3:         'Tap "Scan with AI" to extract units',
    scanStep4:         'Confirm and continue to scheduler',
    takePhoto:         'Take Photo',
    gallery:           'Gallery',
    scanWithAI:        'Scan with Gemini AI',
    scanning:          'Scanning...',
    useReading:        '✅ Use This Reading',
    scanAgain:         '🔄 Scan Again',
  },

  ur: {
    // Auth Screen
    authWhatName:     "آپ کا نام کیا ہے؟",
    authHint:         "ایک بار نام درج کریں — ہم اسے ہمیشہ یاد رکھیں گے",
    authPlaceholder:  "مثلاً عثمان",
    authBtn:          "چلیں شروع کریں ⚡",
    authSelectLang:   "زبان منتخب کریں",
    authLangHint:     "آپ اسے ہوم اسکرین سے کسی بھی وقت تبدیل کر سکتے ہیں",

    // Home Screen
    welcome:          "خوش آمدید",
    heroTagline:      "اے آئی بجلی سلیب شیڈیولر",
    heroDesc:         "پاکستانی گھرانوں کو نیپرا کی 199 یونٹ حد سے بچانا",
    nepraBtn:         "🏛️ نیپرا گائیڈ لائنز",
    langToggle:       "English / اُردُو / پښتو",

    // DISCO Card
    discoTitle:       "آپ کی بجلی کمپنی",
    discoSub:         "اپنا علاقائی ڈسکو / واپڈا فراہم کنندہ منتخب کریں",
    discoPlaceholder: "اپنی کمپنی منتخب کریں ←",
    discoNote:        "ⓘ تمام ڈسکو کمپنیاں نیپرا کے 199 یونٹ قانون پر عمل کرتی ہیں",
    discoModalTitle:  "🇵🇰 اپنی ڈسکو کمپنی منتخب کریں",
    discoModalSub:    "تمام کمپنیاں نیپرا کے 199 یونٹ قانون پر عمل کرتی ہیں",

    // Billing Card
    billingTitle:     "بلنگ کی معلومات",
    billingSub:       "اپنے واپڈا / ڈسکو بل سے",
    unitsLabel:       "اس مہینے استعمال شدہ یونٹس",
    daysLabel:        "بلنگ سائیکل میں باقی دن",
    scanTitle:        "اپنا بل اسکین کریں",
    scanSub:          "جیمنی اے آئی خود بخود میٹر ریڈنگ پڑھتا ہے",

    // Status
    safe:             "✅  محفوظ",
    warning:          "⚠️  انتباہ",
    critical:         "🔴  خطرناک",
    exceeded:         "❌  حد سے زیادہ",
    used:             "استعمال",
    remaining:        "باقی",
    nepraLimit:       "نیپرا حد",

    // Button
    runAI:            "⚡  اے آئی شیڈیولر چلائیں",

    // How it works
    howTitle:         "یہ کیسے کام کرتا ہے",
    step1Title:       "اپنی ڈسکو کمپنی منتخب کریں",
    step1Desc:        "پاکستان میں کہیں بھی اپنا علاقائی بجلی فراہم کنندہ منتخب کریں",
    step2Title:       "بلنگ کی معلومات درج کریں",
    step2Desc:        "اپنے بل سے استعمال شدہ یونٹس اور باقی دن درج کریں",
    step3Title:       "اپنے آلات منتخب کریں",
    step3Desc:        "آلات منتخب کریں اور روزانہ کی گھنٹے ترتیب دیں",
    step4Title:       "اے آئی سے بہترین شیڈول حاصل کریں",
    step4Desc:        "اے آئی آپ کے سلیب کی حفاظت کے لیے محفوظ ترین شیڈول بناتا ہے",

    // Footer
    about:            "ہمارے بارے میں",
    help:             "مدد",
    contact:          "رابطہ",
    rate:             "ریٹنگ دیں",
    copyright:        "© 2026 بجلی دوست · v1.0.0 · پاکستان",
    byNitrosoft:      "بذریعہ نائٹروسافٹ",

    // Modals
    nepraModalTitle:  "🏛️ نیپرا گائیڈ لائنز",
    aboutModalTitle:  "⚡ بجلی دوست کے بارے میں",
    helpModalTitle:   "❓ مدد اور سوالات",
    contactModalTitle:"📞 ہم سے رابطہ کریں",
    close:            "بند کریں",

    // Alerts
    selectCompany:    "کمپنی منتخب کریں",
    selectCompanyMsg: "براہ کرم اپنی بجلی تقسیم کمپنی منتخب کریں",
    invalidInput:     "غلط معلومات",
    invalidUnits:     "براہ کرم 0 سے 199 کے درمیان یونٹس درج کریں",
    invalidDays:      "براہ کرم 1 سے 30 کے درمیان دن درج کریں",
    readingApplied:   "✅ ریڈنگ لاگو ہو گئی!",
    
    // Appliance Screen
    applianceTitle:    'آلات منتخب کریں',
    applianceSub:      'آلات منتخب کریں اور روزانہ گھنٹے ترتیب دیں',
    applianceSelected: 'منتخب',
    applianceHours:    'گھنٹے/دن',
    applianceNone:     'ابھی تک کوئی آلہ منتخب نہیں',
    applianceMin:      'کم از کم',
    applianceMax:      'زیادہ سے زیادہ',
    applianceWatts:    'واٹس',

    // Result Screen
    resultTitle:       'اے آئی شیڈول',
    statusSafe:        '✅ حالت: محفوظ',
    statusWarning:     '⚠️ حالت: انتباہ',
    statusCritical:    '🔴 حالت: خطرناک',
    statusExceeded:    '❌ حالت: حد سے زیادہ',
    totalUnits:        'کل یونٹس',
    dailyUsage:        'روزانہ استعمال',
    safetyBuffer:      'حفاظتی بفر',
    dailyBudget:       'روزانہ بجٹ',
    kwhProjected:      'kWh متوقع',
    kwhDay:            'kWh/دن',
    unitsSaved:        'یونٹس بچائے',
    kwhAllowed:        'kWh اجازت',
    optimizedSchedule: '📋 بہترین شیڈول',
    bijliTips:         '💡 بجلی دوست ٹپس',
    tryDifferent:      '← مختلف آلات آزمائیں',
    startOver:         '🏠 دوبارہ شروع کریں',

    // Bill Scanner Screen
    billScannerTitle:  'بل اسکینر',
    billScannerDesc:   'اپنے بجلی کے بل کی تصویر لیں اور ہماری اے آئی خود بخود میٹر یونٹس پڑھے گی',
    howToScan:         '📋 اسکین کیسے کریں',
    scanStep1:         'اپنے بجلی کے بل کی واضح تصویر لیں',
    scanStep2:         'یقینی بنائیں کہ میٹر ریڈنگ نظر آ رہی ہے',
    scanStep3:         '"اے آئی سے اسکین کریں" دبائیں',
    scanStep4:         'تصدیق کریں اور شیڈیولر پر جائیں',
    takePhoto:         'تصویر لیں',
    gallery:           'گیلری',
    scanWithAI:        'جیمنی اے آئی سے اسکین کریں',
    scanning:          'اسکین ہو رہا ہے...',
    useReading:        '✅ یہ ریڈنگ استعمال کریں',
    scanAgain:         '🔄 دوبارہ اسکین کریں',
  },

  ps: {
    // Auth Screen
    authWhatName:     "ستاسو نوم څه دی؟",
    authHint:         "خپل نوم یو ځل ولیکئ — موږ به یې تل یاد ساتو",
    authPlaceholder:  "لکه عثمان",
    authBtn:          "راځئ چې پیل وکړو ⚡",
    authSelectLang:   "ژبه وټاکئ",
    authLangHint:     "تاسو کولی شئ دا هر وخت د هوم سکرین څخه بدل کړئ",

    // Home Screen
    welcome:          "ښه راغلاست",
    heroTagline:      "د بریښنا سلیب تنظیمولو لپاره AI",
    heroDesc:         "د نیپرا د 199 یونټو خوندي حد څخه د تیریدو څخه د کورنیو ژغورل",
    nepraBtn:         "🏛️ د نیپرا لارښود",
    langToggle:       "English / اُردُو / پښتو",

    // DISCO Card
    discoTitle:       "ستاسو د بریښنا شرکت",
    discoSub:         "خپل د سیمې ډیسکو / واپډا شرکت وټاکئ",
    discoPlaceholder: "د شرکت ټاکلو لپاره کلیک وکړئ ←",
    discoNote:        "ⓘ ټول ډیسکو شرکتونه د نیپرا د 199 یونټو قانون تعقیبوي",
    discoModalTitle:  "🇵🇰 خپل د ډیسکو شرکت وټاکئ",
    discoModalSub:    "ټول شرکتونه د نیپرا د 199 یونټو قانون تعقیبوي",

    // Billing Card
    billingTitle:     "د بل معلومات",
    billingSub:       "ستاسو د واپډا / ډیسکو بل څخه",
    unitsLabel:       "پدې میاشت کې کارول شوي یونټونه",
    daysLabel:        "د بل په میاشت کې پاتې ورځې",
    scanTitle:        "خپل بل سکین کړئ",
    scanSub:          "جیمني AI په اوتومات ډول د میټر ریډینګ لولي",

    // Status
    safe:             "✅  خوندي",
    warning:          "⚠️  خبرداری",
    critical:         "🔴  خطرناک",
    exceeded:         "❌  حد څخه ډیر",
    used:             "کارول شوي",
    remaining:        "پاتې",
    nepraLimit:       "د نیپرا حد",

    // Button
    runAI:            "⚡  AI شیډولر پیل کړئ",

    // How it works
    howTitle:         "دا څنګه کار کوي",
    step1Title:       "خپل د ډیسکو شرکت وټاکئ",
    step1Desc:        "په ټول پاکستان کې خپل د سیمې د بریښنا شرکت وټاکئ",
    step2Title:       "د خپل بل معلومات دننه کړئ",
    step2Desc:        "د خپل بل څخه کارول شوي یونټونه او پاتې ورځې ولیکئ",
    step3Title:       "خپل وسایل وټاکئ",
    step3Desc:        "وسایل وټاکئ او د ورځې ساعتونه ترتیب کړئ",
    step4Title:       "د AI غوره شیډول ترلاسه کړئ",
    step4Desc:        "AI ستاسو د سلیب ساتلو لپاره ترټولو خوندي شیډول محاسبه کوي",

    // Footer
    about:            "په اړه",
    help:             "مرسته",
    contact:          "اړیکه",
    rate:             "اپلیکیشن ته رایه ورکړئ",
    copyright:        "© 2026 بجلی دوست · v1.0.0 · پاکستان",
    byNitrosoft:      "د نایټروسافٹ لخوا",

    // Modals
    nepraModalTitle:  "🏛️ د نیپرا لارښود",
    aboutModalTitle:  "⚡ د بجلی دوست په اړه",
    helpModalTitle:   "❓ مرسته او پوښتنې",
    contactModalTitle:"📞 له موږ سره اړیکه ونیسئ",
    close:            "بند کړئ",

    // Alerts
    selectCompany:    "شرکت وټاکئ",
    selectCompanyMsg: "مهرباني وکړئ د بریښنا توزیع شرکت وټاکئ.",
    invalidInput:     "ناسمه معلومات",
    invalidUnits:     "مهرباني وکړئ د 0 او 199 ترمنځ یونټونه ولیکئ.",
    invalidDays:      "مهرباني وکړئ د 1 او 30 ترمنځ ورځې ولیکئ.",
    readingApplied:   "✅ ریډینګ تایید شو!",
    
    // Appliance Screen
    applianceTitle:    'وسایل وټاکئ',
    applianceSub:      'وسایل وټاکئ او د ورځې ساعتونه ترتیب کړئ',
    applianceSelected: 'غوره شوي',
    applianceHours:    'ساعتونه/ورځ',
    applianceNone:     'تر اوسه کوم وسیله نه ده ټاکل شوې',
    applianceMin:      'کمترلږه',
    applianceMax:      'زیاتترلږه',
    applianceWatts:    'واټه',

    // Result Screen
    resultTitle:       'د AI شیډول',
    statusSafe:        '✅ حالت: خوندي',
    statusWarning:     '⚠️ حالت: خبرداری',
    statusCritical:    '🔴 حالت: خطرناک',
    statusExceeded:    '❌ حالت: حد څخه ډیر',
    totalUnits:        'ټول یونټونه',
    dailyUsage:        'ورځنی کارول',
    safetyBuffer:      'د خوندیتوب بفر',
    dailyBudget:       'ورځنی بجټ',
    kwhProjected:      'اټکل شوی kWh',
    kwhDay:            'kWh/ورځ',
    unitsSaved:        'ساتل شوي یونټونه',
    kwhAllowed:        'د kWh اجازه',
    optimizedSchedule: '📋 غوره شوی شیډول',
    bijliTips:         '💡 د بجلی دوست لارښوونې',
    tryDifferent:      '← مختلف وسایل وازموئ',
    startOver:         '🏠 بیا پیل کړئ',

    // Bill Scanner Screen
    billScannerTitle:  'بل سکینر',
    billScannerDesc:   'د خپل بریښنا بل عکس واخلئ او زموږ AI به په اوتومات ډول ستاسو یونټونه ولولي',
    howToScan:         '📋 څنګه سکین کړئ',
    scanStep1:         'د خپل بریښنا بل روښانه عکس واخلئ',
    scanStep2:         'ډاډ ترلاسه کړئ چې د میټر ریډینګ څرګند دی',
    scanStep3:         'د یونټونو لوستلو لپاره "د AI سره سکین کړئ" کیکاږئ',
    scanStep4:         'تایید کړئ او شیډولر ته لاړشئ',
    takePhoto:         'عکس واخلئ',
    gallery:           'ګالري',
    scanWithAI:        'د جیمني AI سره سکین کړئ',
    scanning:          'سکین کیږي...',
    useReading:        '✅ دا ریډینګ وکاروئ',
    scanAgain:         '🔄 بیا سکین کړئ',
  }
};