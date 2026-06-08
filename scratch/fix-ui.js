const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// 1. Fix styles.css
const cssPath = path.join(__dirname, '../styles.css');
let css = fs.readFileSync(cssPath, 'utf8');
css = css.replace('flex-direction: row-reverse;', '/* flex-direction removed */');
css = css.replace('.categories-panel {\\n  position: absolute;\\n  top: 100%;\\n  right: 52px;\\n  background: var(--header-bg);\\n  border: 1px solid var(--header-divider);\\n  border-top: 0;\\n  border-radius: 0 0 8px 8px;\\n  padding: 10px;\\n  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.14);\\n  z-index: 20;\\n}', 
'.categories-panel {\\n  position: absolute;\\n  top: 100%;\\n  right: 52px;\\n  background: var(--header-bg);\\n  border: 1px solid var(--header-divider);\\n  border-top: 0;\\n  border-radius: 0 0 8px 8px;\\n  padding: 10px;\\n  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.14);\\n  z-index: 9999;\\n}');
fs.writeFileSync(cssPath, css, 'utf8');
console.log('Fixed styles.css');

// 2. Fix HTML files
const dirs = ['.', './categories', './brands'];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const $ = cheerio.load(content);
    let changed = false;

    // --- A. Fix Header Layout ---
    const $header = $('.top-header');
    if ($header.length > 0) {
      const $nav = $header.find('.header-actions');
      const $brand = $header.find('.brand');
      if ($nav.length && $brand.length) {
        // Ensure nav is first, brand is second
        $header.empty();
        $header.append($nav);
        $header.append($brand);
        
        // Ensure nav buttons are Menu, Search, Cart
        const cartBtn = $nav.find('[aria-label="Cart"]');
        const searchBtn = $nav.find('[aria-label="Search"]');
        const menuBtn = $nav.find('[aria-label="Categories"], #menu-toggle');
        
        $nav.empty();
        if (menuBtn.length) $nav.append(menuBtn);
        if (searchBtn.length) $nav.append(searchBtn);
        if (cartBtn.length) $nav.append(cartBtn);
        
        changed = true;
      }
    }

    // --- B. Fix Add to Cart Buttons ---
    const uniformStyle = "display:block; width:100%; padding: 0.6rem; background: #fca311; color: #14213d; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; text-align: center; margin-bottom: 10px;";
    
    $('.btn-add-cart, .tv-model-btn').each((i, btn) => {
      const $btn = $(btn);
      // don't touch if it's an anchor tag that acts as "View Details"
      if ($btn.is('a') && !$btn.hasClass('btn-add-cart')) return;
      
      $btn.attr('style', uniformStyle);
      $btn.addClass('btn-add-cart');
      
      const price = Number($btn.attr('data-price')) || 0;
      if (price > 0 && !$btn.text().includes('KSh')) {
        $btn.text('Add to Cart - KSh ' + price.toLocaleString());
      } else if (price === 0 && !$btn.text().includes('Add to Cart')) {
        $btn.text('Add to Cart');
      }
      
      changed = true;
    });

    if (changed) {
      // --- C. Remove broken QuickAdd JS ---
      // Instead of parsing the JS with cheerio (which escapes things weirdly),
      // we'll output cheerio HTML then do string replacement to strip the QuickAdd block.
      let html = $.html();
      
      const startTag = '/* ── Wrap every model button with QuickAdd overlay ── */';
      const endTag1 = '/* ── Categories menu toggle ── */';
      const endTag2 = '/* ── Categories Menu ── */';
      const endTag3 = 'const menuToggle = document.getElementById("menu-toggle");';

      let startIndex = html.indexOf(startTag);
      if (startIndex !== -1) {
         let endIndex = html.indexOf(endTag1, startIndex);
         if (endIndex === -1) endIndex = html.indexOf(endTag2, startIndex);
         if (endIndex === -1) endIndex = html.indexOf(endTag3, startIndex);
         
         if (endIndex !== -1) {
            html = html.substring(0, startIndex) + html.substring(endIndex);
         }
      }

      fs.writeFileSync(filePath, html, 'utf8');
      console.log('Fixed UI in ' + file);
    }
  });
});
