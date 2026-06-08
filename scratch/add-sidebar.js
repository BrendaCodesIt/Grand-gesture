const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// 1. Add CSS
const cssPath = path.join(__dirname, '../styles.css');
let css = fs.readFileSync(cssPath, 'utf8');

if (!css.includes('.side-menu {')) {
  css += `

/* ── Sidebar Menu ── */
.sidebar-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 10000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.sidebar-overlay.active {
  opacity: 1;
  pointer-events: auto;
}
.side-menu {
  position: fixed;
  top: 0; left: -320px;
  width: 300px; height: 100vh;
  background: #14213d;
  color: #fff;
  z-index: 10001;
  box-shadow: 4px 0 15px rgba(0,0,0,0.2);
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.side-menu.active {
  left: 0;
}
.side-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.side-menu-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fca311;
}
.side-menu-close {
  background: none; border: none;
  color: #fff; font-size: 2.5rem; cursor: pointer;
  line-height: 1;
}
.side-menu-nav {
  padding: 20px 0;
}
.side-menu-group {
  margin-bottom: 25px;
}
.side-menu-group h3 {
  margin: 0 0 10px 25px;
  font-size: 0.85rem;
  text-transform: uppercase;
  color: #8a96a8;
  letter-spacing: 0.05em;
}
.side-menu-nav a {
  display: block;
  padding: 12px 25px;
  color: #e2e8f0;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}
.side-menu-nav a:hover {
  background: rgba(255,255,255,0.05);
  color: #fff;
  border-left: 4px solid #fca311;
}
.admin-link {
  color: #fca311 !important;
}
`;
  fs.writeFileSync(cssPath, css, 'utf8');
}

const jsToInject = `
<script>
  document.addEventListener("DOMContentLoaded", () => {
    const menuToggleBtn = document.getElementById('menu-toggle');
    const sideMenu = document.getElementById('side-menu');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sideMenuClose = document.getElementById('side-menu-close');

    if (menuToggleBtn && sideMenu) {
      menuToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sideMenu.classList.add('active');
        sidebarOverlay.classList.add('active');
      });
    }

    if (sideMenuClose) {
      sideMenuClose.addEventListener('click', () => {
        sideMenu.classList.remove('active');
        sidebarOverlay.classList.remove('active');
      });
    }

    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', () => {
        sideMenu.classList.remove('active');
        sidebarOverlay.classList.remove('active');
      });
    }
  });
</script>
`;

const dirs = ['.', './categories', './brands', './products'];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    let html = fs.readFileSync(filePath, 'utf8');
    
    // 1. Revert #menu-toggle from <a> to <button>
    // We previously replaced: <a href="index.html" class="icon-btn" aria-label="Menu" id="menu-toggle">
    html = html.replace(/<a href="[^"]*" class="icon-btn" aria-label="Menu" id="menu-toggle">/g, '<button class="icon-btn" aria-label="Menu" id="menu-toggle">');
    html = html.replace(/<\/svg>\s*<\/a>/g, (match, offset, string) => {
      // Very naive check, but since we know we replaced </a> where menu-toggle is
      return match; // Actually, we'll just replace </a> for the menu toggle.
    });
    // Better regex for the button:
    // It's currently: <a href="..." class="icon-btn" aria-label="Menu" id="menu-toggle"> <svg>...</svg> </a>
    // Let's use Cheerio to cleanly change the tag name.
    
    const $ = cheerio.load(html);
    const menuBtn = $('#menu-toggle');
    if (menuBtn.length && menuBtn[0].tagName === 'a') {
      const buttonHtml = `<button class="icon-btn" aria-label="Menu" id="menu-toggle">${menuBtn.html()}</button>`;
      menuBtn.replaceWith(buttonHtml);
    }
    
    let modifiedHtml = $.html();
    
    // 2. Inject Sidebar HTML
    if (!modifiedHtml.includes('id="side-menu"')) {
      const pathPrefix = (dir !== '.') ? '../' : '';
      
      const sidebarHtml = `
<div class="sidebar-overlay" id="sidebar-overlay"></div>
<aside class="side-menu" id="side-menu">
  <div class="side-menu-header">
    <h2>Menu</h2>
    <button class="side-menu-close" id="side-menu-close">&times;</button>
  </div>
  <nav class="side-menu-nav">
    <div class="side-menu-group">
      <h3>Store</h3>
      <a href="${pathPrefix}index.html">Home</a>
      <a href="${pathPrefix}categories/tvs.html">TVs</a>
      <a href="${pathPrefix}categories/soundbars.html">Soundbars</a>
      <a href="${pathPrefix}categories/refrigerators.html">Refrigerators</a>
      <a href="${pathPrefix}categories/washing-machines.html">Washing Machines</a>
      <a href="${pathPrefix}categories/air-conditioners.html">Air Conditioners</a>
      <a href="${pathPrefix}categories/kitchen-appliances.html">Kitchen Appliances</a>
    </div>
    <div class="side-menu-group">
      <h3>Account</h3>
      <a href="#">My Account</a>
      <a href="#">Order History</a>
      <a href="#">Settings</a>
    </div>
    <div class="side-menu-group">
      <h3>System</h3>
      <a href="${pathPrefix}admin.html" class="admin-link">Admin Dashboard</a>
    </div>
  </nav>
</aside>
`;

      modifiedHtml = modifiedHtml.replace('</body>', sidebarHtml + jsToInject + '</body>');
      
      fs.writeFileSync(filePath, modifiedHtml, 'utf8');
      console.log('Injected Sidebar into ' + file);
    }
  });
});
