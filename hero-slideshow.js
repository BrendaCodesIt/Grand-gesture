/* ═══════════════════════════════════════════════════════════
   Grand Gesture — Homepage Hero Product Slideshow
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const SLIDES = [
    { src: "images/Hisense 55 ULED Mini LED U6 Pro.png", alt: "Hisense 55\" ULED Mini-LED TV" },
    { src: "images/Hisense 100 inch TV.jpg", alt: "Hisense 100\" Premium TV" },
    { src: "images/Hisense 540 Watts HS5100 Soundbar 5.1.png", alt: "Hisense 5.1 Soundbar" },
    { src: "images/Hisense Fridge 538 Liters Side by side  Black ice Maker.png", alt: "Hisense Side-by-Side Refrigerator" },
    { src: "images/Washing machine Front load 10.5 6kg.png", alt: "Hisense Front Load Washing Machine" },
    { src: "images/Air conditioner 2.png", alt: "Hisense Air Conditioner" },
    { src: "images/Hisense 6.3L Air Fryer H06AFBS1S3.png", alt: "Hisense Air Fryer" },
    { src: "images/Hisense 10.5 6kg Front Load Wash & Dry Washing Machine WD3S1043BT.png", alt: "Hisense Wash & Dry Machine" },
  ];

  /** Time each product stays visible before the next slide */
  const INTERVAL_MS = 4000;
  const FADE_MS = 400;

  function init() {
    const img = document.querySelector(".hero-image");
    if (!img || SLIDES.length < 2 || img.dataset.slideshowInit === "true") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    img.dataset.slideshowInit = "true";

    SLIDES.forEach((slide) => {
      const preload = new Image();
      preload.src = slide.src;
    });

    let index = SLIDES.findIndex((s) => img.getAttribute("src") === s.src);
    if (index < 0) index = 0;

    img.setAttribute("aria-live", "polite");

    function showSlide(nextIndex) {
      img.classList.add("hero-image--fading");
      window.setTimeout(() => {
        const slide = SLIDES[nextIndex];
        img.src = slide.src;
        img.alt = slide.alt;
        img.classList.remove("hero-image--fading");
      }, FADE_MS);
    }

    window.setInterval(() => {
      index = (index + 1) % SLIDES.length;
      showSlide(index);
    }, INTERVAL_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
