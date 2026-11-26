/* Yeltsov Studio — поведение страницы.
   Здесь только логика: классы переключаются, весь визуал — в css/style.css */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Тост ---------- */
  var toast = $("#toast");
  var toastTimer;
  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 2200);
  }

  /* ---------- Копирование ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.className = "visually-hidden";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }

  /* ---------- Мобильное меню ---------- */
  var burger = $("#burger");
  var nav = $("#nav");
  function setMenu(open) {
    if (!burger || !nav) return;
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("is-locked", open);
  }
  if (burger && nav) {
    burger.addEventListener("click", function () {
      setMenu(burger.getAttribute("aria-expanded") !== "true");
    });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 900) setMenu(false); });
  }

  /* ---------- Появление блоков при скролле ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Подсветка активного пункта меню ---------- */
  var navLinks = $$('.nav__link[href^="#"]');
  if ("IntersectionObserver" in window && navLinks.length) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && map[entry.target.id]) {
          navLinks.forEach(function (a) { a.classList.remove("is-active"); });
          map[entry.target.id].classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) spy.observe(sec);
    });
  }

  /* ---------- Генератор праздничной скидки: 1%–10% ---------- */
  var MIN_DISCOUNT = 1;
  var MAX_DISCOUNT = 10;
  var STORAGE_KEY = "company_coupon_v1";

  var input = $("#company");
  var btnGen = $("#generate");
  var btnCopy = $("#copy-code");
  var coupon = $("#coupon");
  var elName = $("#coupon-name");
  var elCode = $("#coupon-code");
  var elPct = $("#coupon-pct");

  var discount = 7;
  var rolling = false;

  function randomDiscount() {
    return Math.floor(Math.random() * (MAX_DISCOUNT - MIN_DISCOUNT + 1)) + MIN_DISCOUNT;
  }

  function slug(name) {
    var s = (name || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    return s || "YOUR";
  }

  function render(value) {
    if (!elCode) return;

    var name = (input && input.value.trim()) || "Acme Corp";
    var base = (input && input.value.trim()) ? slug(input.value) : "ACME";

    elName.textContent = name;
    elCode.textContent = base + "-PRO-" + value;
    elPct.textContent = "Discount: " + value + "%";
  }

  function saveCoupon() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      discount: discount,
      company: input ? input.value.trim() : "",
      generated: true
    }));
  }

  function loadCoupon() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      return null;
    }
  }

  function generate() {
    if (rolling || !coupon || loadCoupon()) return;

    rolling = true;
    btnGen.disabled = true;

    coupon.classList.remove("is-new");
    coupon.classList.add("is-rolling");

    var ticks = 0;

    var timer = setInterval(function () {
      render(randomDiscount());
      ticks++;

      if (ticks >= 10) {
        clearInterval(timer);

        discount = randomDiscount();
        saveCoupon();
        render(discount);

        coupon.classList.remove("is-rolling");
        void coupon.offsetWidth;
        coupon.classList.add("is-new");

        rolling = false;
        btnGen.disabled = true;
        btnGen.textContent = "Already Generated";
      }
    }, 60);
  }

  // Проверяем, генерировал ли пользователь купон раньше
  var savedCoupon = loadCoupon();

  if (savedCoupon && savedCoupon.generated) {
    discount = savedCoupon.discount;
    if (input) input.value = savedCoupon.company || "";

    render(discount);

    if (btnGen) {
      btnGen.disabled = true;
      btnGen.textContent = "Already Generated";
    }
  } else {
    render(discount);
  }

  if (btnGen) {
    btnGen.addEventListener("click", generate);

    if (input) {
      input.addEventListener("input", function () {
        if (!loadCoupon()) render(discount);
      });

      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") generate();
      });
    }
  }

  if (btnCopy) {
    btnCopy.addEventListener("click", function () {
      var code = elCode.textContent;

      copyText(code).then(
        function () {
          showToast("Code " + code + " copied");
        },
        function () {
          showToast("Could not copy — select the code manually");
        }
      );
    });
  }

  /* ---------- Копирование e-mail ---------- */
  var btnEmail = $("#copy-email");
  if (btnEmail) {
    btnEmail.addEventListener("click", function () {
      copyText("hello@yeltsov-studio.com").then(
        function () { showToast("Email copied"); },
        function () { showToast("Could not copy email"); }
      );
    });
  }

  /* ---------- Мелочи ---------- */
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  var toTop = $("#to-top");
  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
})();
