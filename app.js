const slider = document.querySelector('[data-slider]');
const slides = Array.from(slider.querySelectorAll('.slide'));
const dotsContainer = slider.querySelector('[data-dots]');
let index = 0;

slides.forEach((_, i) => {
  const btn = document.createElement('button');
  btn.setAttribute('aria-label', `شريحة ${i + 1}`);
  if (i === 0) btn.classList.add('is-active');
  btn.addEventListener('click', () => setSlide(i));
  dotsContainer.appendChild(btn);
});

const dots = Array.from(dotsContainer.querySelectorAll('button'));
const odooConfig = window.ODOO_CONFIG || {};
const DEFAULT_PRODUCT_PRICE = '00.00 دينار كويتي';
const DEFAULT_PRODUCT_PRICE_EN = '00.00 KWD';
const DEFAULT_PRODUCT_RATING = '4.8';

function setSlide(next) {
  slides[index].classList.remove('is-active');
  dots[index].classList.remove('is-active');
  index = next;
  slides[index].classList.add('is-active');
  dots[index].classList.add('is-active');
}

setInterval(() => {
  setSlide((index + 1) % slides.length);
}, 6000);

const langButtons = document.querySelectorAll('.lang');
const sectionCardEnMap = {
  'قسم الهيكل الاسود': 'Black Structure Section',
  'قسم المساح': 'Surveying Section',
  'قسم الاصباغ الداخلية': 'Interior Paints Section',
  'قسم الاصباغ الخارجية والسيجما': 'Exterior Paints & Sigma Section',
  'قسم العازل': 'Insulation Section'
};
const productNameEnMap = {
  'حديد': 'Rebar Steel',
  'اسمنت اسود': 'Black Cement',
  'طابوق ابيض': 'White Blocks',
  'طابوق اسود': 'Black Blocks',
  'مونه طابوق': 'Block Mortar',
  'شبك حديد': 'Steel Mesh',
  'عتب ابيض': 'White Lintel',
  'شبك سعودي 1.100 جرام': 'Saudi Mesh 1.100 g',
  'شبك سعودي 800 جرام': 'Saudi Mesh 800 g',
  'شبك كويتي 1.100 جرام': 'Kuwaiti Mesh 1.100 g',
  'شبك كويتي 800 جرام': 'Kuwaiti Mesh 800 g',
  'زوايا كاتنك': 'Cutting Angles',
  'فواصل كاتنك': 'Cutting Spacers',
  'نهايه كاتنك': 'Cutting End Caps',
  'زوايا اكسبامت': 'Expamet Angles',
  'فواصل اكسبامت': 'Expamet Spacers',
  'نهايه اكسبامت': 'Expamet End Caps',
  'مسمار نجار خشابي': 'Carpenter Nail',
  'مسمار فوالذ هولندر': 'Dutch Steel Nail',
  'سلبوخ امراتي': 'UAE Aggregate',
  'سيم تربيط': 'Binding Wire',
  'شبك اخضر': 'Green Mesh',
  'عربانه فرنسي': 'French Wheelbarrow',
  'شبل حديد': 'Metal Shovel',
  'هوز ايطالي': 'Italian Hose',
  'مستر المنيوم': 'Aluminum Straightedge',
  'رمل مساح': 'Surveying Sand',
  'وشر مساح': 'Surveying Washer',
  'معجون جوتن': 'Jotun Putty',
  'املشن جي تي سي': 'GTC Emulsion',
  'مجحاف': 'Trowel',
  'سكين امريكي': 'American Putty Knife',
  'فرشه': 'Brush',
  'عازل الخليج': 'Gulf Insulation',
  'عازل سعودي': 'Saudi Insulation',
  'عازل كويتي': 'Kuwaiti Insulation',
  'زفته كاب سيل': 'Cap Seal Bitumen',
  'زفته كاب بريمر': 'Cap Primer Bitumen',
  'سيجما همبل': 'Sigma Hempel',
  'سيجما سعودي': 'Saudi Sigma',
  'سيجما كي بي سي': 'Sigma KPC'
};

document.querySelectorAll('.product h3').forEach((title) => {
  const arName = title.textContent.trim();
  if (!title.dataset.en && productNameEnMap[arName]) {
    title.dataset.en = productNameEnMap[arName];
  }
});

document.querySelectorAll('.grid--cards h3').forEach((title) => {
  const arName = title.textContent.trim();
  if (!title.dataset.en && sectionCardEnMap[arName]) {
    title.dataset.en = sectionCardEnMap[arName];
  }
});

function setLang(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  langButtons.forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.lang === lang);
  });

  document.querySelectorAll('[data-en]').forEach((el) => {
    if (!el.dataset.ar) {
      el.dataset.ar = el.textContent;
    }
    el.textContent = lang === 'en' ? el.dataset.en : el.dataset.ar;
  });

  document.querySelectorAll('[data-placeholder-en]').forEach((input) => {
    if (!input.dataset.placeholderAr) {
      input.dataset.placeholderAr = input.getAttribute('placeholder') || '';
    }
    input.setAttribute(
      'placeholder',
      lang === 'en' ? input.dataset.placeholderEn : input.dataset.placeholderAr
    );
  });

  if (themeToggle) {
    themeToggle.setAttribute('aria-label', lang === 'en' ? 'Toggle theme' : 'تبديل الوضع');
    themeToggle.textContent = '🌓';
  }

  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

langButtons.forEach((btn) => {
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
});

if (odooConfig.enabled && odooConfig.shopUrl) {
  document.querySelectorAll('[data-odoo-store-link]').forEach((link) => {
    link.setAttribute('href', odooConfig.shopUrl);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener');
  });
}

function getCssVarUrl(styleValue, key) {
  const re = new RegExp(`${key}:\\s*url\\(['"]?([^'")]+)['"]?\\)`);
  const match = String(styleValue || '').match(re);
  return match ? match[1] : '';
}

function buildProductDetailsUrl(card) {
  const titleEl = card.querySelector('h3');
  const imageEl = card.querySelector('.product__img');
  const priceEl = card.querySelector('.product__price');
  const nameAr = titleEl?.dataset.ar || titleEl?.textContent?.trim() || '';
  const nameEn = titleEl?.dataset.en || nameAr;
  const image = getCssVarUrl(imageEl?.getAttribute('style') || '', '--img');
  const price = (priceEl?.dataset.priceAr || card.dataset.price || DEFAULT_PRODUCT_PRICE).trim();
  const rating = card.dataset.rating || DEFAULT_PRODUCT_RATING;
  const params = new URLSearchParams({
    nameAr,
    nameEn,
    image,
    price,
    rating
  });
  return `product.html?${params.toString()}`;
}

function ensureDetailsButtons() {
  document.querySelectorAll('.product').forEach((card) => {
    const existingPriceEl = card.querySelector('.product__price');
    if (!existingPriceEl) {
      if (!card.dataset.price) card.dataset.price = DEFAULT_PRODUCT_PRICE;
      if (!card.dataset.priceEn) card.dataset.priceEn = DEFAULT_PRODUCT_PRICE_EN;
      const priceEl = document.createElement('p');
      priceEl.className = 'product__price';
      priceEl.dataset.priceAr = card.dataset.price || DEFAULT_PRODUCT_PRICE;
      priceEl.dataset.priceEn = card.dataset.priceEn || DEFAULT_PRODUCT_PRICE_EN;
      priceEl.textContent = document.documentElement.lang === 'en'
        ? `Price: ${priceEl.dataset.priceEn}`
        : `السعر: ${priceEl.dataset.priceAr}`;
      const titleEl = card.querySelector('h3');
      if (titleEl && titleEl.nextSibling) {
        card.insertBefore(priceEl, titleEl.nextSibling);
      } else {
        card.appendChild(priceEl);
      }
    } else {
      const priceEl = existingPriceEl;
      if (!priceEl.dataset.priceAr) {
        priceEl.dataset.priceAr = normalizePriceText(priceEl.textContent, 'ar') || DEFAULT_PRODUCT_PRICE;
      }
      if (!priceEl.dataset.priceEn) {
        priceEl.dataset.priceEn = normalizePriceText(priceEl.dataset.en || '', 'en') || DEFAULT_PRODUCT_PRICE_EN;
      }
      if (!card.dataset.price) card.dataset.price = priceEl.dataset.priceAr || DEFAULT_PRODUCT_PRICE;
      if (!card.dataset.priceEn) card.dataset.priceEn = priceEl.dataset.priceEn || DEFAULT_PRODUCT_PRICE_EN;
    }

    if (card.querySelector('[data-action="details"]')) return;
    const detailsBtn = document.createElement('button');
    detailsBtn.type = 'button';
    detailsBtn.dataset.action = 'details';
    detailsBtn.className = 'product-details-btn';
    detailsBtn.dataset.en = 'View Product';
    detailsBtn.textContent = 'عرض المنتج';
    card.appendChild(detailsBtn);
  });
}

function normalizePriceText(raw, lang) {
  const text = String(raw || '').trim();
  if (!text) {
    return lang === 'en' ? DEFAULT_PRODUCT_PRICE_EN : DEFAULT_PRODUCT_PRICE;
  }
  if (lang === 'en') {
    return text.replace(/^price\s*:\s*/i, '').trim() || DEFAULT_PRODUCT_PRICE_EN;
  }
  return text.replace(/^السعر\s*:\s*/, '').trim() || DEFAULT_PRODUCT_PRICE;
}

function updateProductPricesLang() {
  document.querySelectorAll('.product .product__price').forEach((priceEl) => {
    const ar = priceEl.dataset.priceAr || DEFAULT_PRODUCT_PRICE;
    const en = priceEl.dataset.priceEn || DEFAULT_PRODUCT_PRICE_EN;
    priceEl.textContent = document.documentElement.lang === 'en' ? `Price: ${en}` : `السعر: ${ar}`;
  });
}

function persistPriceElement(priceEl) {
  if (!priceEl) return;
  const card = priceEl.closest('.product');
  if (!card) return;
  const lang = document.documentElement.lang === 'en' ? 'en' : 'ar';
  const value = normalizePriceText(priceEl.textContent, lang);
  if (lang === 'en') {
    priceEl.dataset.priceEn = value;
    if (!priceEl.dataset.priceAr) priceEl.dataset.priceAr = card.dataset.price || DEFAULT_PRODUCT_PRICE;
    card.dataset.priceEn = value;
  } else {
    priceEl.dataset.priceAr = value;
    if (!priceEl.dataset.priceEn) priceEl.dataset.priceEn = card.dataset.priceEn || DEFAULT_PRODUCT_PRICE_EN;
    card.dataset.price = value;
  }
}

ensureDetailsButtons();
updateProductPricesLang();
const productsObserver = new MutationObserver(() => ensureDetailsButtons());
productsObserver.observe(document.body, { childList: true, subtree: true });

const whatsappPhone = '96566871081';
document.addEventListener('click', (event) => {
  const btn = event.target.closest('.product button');
  if (!btn) return;

  const card = btn.closest('.product');
  if (!card) return;

  if (btn.dataset.action === 'details') {
    event.preventDefault();
    window.location.href = buildProductDetailsUrl(card);
    return;
  }

  event.preventDefault();
  const title = card ? card.querySelector('h3')?.textContent?.trim() : '';
  const prefix = document.documentElement.lang === 'en' ? 'I would like to order: ' : 'ارغب بطلب: ';
  const fallback = document.documentElement.lang === 'en' ? 'I want to place an order' : 'ارغب بالطلب';
  const msg = title ? `${prefix}${title}` : fallback;
  const url = `https://api.whatsapp.com/send?phone=${whatsappPhone}&text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
});

document.addEventListener('blur', (event) => {
  const priceEl = event.target.closest('.product__price');
  if (!priceEl) return;
  persistPriceElement(priceEl);
  updateProductPricesLang();
}, true);

document.addEventListener('input', (event) => {
  const priceEl = event.target.closest('.product__price');
  if (!priceEl) return;
  persistPriceElement(priceEl);
}, true);

const themeToggle = document.querySelector('.theme-toggle');
const previewModeToggle = document.querySelector('.preview-mode-toggle');
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('theme-dark');
}

const savedPreviewMode = localStorage.getItem('previewMode');
if (savedPreviewMode === 'mobile') {
  document.body.classList.add('preview-mobile');
}

if (themeToggle) {
  themeToggle.textContent = '🌓';
}

function updatePreviewToggleLabel() {
  if (!previewModeToggle) return;
  const isMobilePreview = document.body.classList.contains('preview-mobile');
  const isEn = document.documentElement.lang === 'en';
  if (isMobilePreview) {
    previewModeToggle.textContent = isEn ? 'Desktop Preview' : 'نسخة الديسكتوب';
  } else {
    previewModeToggle.textContent = isEn ? 'Mobile Preview' : 'نسخة الموبايل';
  }
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('theme-dark');
    localStorage.setItem('theme', document.body.classList.contains('theme-dark') ? 'dark' : 'light');
  });
}

if (previewModeToggle) {
  previewModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('preview-mobile');
    localStorage.setItem('previewMode', document.body.classList.contains('preview-mobile') ? 'mobile' : 'desktop');
    updatePreviewToggleLabel();
  });
}

document.addEventListener('langchange', updatePreviewToggleLabel);
document.addEventListener('langchange', updateProductPricesLang);
updateProductPricesLang();
updatePreviewToggleLabel();
