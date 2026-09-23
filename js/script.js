/* ============================================================
   FADE — барбершоп (демо-лендинг)
   Ванильный JS без зависимостей:
   меню, reveal-анимации, счётчики, слайдер, фильтр,
   FAQ-аккордеон, маска телефона, валидация формы, модалка
   ============================================================ */

'use strict';

document.documentElement.classList.remove('no-js');

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ---------- 1. Липкая шапка ---------- */
const header = $('#header');

const toggleSticky = () => header.classList.toggle('is-sticky', window.scrollY > 40);
toggleSticky();
window.addEventListener('scroll', toggleSticky, { passive: true });

/* ---------- 2. Мобильное меню ---------- */
const burger = $('#burger');
const mobileMenu = $('#mobile-menu');

const closeMenu = () => {
  burger.classList.remove('is-active');
  mobileMenu.classList.remove('is-open');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-label', 'Открыть меню');
  document.body.classList.remove('no-scroll');
};

const toggleMenu = () => {
  const opened = mobileMenu.classList.toggle('is-open');
  burger.classList.toggle('is-active', opened);
  burger.setAttribute('aria-expanded', String(opened));
  burger.setAttribute('aria-label', opened ? 'Закрыть меню' : 'Открыть меню');
  document.body.classList.toggle('no-scroll', opened);
};

burger.addEventListener('click', toggleMenu);
$$('.mobile-menu a').forEach((a) => a.addEventListener('click', closeMenu));

/* ---------- 3. Reveal-анимации при скролле (со ступенчатой задержкой) ---------- */
const revealEls = $$('.reveal');

const groups = new Map();
revealEls.forEach((el) => {
  const count = groups.get(el.parentElement) || 0;
  groups.set(el.parentElement, count + 1);
  el.style.transitionDelay = Math.min(count * 70, 350) + 'ms';
});

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

/* ---------- 4. Анимированные счётчики в hero ---------- */
const animateCounter = (el) => {
  const target = parseFloat(el.dataset.target);
  const decimals = Number(el.dataset.decimals || 0);
  const suffix = el.dataset.suffix || '';
  const duration = 1600;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    el.textContent = (target * eased).toFixed(decimals) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const counters = $$('[data-target]');
if ('IntersectionObserver' in window) {
  const counterIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((el) => counterIO.observe(el));
} else {
  counters.forEach(animateCounter);
}

/* ---------- 5. Слайдер отзывов ---------- */
const track = $('.reviews__track');
const slides = $$('.review-card', track);
const prevBtn = $('#reviews-prev');
const nextBtn = $('#reviews-next');
const dotsBox = $('#reviews-dots');
const reviewsEl = $('.reviews');

let pageIndex = 0;
let pages = 1;
let autoTimer = null;

const perView = () => (window.matchMedia('(max-width: 700px)').matches ? 1 : 2);

const buildDots = () => {
  pages = Math.max(1, Math.ceil(slides.length / perView()));
  dotsBox.innerHTML = '';
  for (let i = 0; i < pages; i++) {
    const dot = document.createElement('button');
    dot.className = 'reviews__dot';
    dot.setAttribute('aria-label', `Страница отзывов ${i + 1}`);
    dot.addEventListener('click', () => goTo(i, true));
    dotsBox.appendChild(dot);
  }
};

const updateSlider = () => {
  pageIndex = Math.max(0, Math.min(pageIndex, pages - 1));
  track.style.transform = `translateX(-${pageIndex * 100}%)`;
  $$('.reviews__dot', dotsBox).forEach((d, i) => d.classList.toggle('is-active', i === pageIndex));
};

const goTo = (i, manual = false) => {
  pageIndex = i;
  updateSlider();
  if (manual) restartAuto();
};

prevBtn.addEventListener('click', () => goTo(pageIndex - 1 < 0 ? pages - 1 : pageIndex - 1, true));
nextBtn.addEventListener('click', () => goTo(pageIndex + 1 >= pages ? 0 : pageIndex + 1, true));

const startAuto = () => {
  stopAuto();
  autoTimer = setInterval(() => goTo(pageIndex + 1 >= pages ? 0 : pageIndex + 1), 6000);
};
const stopAuto = () => clearInterval(autoTimer);
const restartAuto = () => startAuto();

reviewsEl.addEventListener('mouseenter', stopAuto);
reviewsEl.addEventListener('mouseleave', startAuto);

window.addEventListener('resize', () => {
  buildDots();
  updateSlider();
});

buildDots();
updateSlider();
startAuto();

/* ---------- 6. FAQ-аккордеон ---------- */
$$('.faq__item').forEach((item) => {
  const q = $('.faq__q', item);
  const a = $('.faq__a', item);

  q.addEventListener('click', () => {
    const isOpen = item.classList.contains('is-open');

    // закрываем остальные
    $$('.faq__item.is-open').forEach((other) => {
      if (other === item) return;
      other.classList.remove('is-open');
      $('.faq__q', other).setAttribute('aria-expanded', 'false');
      $('.faq__a', other).style.maxHeight = '';
    });

    item.classList.toggle('is-open', !isOpen);
    q.setAttribute('aria-expanded', String(!isOpen));
    a.style.maxHeight = !isOpen ? a.scrollHeight + 'px' : '';
  });
});

/* ---------- 7. Фильтр галереи ---------- */
const chips = $$('.gallery__filters .chip');
const galleryItems = $$('.gallery-item');

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.remove('is-active'));
    chip.classList.add('is-active');

    const filter = chip.dataset.filter;
    galleryItems.forEach((item) => {
      const show = filter === 'all' || item.dataset.cat === filter;
      item.classList.toggle('is-hidden', !show);
    });
  });
});

/* ---------- 8. Маска телефона ---------- */
const phoneInput = $('#f-phone');

phoneInput.addEventListener('input', () => {
  let digits = phoneInput.value.replace(/\D/g, '');
  if (digits.length === 0) {
    phoneInput.value = '';
    return;
  }
  if (digits.startsWith('8')) digits = '7' + digits.slice(1);
  if (!digits.startsWith('7')) digits = '7' + digits;
  digits = digits.slice(0, 11);

  let result = '+7';
  if (digits.length > 1) result += ' (' + digits.slice(1, 4);
  if (digits.length >= 5) result += ') ' + digits.slice(4, 7);
  if (digits.length >= 8) result += '-' + digits.slice(7, 9);
  if (digits.length >= 10) result += '-' + digits.slice(9, 11);

  phoneInput.value = result;
});

/* ---------- 9. Валидация и отправка формы ---------- */
const form = $('#booking-form');
const submitBtn = form.querySelector('button[type="submit"]');

// дата в форме — не раньше сегодня
const dateInput = $('#f-date');
const todayISO = new Date().toISOString().split('T')[0];
dateInput.min = todayISO;

const validators = {
  name: (v) => v.trim().length >= 2 || 'Введи имя — минимум 2 буквы',
  phone: (v) => v.replace(/\D/g, '').length === 11 || 'Введи номер полностью',
  service: (v) => !!v || 'Выбери услугу',
  date: (v) => {
    if (!v) return true; // необязательное поле
    const picked = new Date(v + 'T23:59:59');
    return picked >= new Date() || 'Эта дата уже прошла :)';
  },
};

const setError = (fieldName, message) => {
  const input = form.elements[fieldName];
  const errorEl = $(`[data-error-for="${fieldName}"]`, form);
  const invalid = Boolean(message);
  errorEl.textContent = invalid ? message : '';
  errorEl.classList.toggle('is-visible', invalid);
  input.classList.toggle('is-invalid', invalid);
};

const validateField = (fieldName) => {
  const result = validators[fieldName](form.elements[fieldName].value);
  setError(fieldName, result === true ? '' : result);
  return result === true;
};

// подсказка исчезает, как только поле становится валидным
form.addEventListener('input', (e) => {
  const field = e.target;
  if (!field.name || !validators[field.name]) return;
  const errorEl = $(`[data-error-for="${field.name}"]`, form);
  if (errorEl.classList.contains('is-visible')) validateField(field.name);
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const fields = ['name', 'phone', 'service', 'date'];
  let valid = true;
  fields.forEach((name) => {
    if (!validateField(name)) valid = false;
  });

  if (!valid) {
    form.querySelector('.is-invalid')?.focus();
    return;
  }

  // Демо-режим: здесь в реальном проекте будет fetch() на backend или EmailJS
  const originalText = submitBtn.textContent;
  form.classList.add('is-sending');
  submitBtn.textContent = 'Отправляем…';

  setTimeout(() => {
    form.classList.remove('is-sending');
    submitBtn.textContent = originalText;
    form.reset();
    openModal();
  }, 1100);
});

/* ---------- 10. Модалка успешной отправки ---------- */
const modal = $('#success-modal');

const openModal = () => {
  modal.hidden = false;
  document.body.classList.add('no-scroll');
};

const closeModal = () => {
  modal.hidden = true;
  document.body.classList.remove('no-scroll');
};

$$('[data-close-modal]', modal).forEach((el) => el.addEventListener('click', closeModal));

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!modal.hidden) closeModal();
  if (mobileMenu.classList.contains('is-open')) closeMenu();
});

/* ---------- 11. Кнопка «наверх» ---------- */
const backToTop = $('#back-to-top');

window.addEventListener(
  'scroll',
  () => backToTop.classList.toggle('is-visible', window.scrollY > 600),
  { passive: true }
);

backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
