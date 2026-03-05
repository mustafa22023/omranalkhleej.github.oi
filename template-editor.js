(function () {
  const STORAGE_KEY = 'imran-template-config-v2';
  const LEGACY_STORAGE_KEYS = ['imran-template-config-v1', 'imran-template-config-v0'];
  const STORAGE_BACKUP_KEY = 'imran-template-config-backup';
  const PUBLISH_SETTINGS_KEY = 'imran-publish-settings-v2';
  const PUBLISHED_CONFIG_PATH = 'site-config.json';
  const LEGACY_PUBLISHED_CONFIG_PATH = 'site-config2.json';
  const isDeveloper = new URLSearchParams(location.search).get('developer') === '1';
  const forceClean = new URLSearchParams(location.search).get('clean') === '1';

  const editableTextSelectors = [
    '.logo__title', '.logo__subtitle', '.nav__links a', '.mobile-nav a', '.slide h1', '.slide p', '.slide .btn',
    '.section__head h2', '.section__all', '.grid--cards h3', '.product h3', '.product__price', '.product button',
    '.contact__card h3', '.contact__card p', '.contact__card .btn', '.login__hint', '.about',
    '.footer h3', '.footer h4', '.footer p', '.footer li a', '.footer__bottom'
  ];

  const editableImageSelectors = ['.logo img', '.slide', '.card__img', '.section-banner img', '.product__img'];

  const initialConfig = {
    texts: {},
    images: {},
    colors: {
      lightBg: '#d8f0ef',
      brand: '#1e66f5',
      brandMid: '#2f8bff',
      brandDark: '#0f4ecf',
      darkBg: '#072c54',
      darkCard: '#0b355f'
    },
    structure: {
      addedSections: [],
      addedProducts: [],
      removedSections: [],
      removedProducts: []
    }
  };

  let config = deepClone(initialConfig);
  let textMode = false;
  let imageMode = false;
  let deleteMode = false;
  let clearImageMode = false;
  let copyPasteMode = false;

  const hiddenFileInput = document.createElement('input');
  hiddenFileInput.type = 'file';
  hiddenFileInput.accept = 'image/*';
  hiddenFileInput.style.display = 'none';
  document.body.appendChild(hiddenFileInput);

  init();

  async function init() {
    if (forceClean) {
      clearLocalConfig();
    }

    // Client view must rely on published config only to avoid stale local overrides.
    const localConfig = isDeveloper ? loadLocalConfig() : deepClone(initialConfig);
    const publishedConfig = await loadPublishedConfig();

    config = normalizeConfig({
      texts: { ...(publishedConfig.texts || {}), ...(localConfig.texts || {}) },
      images: { ...(publishedConfig.images || {}), ...(localConfig.images || {}) },
      colors: { ...initialConfig.colors, ...(publishedConfig.colors || {}), ...(localConfig.colors || {}) },
      structure: {
        addedSections: uniqById([...(publishedConfig.structure?.addedSections || []), ...(localConfig.structure?.addedSections || [])]),
        addedProducts: uniqById([...(publishedConfig.structure?.addedProducts || []), ...(localConfig.structure?.addedProducts || [])]),
        removedSections: uniq([...(publishedConfig.structure?.removedSections || []), ...(localConfig.structure?.removedSections || [])]),
        removedProducts: uniq([...(publishedConfig.structure?.removedProducts || []), ...(localConfig.structure?.removedProducts || [])])
      }
    });

    assignStableIdsForCurrentDom();
    applyStructureFromConfig();
    assignTemplateIds();
    applySavedTexts();
    applySavedImages();
    applySavedColors();

    if (isDeveloper) {
      buildClientQuickButton();
      buildDeveloperUI();
    }
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function uniq(arr) {
    return Array.from(new Set(arr));
  }

  function uniqById(arr) {
    const map = new Map();
    arr.forEach((item) => {
      if (item && item.id) map.set(item.id, item);
    });
    return Array.from(map.values());
  }

  function normalizeConfig(maybeConfig) {
    return {
      texts: maybeConfig.texts || {},
      images: maybeConfig.images || {},
      colors: { ...initialConfig.colors, ...(maybeConfig.colors || {}) },
      structure: {
        addedSections: maybeConfig.structure?.addedSections || [],
        addedProducts: maybeConfig.structure?.addedProducts || [],
        removedSections: maybeConfig.structure?.removedSections || [],
        removedProducts: maybeConfig.structure?.removedProducts || []
      }
    };
  }

  function loadLocalConfig() {
    try {
      const keys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS, STORAGE_BACKUP_KEY];
      let merged = deepClone(initialConfig);
      let foundAny = false;

      keys.forEach((key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        try {
          const parsed = normalizeConfig(JSON.parse(raw));
          merged = normalizeConfig({
            texts: { ...(merged.texts || {}), ...(parsed.texts || {}) },
            images: { ...(merged.images || {}), ...(parsed.images || {}) },
            colors: { ...(merged.colors || {}), ...(parsed.colors || {}) },
            structure: {
              addedSections: uniqById([...(merged.structure?.addedSections || []), ...(parsed.structure?.addedSections || [])]),
              addedProducts: uniqById([...(merged.structure?.addedProducts || []), ...(parsed.structure?.addedProducts || [])]),
              removedSections: uniq([...(merged.structure?.removedSections || []), ...(parsed.structure?.removedSections || [])]),
              removedProducts: uniq([...(merged.structure?.removedProducts || []), ...(parsed.structure?.removedProducts || [])])
            }
          });
          foundAny = true;
        } catch (_) {}
      });

      return foundAny ? merged : deepClone(initialConfig);
    } catch (_) {
      return deepClone(initialConfig);
    }
  }

  async function loadPublishedConfig() {
    try {
      const ts = Date.now();
      const res = await fetch(`${PUBLISHED_CONFIG_PATH}?t=${ts}`, { cache: 'no-store' });
      if (res.ok) return normalizeConfig(await res.json());

      const legacyRes = await fetch(`${LEGACY_PUBLISHED_CONFIG_PATH}?t=${ts}`, { cache: 'no-store' });
      if (legacyRes.ok) return normalizeConfig(await legacyRes.json());
      return {};
    } catch (_) {
      return {};
    }
  }

  function saveLocalConfig() {
    const payload = JSON.stringify(config);
    localStorage.setItem(STORAGE_KEY, payload);
    localStorage.setItem(STORAGE_BACKUP_KEY, payload);
  }

  function clearLocalConfig() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_BACKUP_KEY);
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  }

  function currentLang() {
    return document.documentElement.lang === 'en' ? 'en' : 'ar';
  }

  function assignStableIdsForCurrentDom() {
    document.querySelectorAll('section.catalog-section').forEach((section) => {
      if (!section.dataset.templateSectionId) {
        section.dataset.templateSectionId = section.id || `section-${Math.random().toString(36).slice(2, 7)}`;
      }
      const sid = section.dataset.templateSectionId;
      section.querySelectorAll('.product').forEach((product, i) => {
        if (!product.dataset.templateProductId) {
          product.dataset.templateProductId = `${sid}::${i + 1}`;
        }
      });
    });
  }

  function assignTemplateIds() {
    const allTextNodes = Array.from(document.querySelectorAll(editableTextSelectors.join(','))).filter((el) => !el.closest('.template-editor-panel'));
    allTextNodes.forEach((el, i) => {
      el.dataset.templateTextId = `t${i + 1}`;
      if (!el.dataset.ar && el.textContent.trim()) el.dataset.ar = el.textContent.trim();
    });

    const allImageNodes = Array.from(document.querySelectorAll(editableImageSelectors.join(','))).filter((el) => !el.closest('.template-editor-panel'));
    allImageNodes.forEach((el, i) => {
      el.dataset.templateImageId = `i${i + 1}`;
    });
  }

  function applyStructureFromConfig() {
    config.structure.removedSections.forEach((sid) => {
      const section = document.querySelector(`section.catalog-section[data-template-section-id="${sid}"]`) || document.getElementById(sid);
      if (section) section.remove();
      document.querySelectorAll(`#store .grid--cards a.card[href="#${sid}"]`).forEach((card) => card.remove());
      document.querySelectorAll(`footer a[href="#${sid}"]`).forEach((a) => a.closest('li')?.remove());
    });

    config.structure.removedProducts.forEach((pid) => {
      document.querySelectorAll(`.product[data-template-product-id="${pid}"]`).forEach((product) => product.remove());
    });

    config.structure.addedSections.forEach((sectionDef) => {
      if (!sectionDef?.id) return;
      if (!document.getElementById(sectionDef.id)) {
        addSectionToDom(sectionDef);
      }
    });

    config.structure.addedProducts.forEach((productDef) => {
      if (!productDef?.id || !productDef.sectionId) return;
      const exists = document.querySelector(`.product[data-template-product-id="${productDef.id}"]`);
      if (!exists) addProductToDom(productDef);
    });

    assignStableIdsForCurrentDom();
  }

  function addSectionToDom(sectionDef) {
    const section = document.createElement('section');
    section.className = 'section catalog-section';
    section.id = sectionDef.id;
    section.dataset.templateSectionId = sectionDef.id;
    section.innerHTML = `
      <div class="section-banner">
        <img src="${sectionDef.banner || ''}" alt="${escapeHtml(sectionDef.titleAr || '')}" />
      </div>
      <div class="section__head">
        <h2 data-en="${escapeHtml(sectionDef.titleEn || sectionDef.titleAr || '')}">${escapeHtml(sectionDef.titleAr || '')}</h2>
        <a class="section__all" href="#${sectionDef.id}" data-en="View all">عرض الكل</a>
      </div>
      <div class="grid grid--products"></div>
    `;

    const contact = document.getElementById('contact');
    if (contact) {
      contact.parentNode.insertBefore(section, contact);
    } else {
      document.querySelector('main')?.appendChild(section);
    }

    addSectionCardToStore(sectionDef);
  }

  function addSectionCardToStore(sectionDef) {
    const cardsGrid = document.querySelector('#store .grid--cards');
    if (!cardsGrid) return;
    if (cardsGrid.querySelector(`a.card[href="#${sectionDef.id}"]`)) return;

    const card = document.createElement('a');
    card.className = 'card';
    card.href = `#${sectionDef.id}`;
    card.innerHTML = `
      <div class="card__img" style="--img:url('${sectionDef.cardImage || sectionDef.banner || ''}');"></div>
      <h3 data-en="${escapeHtml(sectionDef.titleEn || sectionDef.titleAr || '')}">${escapeHtml(sectionDef.titleAr || '')}</h3>
    `;
    cardsGrid.appendChild(card);
  }

  function addProductToDom(productDef) {
    const section = document.getElementById(productDef.sectionId);
    const grid = section?.querySelector('.grid--products');
    if (!grid) return;

    const product = document.createElement('div');
    product.className = 'product';
    product.dataset.templateProductId = productDef.id;
    product.innerHTML = `
      <div class="product__img" style="--img:url('${productDef.image || ''}');"></div>
      <h3 data-en="${escapeHtml(productDef.nameEn || productDef.nameAr || '')}">${escapeHtml(productDef.nameAr || '')}</h3>
      <button data-en="Contact Us">تواصل معنا</button>
    `;

    grid.appendChild(product);
  }

  function duplicateProduct(productEl) {
    const section = productEl.closest('section.catalog-section');
    const sectionId = section?.id;
    if (!sectionId) return;

    const nameAr = productEl.querySelector('h3')?.dataset.ar || productEl.querySelector('h3')?.textContent?.trim() || 'منتج جديد';
    const nameEn = productEl.querySelector('h3')?.dataset.en || nameAr;
    const image = getElementImageUrl(productEl.querySelector('.product__img'));
    const id = `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const productDef = { id, sectionId, nameAr, nameEn, image };

    config.structure.addedProducts = uniqById([...config.structure.addedProducts, productDef]);
    config.structure.removedProducts = config.structure.removedProducts.filter((x) => x !== id);
    addProductToDom(productDef);
    assignTemplateIds();
    saveLocalConfig();
  }

  function duplicateSection(sectionEl) {
    const oldId = sectionEl.id || sectionEl.dataset.templateSectionId || 'section';
    const titleEl = sectionEl.querySelector('.section__head h2');
    const titleAr = titleEl?.dataset.ar || titleEl?.textContent?.trim() || 'قسم جديد';
    const titleEn = titleEl?.dataset.en || titleAr;
    const banner = getElementImageUrl(sectionEl.querySelector('.section-banner img'));
    const sourceCard = document.querySelector(`#store .grid--cards a.card[href="#${oldId}"] .card__img`);
    const cardImage = getElementImageUrl(sourceCard) || banner;
    const id = `${slugify(oldId)}-${Date.now().toString(36).slice(-4)}`;
    if (!id || document.getElementById(id)) return;

    const sectionDef = { id, titleAr, titleEn, banner, cardImage };
    config.structure.addedSections = uniqById([...config.structure.addedSections, sectionDef]);
    config.structure.removedSections = config.structure.removedSections.filter((x) => x !== id);
    addSectionToDom(sectionDef);

    sectionEl.querySelectorAll('.product').forEach((productEl) => {
      const nameAr = productEl.querySelector('h3')?.dataset.ar || productEl.querySelector('h3')?.textContent?.trim() || 'منتج جديد';
      const nameEn = productEl.querySelector('h3')?.dataset.en || nameAr;
      const image = getElementImageUrl(productEl.querySelector('.product__img'));
      const pid = `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const productDef = { id: pid, sectionId: sectionDef.id, nameAr, nameEn, image };
      config.structure.addedProducts = uniqById([...config.structure.addedProducts, productDef]);
      config.structure.removedProducts = config.structure.removedProducts.filter((x) => x !== pid);
      addProductToDom(productDef);
    });

    assignTemplateIds();
    saveLocalConfig();
  }

  function getElementImageUrl(el) {
    if (!el) return '';
    if (el.matches('img')) return el.getAttribute('src') || '';
    const style = el.getAttribute('style') || '';
    const match = style.match(/--(?:img|bg):\s*url\(['"]?([^'")]+)['"]?\)/);
    return match ? match[1] : '';
  }

  function applySavedTexts() {
    document.querySelectorAll('[data-template-text-id]').forEach((el) => {
      const id = el.dataset.templateTextId;
      const saved = config.texts[id];
      if (!saved) return;
      if (saved.ar) el.dataset.ar = saved.ar;
      if (saved.en) el.dataset.en = saved.en;
      el.textContent = currentLang() === 'en' ? (saved.en || el.dataset.en || el.textContent) : (saved.ar || el.dataset.ar || el.textContent);
    });
  }

  function setStyleUrl(el, cssVarName, value) {
    const current = el.getAttribute('style') || '';
    const cleaned = current.replace(new RegExp(`${cssVarName}:\\s*url\\('([^']+)'\\)`), '').trim();
    if (!value) {
      el.setAttribute('style', cleaned);
      return;
    }
    el.setAttribute('style', `${cleaned} ${cssVarName}:url('${value}');`.trim());
  }

  function setImageSource(el, src) {
    if (el.matches('img')) {
      el.setAttribute('src', src || '');
      return;
    }
    if (el.matches('.slide')) {
      setStyleUrl(el, '--bg', src);
      return;
    }
    setStyleUrl(el, '--img', src);
  }

  function applySavedImages() {
    document.querySelectorAll('[data-template-image-id]').forEach((el) => {
      const id = el.dataset.templateImageId;
      const saved = config.images[id];
      if (saved) setImageSource(el, saved);
    });
  }

  function cssColorVars(c) {
    return `
:root {
  --bg: ${c.lightBg};
  --brand: ${c.brand};
  --brand-dark: ${c.brandDark};
  --brand-gradient: linear-gradient(135deg, ${c.brand} 0%, ${c.brandMid} 45%, ${c.brandDark} 100%);
}
body.theme-dark {
  --bg: ${c.darkBg};
  --card: ${c.darkCard};
}
`;
  }

  function applySavedColors() {
    let styleTag = document.getElementById('template-custom-colors');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'template-custom-colors';
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = cssColorVars(config.colors);
  }

  function defaultPublishSettings() {
    const owner = location.hostname.endsWith('.github.io') ? location.hostname.split('.')[0] : 'mustafa22023';
    const repo = location.pathname.split('/').filter(Boolean)[0] || 'omranelkhaleej';
    return { token: '', owner, repo, branch: 'main' };
  }

  function loadPublishSettings() {
    try {
      const raw = localStorage.getItem(PUBLISH_SETTINGS_KEY);
      if (!raw) return defaultPublishSettings();
      return { ...defaultPublishSettings(), ...JSON.parse(raw) };
    } catch (_) {
      return defaultPublishSettings();
    }
  }

  function savePublishSettings(settings) {
    localStorage.setItem(PUBLISH_SETTINGS_KEY, JSON.stringify(settings));
  }

  function getClientViewUrl() {
    const url = new URL(location.href);
    url.searchParams.delete('developer');
    return url.toString();
  }

  function buildClientQuickButton() {
    const clientButton = document.createElement('button');
    clientButton.type = 'button';
    clientButton.className = 'template-client-toggle';
    clientButton.textContent = 'نسخة العميل';
    clientButton.addEventListener('click', () => {
      window.open(getClientViewUrl(), '_blank', 'noopener');
    });
    document.body.appendChild(clientButton);
  }

  function buildPublishQuickButton() {
    const quickPublish = document.createElement('button');
    quickPublish.type = 'button';
    quickPublish.className = 'template-publish-toggle';
    quickPublish.textContent = 'نشر للجميع';

    quickPublish.addEventListener('click', async () => {
      const settings = loadPublishSettings();
      if (!settings.token || !settings.owner || !settings.repo) {
        alert('اكمل بيانات النشر من لوحة المطور أولا.');
        return;
      }

      try {
        const changed = await hasUnpublishedChanges();
        if (!changed) {
          alert('لا توجد تعديلات جديدة للنشر.');
          return;
        }
        quickPublish.disabled = true;
        quickPublish.textContent = 'جاري النشر...';
        await publishToGithub({ ...settings, content: config });
        quickPublish.textContent = 'تم النشر';
        setTimeout(() => {
          quickPublish.textContent = 'نشر للجميع';
          quickPublish.disabled = false;
        }, 1500);
      } catch (err) {
        alert(`فشل النشر: ${formatPublishError(err)}`);
        quickPublish.textContent = 'نشر للجميع';
        quickPublish.disabled = false;
      }
    });

    document.body.appendChild(quickPublish);
  }

  function buildDeveloperUI() {
    const toggle = document.createElement('button');
    toggle.className = 'template-editor-toggle';
    toggle.type = 'button';
    toggle.textContent = 'ادوات المطور';

    const panel = document.createElement('aside');
    panel.className = 'template-editor-panel';
    panel.innerHTML = `
      <div class="template-editor-head">
        <h3>ادوات المطور</h3>
        <button class="template-editor-close" type="button">اغلاق</button>
      </div>

      <div class="template-editor-actions">
        <button type="button" data-action="text-mode">تعديل النصوص</button>
        <button type="button" data-action="image-mode">تبديل الصور</button>
        <button type="button" data-action="refresh-images">تحديث الصور من ملفات المشروع</button>
        <button type="button" data-action="copy-paste-mode">نسخ ولصق</button>
        <button type="button" data-action="delete-mode">وضع الحذف</button>
        <button type="button" data-action="clear-image">حذف صورة</button>
        <button type="button" data-action="open-client">نسخة العميل</button>
        <button type="button" data-action="save-all">حفظ على الجهاز</button>
        <button type="button" data-action="restore-backup">استرجاع اخر نسخة</button>
        <button type="button" data-action="export">تصدير الاعدادات</button>
        <button type="button" data-action="import">استيراد الاعدادات</button>
        <button type="button" data-action="reset">استعادة الافتراضي</button>
      </div>

      <h4>الالوان</h4>
      <div class="template-editor-grid">
        <div class="template-editor-field"><label>خلفية فاتحة</label><input type="color" data-color-key="lightBg"></div>
        <div class="template-editor-field"><label>لون اساسي</label><input type="color" data-color-key="brand"></div>
        <div class="template-editor-field"><label>لون التدرج المتوسط</label><input type="color" data-color-key="brandMid"></div>
        <div class="template-editor-field"><label>لون التدرج الغامق</label><input type="color" data-color-key="brandDark"></div>
        <div class="template-editor-field"><label>خلفية الوضع الغامق</label><input type="color" data-color-key="darkBg"></div>
        <div class="template-editor-field"><label>بطاقات الوضع الغامق</label><input type="color" data-color-key="darkCard"></div>
      </div>

      <h4>النشر على GitHub</h4>
      <div class="template-editor-grid">
        <div class="template-editor-field"><label>GitHub Token</label><input type="password" data-publish-key="token" placeholder="ghp_xxx"></div>
        <div class="template-editor-field"><label>Owner</label><input type="text" data-publish-key="owner" placeholder="mustafa22023"></div>
        <div class="template-editor-field"><label>Repository</label><input type="text" data-publish-key="repo" placeholder="-----"></div>
        <div class="template-editor-field"><label>Branch</label><input type="text" data-publish-key="branch" placeholder="main"></div>
      </div>
      <div class="template-editor-actions">
        <button type="button" data-action="publish-github">حفظ + نشر على GitHub</button>
      </div>

      <p class="template-editor-note">الادوات تظهر فقط عبر <b>?developer=1</b>.\nنسخ ولصق: فعّل الزر ثم اضغط على قسم أو منتج لتكراره مباشرة.\nوضع الحذف: اضغط على قسم او منتج لحذفه. حذف صورة: اضغط على صورة لمسحها.\nتحديث الصور من ملفات المشروع: يمسح الصور المحفوظة داخل المتصفح ويعيد تحميل الصور من ملفات المشروع مباشرة.</p>
    `;

    document.body.appendChild(toggle);
    document.body.appendChild(panel);

    const closeBtn = panel.querySelector('.template-editor-close');
    const textModeBtn = panel.querySelector('[data-action="text-mode"]');
    const imageModeBtn = panel.querySelector('[data-action="image-mode"]');
    const copyPasteModeBtn = panel.querySelector('[data-action="copy-paste-mode"]');
    const deleteModeBtn = panel.querySelector('[data-action="delete-mode"]');
    const clearImageBtn = panel.querySelector('[data-action="clear-image"]');
    toggle.addEventListener('click', () => panel.classList.toggle('is-open'));
    closeBtn.addEventListener('click', () => panel.classList.remove('is-open'));

    panel.querySelectorAll('input[data-color-key]').forEach((input) => {
      const key = input.dataset.colorKey;
      input.value = config.colors[key] || initialConfig.colors[key];
      input.addEventListener('input', () => {
        config.colors[key] = input.value;
        applySavedColors();
        saveLocalConfig();
      });
    });

    const publishSettings = loadPublishSettings();
    panel.querySelectorAll('input[data-publish-key]').forEach((input) => {
      const key = input.dataset.publishKey;
      input.value = publishSettings[key] || '';
      input.addEventListener('input', () => {
        publishSettings[key] = input.value.trim();
        savePublishSettings(publishSettings);
      });
    });

    panel.querySelector('[data-action="open-client"]').addEventListener('click', () => {
      window.open(getClientViewUrl(), '_blank', 'noopener');
    });

    panel.querySelector('[data-action="refresh-images"]').addEventListener('click', () => {
      config.images = {};
      saveLocalConfig();
      alert('تم مسح الصور المحفوظة محليا. سيتم الآن إعادة تحميل الصور من ملفات المشروع.');
      window.location.reload();
    });

    panel.querySelector('[data-action="save-all"]').addEventListener('click', async () => {
      try {
        saveLocalConfig();
        await saveConfigToProjectFile(config);
        alert('تم حفظ التعديلات على جهازك (ملف site-config.json).');
      } catch (err) {
        alert(`فشل الحفظ: ${formatPublishError(err)}`);
      }
    });

    panel.querySelector('[data-action="publish-github"]').addEventListener('click', async (event) => {
      const publishBtn = event.currentTarget;
      const settings = loadPublishSettings();
      if (!settings.token || !settings.owner || !settings.repo || !settings.branch) {
        alert('اكمل بيانات النشر: Token / Owner / Repository / Branch');
        return;
      }
      try {
        publishBtn.disabled = true;
        publishBtn.textContent = 'جاري النشر...';
        saveLocalConfig();
        await publishToGithub({ ...settings, content: config });
        publishBtn.textContent = 'تم النشر';
      } catch (err) {
        alert(`فشل النشر: ${formatPublishError(err)}`);
        publishBtn.textContent = 'حفظ + نشر على GitHub';
      } finally {
        setTimeout(() => {
          publishBtn.disabled = false;
          publishBtn.textContent = 'حفظ + نشر على GitHub';
        }, 1200);
      }
    });

    panel.querySelector('[data-action="restore-backup"]').addEventListener('click', () => {
      const raw = localStorage.getItem(STORAGE_BACKUP_KEY);
      if (!raw) {
        alert('لا توجد نسخة احتياطية محلية.');
        return;
      }
      try {
        config = normalizeConfig(JSON.parse(raw));
        saveLocalConfig();
        window.location.reload();
      } catch (_) {
        alert('النسخة الاحتياطية غير صالحة.');
      }
    });

    panel.querySelector('[data-action="reset"]').addEventListener('click', () => {
      if (!window.confirm('سيتم حذف كل التعديلات المحلية. هل تريد المتابعة؟')) return;
      clearLocalConfig();
      window.location.reload();
    });

    panel.querySelector('[data-action="export"]').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template-config.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    panel.querySelector('[data-action="import"]').addEventListener('click', () => {
      hiddenFileInput.accept = '.json,application/json';
      hiddenFileInput.onchange = () => {
        const file = hiddenFileInput.files && hiddenFileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = normalizeConfig(JSON.parse(String(reader.result || '{}')));
            config = normalizeConfig(parsed);
            saveLocalConfig();
            window.location.reload();
          } catch (_) {
            alert('ملف الاعدادات غير صحيح');
          }
        };
        reader.readAsText(file);
      };
      hiddenFileInput.click();
    });

    textModeBtn.addEventListener('click', () => {
      textMode = !textMode;
      document.body.classList.toggle('template-text-edit', textMode);
      textModeBtn.textContent = textMode ? 'ايقاف تعديل النصوص' : 'تعديل النصوص';
      document.querySelectorAll('[data-template-text-id]').forEach((el) => {
        el.setAttribute('contenteditable', textMode ? 'true' : 'false');
        if (!textMode) el.blur();
      });
    });

    imageModeBtn.addEventListener('click', () => {
      imageMode = !imageMode;
      document.body.classList.toggle('template-image-edit', imageMode);
      imageModeBtn.textContent = imageMode ? 'ايقاف تبديل الصور' : 'تبديل الصور';
    });

    copyPasteModeBtn.addEventListener('click', () => {
      copyPasteMode = !copyPasteMode;
      document.body.classList.toggle('template-copy-edit', copyPasteMode);
      copyPasteModeBtn.textContent = copyPasteMode ? 'ايقاف نسخ ولصق' : 'نسخ ولصق';
    });

    deleteModeBtn.addEventListener('click', () => {
      deleteMode = !deleteMode;
      deleteModeBtn.textContent = deleteMode ? 'ايقاف وضع الحذف' : 'وضع الحذف';
    });

    clearImageBtn.addEventListener('click', () => {
      clearImageMode = !clearImageMode;
      clearImageBtn.textContent = clearImageMode ? 'ايقاف حذف صورة' : 'حذف صورة';
    });

    document.addEventListener('blur', (event) => {
      const el = event.target;
      if (!textMode || !el || !el.matches('[data-template-text-id]')) return;
      const id = el.dataset.templateTextId;
      if (!id) return;

      const value = el.textContent.trim();
      const item = config.texts[id] || {};
      if (currentLang() === 'en') {
        item.en = value;
        el.dataset.en = value;
      } else {
        item.ar = value;
        el.dataset.ar = value;
      }
      config.texts[id] = item;
      saveLocalConfig();
    }, true);

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (deleteMode) {
        const section = target.closest('section.catalog-section');
        const product = target.closest('.product');

        if (product) {
          const pid = product.dataset.templateProductId;
          if (pid) {
            config.structure.addedProducts = config.structure.addedProducts.filter((p) => p.id !== pid);
            config.structure.removedProducts = uniq([...config.structure.removedProducts, pid]);
            product.remove();
            saveLocalConfig();
            event.preventDefault();
            event.stopPropagation();
            return;
          }
        }

        if (section && window.confirm('حذف هذا القسم بالكامل؟')) {
          const sid = section.dataset.templateSectionId || section.id;
          if (sid) {
            config.structure.addedSections = config.structure.addedSections.filter((s) => s.id !== sid);
            config.structure.addedProducts = config.structure.addedProducts.filter((p) => p.sectionId !== sid);
            config.structure.removedSections = uniq([...config.structure.removedSections, sid]);
            section.remove();
            document.querySelectorAll(`#store .grid--cards a.card[href="#${sid}"]`).forEach((card) => card.remove());
            document.querySelectorAll(`footer a[href="#${sid}"]`).forEach((a) => a.closest('li')?.remove());
            saveLocalConfig();
            event.preventDefault();
            event.stopPropagation();
          }
          return;
        }
      }

      if (copyPasteMode) {
        const product = target.closest('.product');
        if (product && !product.closest('.template-editor-panel')) {
          duplicateProduct(product);
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        const section = target.closest('section.catalog-section');
        if (section && !section.closest('.template-editor-panel')) {
          duplicateSection(section);
          event.preventDefault();
          event.stopPropagation();
          return;
        }
      }

      if (clearImageMode) {
        const imageTarget = target.closest('.product__img, .card__img, .section-banner img, .logo img, .slide');
        if (!imageTarget || imageTarget.closest('.template-editor-panel')) return;
        const imgId = imageTarget.dataset.templateImageId;
        if (imgId) delete config.images[imgId];
        setImageSource(imageTarget, '');
        saveLocalConfig();
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (imageMode) {
        const imageTarget = target.closest('.product__img, .card__img, .section-banner img, .logo img, .slide');
        if (!imageTarget || imageTarget.closest('.template-editor-panel')) return;

        event.preventDefault();
        event.stopPropagation();

        hiddenFileInput.accept = 'image/*';
        hiddenFileInput.onchange = () => {
          const file = hiddenFileInput.files && hiddenFileInput.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const result = String(reader.result || '');
            setImageSource(imageTarget, result);
            const id = imageTarget.dataset.templateImageId;
            if (id) {
              config.images[id] = result;
              saveLocalConfig();
            }
          };
          reader.readAsDataURL(file);
        };
        hiddenFileInput.click();
      }
    }, true);

    document.addEventListener('langchange', applySavedTexts);
  }

  async function publishToGithub({ token, owner, repo, branch, content }) {
    const api = `https://api.github.com/repos/${owner}/${repo}/contents/${PUBLISHED_CONFIG_PATH}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    };

    let sha = null;
    const getRes = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, { headers });
    if (getRes.ok) {
      const body = await getRes.json();
      sha = body.sha;
    } else if (getRes.status !== 404) {
      const errBody = await safeJson(getRes);
      throw buildPublishError(
        getRes.status,
        errBody.message || 'تعذر قراءة ملف الاعدادات من GitHub',
        owner,
        repo,
        branch
      );
    }

    const payload = {
      message: 'Update site config from developer tools',
      content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
      branch
    };
    if (sha) payload.sha = sha;

    const putRes = await fetch(api, { method: 'PUT', headers, body: JSON.stringify(payload) });
    if (!putRes.ok) {
      const errBody = await safeJson(putRes);
      throw buildPublishError(
        putRes.status,
        errBody.message || 'فشل رفع ملف الاعدادات',
        owner,
        repo,
        branch
      );
    }
  }

  function buildPublishError(status, message, owner, repo, branch) {
    const err = new Error(message || 'Publish failed');
    err.status = status;
    err.owner = owner;
    err.repo = repo;
    err.branch = branch;
    return err;
  }

  function formatPublishError(err) {
    const status = err && typeof err.status === 'number' ? err.status : null;
    const base = err && err.message ? err.message : 'خطأ غير معروف';
    if (status === 401) {
      return `${base}\nالسبب: التوكن غير صحيح أو منتهي.\nالحل: أنشئ Token جديد بصلاحية Contents: Read and Write.`;
    }
    if (status === 403) {
      return `${base}\nالسبب: لا توجد صلاحيات كافية أو تم حظر الطلب.\nالحل: تأكد من صلاحيات التوكن على المستودع.`;
    }
    if (status === 404) {
      return `${base}\nالسبب: Owner/Repository/Branch غير صحيح.\nالقيم الحالية: ${err.owner}/${err.repo} @ ${err.branch}`;
    }
    if (status === 422) {
      return `${base}\nالسبب: غالبا اسم الفرع غير موجود أو بيانات الملف غير صالحة.\nالحل: تأكد أن الفرع هو main.`;
    }
    if (status) {
      return `${base}\nHTTP Status: ${status}`;
    }
    return base;
  }

  async function hasUnpublishedChanges() {
    const published = normalizeConfig(await loadPublishedConfig());
    return !sameConfig(config, published);
  }

  function sameConfig(a, b) {
    return stableStringify(normalizeForCompare(a)) === stableStringify(normalizeForCompare(b));
  }

  function normalizeForCompare(c) {
    const n = normalizeConfig(c || {});
    return {
      texts: sortObjectKeys(n.texts || {}),
      images: sortObjectKeys(n.images || {}),
      colors: sortObjectKeys(n.colors || {}),
      structure: {
        addedSections: [...(n.structure?.addedSections || [])].sort((x, y) => String(x.id || '').localeCompare(String(y.id || ''))).map(sortObjectKeys),
        addedProducts: [...(n.structure?.addedProducts || [])].sort((x, y) => String(x.id || '').localeCompare(String(y.id || ''))).map(sortObjectKeys),
        removedSections: [...(n.structure?.removedSections || [])].map(String).sort(),
        removedProducts: [...(n.structure?.removedProducts || [])].map(String).sort()
      }
    };
  }

  function sortObjectKeys(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
    const out = {};
    Object.keys(obj).sort().forEach((k) => {
      const v = obj[k];
      out[k] = (v && typeof v === 'object' && !Array.isArray(v)) ? sortObjectKeys(v) : v;
    });
    return out;
  }

  function stableStringify(obj) {
    return JSON.stringify(obj);
  }

  async function saveConfigToProjectFile(content) {
    const jsonText = JSON.stringify(content, null, 2);

    if ('showSaveFilePicker' in window) {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'site-config.json',
        types: [
          {
            description: 'JSON File',
            accept: { 'application/json': ['.json'] }
          }
        ]
      });
      const writable = await handle.createWritable();
      await writable.write(jsonText);
      await writable.close();
      return;
    }

    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'site-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function safeJson(res) {
    try {
      return await res.json();
    } catch (_) {
      return {};
    }
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
