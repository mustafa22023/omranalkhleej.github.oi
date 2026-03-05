(function () {
  const CART_KEY = 'imran-cart-v1';
  const whatsappPhone = '96566871081';
  const params = new URLSearchParams(window.location.search);

  const product = {
    nameAr: params.get('nameAr') || 'منتج',
    nameEn: params.get('nameEn') || params.get('nameAr') || 'Product',
    image: params.get('image') || '',
    price: params.get('price') || 'السعر حسب الكمية',
    rating: params.get('rating') || '4.8'
  };

  const imageEl = document.getElementById('product-image');
  const nameEl = document.getElementById('product-name');
  const ratingEl = document.getElementById('product-rating');
  const priceEl = document.getElementById('product-price');
  const cartCountEl = document.getElementById('cart-count');
  const addBtn = document.getElementById('add-to-cart');
  const buyBtn = document.getElementById('buy-now');

  if (imageEl && product.image) imageEl.style.backgroundImage = `url('${product.image}')`;
  if (nameEl) nameEl.textContent = product.nameAr;
  if (ratingEl) ratingEl.textContent = product.rating;
  if (priceEl) priceEl.textContent = product.price;

  function readCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    if (cartCountEl) {
      cartCountEl.textContent = `عدد العناصر في السلة: ${items.length}`;
    }
  }

  function addToCart() {
    const cart = readCart();
    cart.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nameAr: product.nameAr,
      price: product.price,
      image: product.image,
      qty: 1
    });
    saveCart(cart);
    alert('تمت إضافة المنتج إلى عربة التسوق');
  }

  function buyNow() {
    const msg = `ارغب بشراء: ${product.nameAr}\nالسعر: ${product.price}`;
    const url = `https://api.whatsapp.com/send?phone=${whatsappPhone}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  if (addBtn) addBtn.addEventListener('click', addToCart);
  if (buyBtn) buyBtn.addEventListener('click', buyNow);
  saveCart(readCart());

  const themeToggle = document.querySelector('.theme-toggle');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') document.body.classList.add('theme-dark');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('theme-dark');
      localStorage.setItem('theme', document.body.classList.contains('theme-dark') ? 'dark' : 'light');
    });
  }
})();

