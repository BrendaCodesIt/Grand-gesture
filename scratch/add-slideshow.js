const fs = require('fs');
const path = require('path');

// 1. Add CSS transition for the hero image
const cssPath = path.join(__dirname, '../styles.css');
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('.hero-image {\\n  transition: opacity 0.2s ease;')) {
  // Try to append transition if .hero-image is found, or add it globally
  if (css.includes('.hero-image {')) {
    css = css.replace('.hero-image {', '.hero-image {\\n  transition: opacity 0.2s ease;');
  } else {
    css += '\\n.hero-image {\\n  transition: opacity 0.2s ease;\\n}\\n';
  }
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('Added CSS transition to .hero-image');
}

// 2. Add Slideshow JS to index.html
const indexPath = path.join(__dirname, '../index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const slideshowScript = \`
<script>
  /* ── Hero Slideshow ── */
  document.addEventListener("DOMContentLoaded", () => {
    const heroImg = document.querySelector(".hero-image");
    if (heroImg) {
      const slides = [
        "images/Hisense 55 ULED Mini LED U6 Pro.png",
        "images/Hisense 540 Watts HS5100 Soundbar 5.1.png",
        "images/Hisense Fridge 538 Liters Side by side  Black ice Maker.png",
        "images/Washing machine Front load 10.5 6kg.png",
        "images/Air conditioner 2.png",
        "images/Hisense 6.3L Air Fryer H06AFBS1S3.png"
      ];
      let currentIndex = 0;
      setInterval(() => {
        heroImg.style.opacity = 0;
        setTimeout(() => {
            currentIndex = (currentIndex + 1) % slides.length;
            heroImg.src = slides[currentIndex];
            heroImg.style.opacity = 1;
        }, 200);
      }, 1000); // Swaps every 1 second
    }
  });
</script>
\`;

if (!html.includes('/* ── Hero Slideshow ── */')) {
  html = html.replace('</body>', slideshowScript + '\\n</body>');
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('Added Slideshow to index.html');
}
