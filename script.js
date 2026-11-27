// Yeltsov Studio interactions
document.addEventListener("DOMContentLoaded", () => {
  // Render consistent Lucide SVG icons throughout the interface.
  if (window.lucide) lucide.createIcons({ attrs: { "stroke-width": 1.7 } });
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  const progress = document.querySelector(".scroll-progress");

  // Mobile navigation
  menuButton?.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    nav.classList.toggle("open", !isOpen);
  });
  nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  }));

  // Scroll progress indicator
  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0}%`;
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // Reveal elements as they enter the viewport
  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("is-visible"));
  }

  // FAQ accordion — one answer open at a time
  document.querySelectorAll(".faq-question").forEach(button => {
    button.addEventListener("click", () => {
      const current = button.getAttribute("aria-expanded") === "true";
      document.querySelectorAll(".faq-question").forEach(other => {
        other.setAttribute("aria-expanded", "false");
        const answer = other.nextElementSibling;
        answer.classList.remove("open");
        other.querySelector("span").textContent = "+";
      });
      if (!current) {
        button.setAttribute("aria-expanded", "true");
        button.nextElementSibling.classList.add("open");
        button.querySelector("span").textContent = "−";
      }
    });
  });

  // Subtle pointer movement on the hero preview (desktop only)
  const preview = document.querySelector(".hero-preview");
  if (preview && window.matchMedia("(pointer:fine)").matches) {
    preview.addEventListener("mousemove", event => {
      const rect = preview.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      preview.style.transform = `perspective(900px) rotateY(${x * 3}deg) rotateX(${-y * 3}deg) translateY(-3px)`;
    });
    preview.addEventListener("mouseleave", () => preview.style.transform = "");
  }

  // Current year in footer
  const year = document.querySelector(".site-footer");
  if (year) year.innerHTML = year.innerHTML.replace("© 2026", `© ${new Date().getFullYear()}`);
});
