const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// 1. Add CSS
const cssPath = path.join(__dirname, '../styles.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Ensure .icon-btn has position: relative
if (!css.includes('position: relative;') || !css.match(/\\.icon-btn\\s*\\{[^}]*position:\\s*relative/)) {
  css = css.replace('.icon-btn {', '.icon-btn {\\n  position: relative;');
}

if (!css.includes('.cart-badge')) {
  css += `

.cart-badge {
  position: absolute;
  top: -2px;
  right: -6px;
  background-color: #fca311;
  color: #14213d;
  font-size: 11px;
  font-weight: 800;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Montserrat', sans-serif;
}
`;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('Updated styles.css with cart badge styles');
}

// 2. Add badge to HTML and JS to update it
const jsSnippet = `
  // Badge logic
  function updateCartBadge() {
    const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
    const total = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const badge = document.getElementById("cart-badge");
    if (badge) {
      badge.textContent = total;
      badge.style.display = total > 0 ? "flex" : "none";
    }
  }
  document.addEventListener("DOMContentLoaded", updateCartBadge);
`;

const dirs = ['./products'];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Add badge to HTML
    if (!content.includes('id="cart-badge"')) {
      content = content.replace(/<a href="[^"]*cart\.html"[^>]*aria-label="Cart"[^>]*>[\s\S]*?<\/svg>\s*<\/a>/, (match) => {
        return match.replace('</a>', '  <span class="cart-badge" id="cart-badge" style="display:none;">0</span>\n          </a>');
      });
      changed = true;
    }

    // Add JS logic
    if (!content.includes('function updateCartBadge()')) {
      content = content.replace('showCartModal(item, isNew);', 'if(typeof updateCartBadge === "function") updateCartBadge();\n    showCartModal(item, isNew);');
      content = content.replace('/* ── Enhanced Cart Logic with Recommendations ── */', '/* ── Enhanced Cart Logic with Recommendations ── */\n' + jsSnippet);
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Added badge to ' + file);
    }
  });
});
