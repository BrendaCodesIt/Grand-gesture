const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// 1. Add CSS
const cssPath = path.join(__dirname, '../styles.css');
let css = fs.readFileSync(cssPath, 'utf8');

if (!css.includes('.search-overlay {')) {
  css += `

/* ── Search Overlay ── */
.search-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(20, 33, 61, 0.95);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  padding: 50px 20px;
  align-items: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.search-overlay.active {
  opacity: 1;
  pointer-events: auto;
}
.search-overlay-close {
  position: absolute;
  top: 20px; right: 30px;
  background: none; border: none;
  color: #fff; font-size: 3rem; cursor: pointer;
}
.search-container {
  width: 100%;
  max-width: 600px;
  margin-top: 50px;
}
.search-input {
  width: 100%;
  padding: 15px 20px;
  font-size: 1.2rem;
  border: none;
  border-radius: 30px;
  outline: none;
}
.search-results {
  margin-top: 20px;
  max-height: 70vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.search-result-item {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 10px;
  border-radius: 8px;
  text-decoration: none;
  color: #14213d;
  transition: transform 0.2s;
}
.search-result-item:hover {
  transform: translateY(-2px);
}
.search-result-img {
  width: 60px; height: 60px; object-fit: contain; margin-right: 15px;
}
.search-result-info {
  flex: 1;
}
.search-result-name {
  font-weight: 600; margin: 0 0 5px 0; font-size: 1rem;
}
.search-result-price {
  color: #fca311; font-weight: 700; margin: 0;
}
`;
  fs.writeFileSync(cssPath, css, 'utf8');
}

const htmlToInject = `
<div class="search-overlay" id="search-overlay">
  <button class="search-overlay-close" id="search-overlay-close">&times;</button>
  <div class="search-container">
    <input type="text" class="search-input" id="search-input" placeholder="Search for products..." autocomplete="off">
    <div class="search-results" id="search-results"></div>
  </div>
</div>
`;

const jsToInject = `
<script>
  document.addEventListener("DOMContentLoaded", () => {
    const searchBtns = document.querySelectorAll('button[aria-label="Search"]');
    const searchOverlay = document.getElementById('search-overlay');
    const searchClose = document.getElementById('search-overlay-close');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    const isSubdir = window.location.pathname.includes('/categories/') || window.location.pathname.includes('/brands/') || window.location.pathname.includes('/products/');
    const pathPrefix = isSubdir ? '../' : '';

    searchBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        searchOverlay.classList.add('active');
        searchInput.focus();
      });
    });

    searchClose.addEventListener('click', () => {
      searchOverlay.classList.remove('active');
    });

    searchOverlay.addEventListener('click', (e) => {
      if (e.target === searchOverlay) searchOverlay.classList.remove('active');
    });

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      searchResults.innerHTML = '';
      if (!query || !window.PRODUCTS_DATA) return;

      const matches = window.PRODUCTS_DATA.filter(p => p.name.toLowerCase().includes(query));
      
      matches.slice(0, 10).forEach(product => {
        const item = document.createElement('a');
        item.href = pathPrefix + product.url;
        item.className = 'search-result-item';
        
        item.innerHTML = \`
          <img src="\${pathPrefix + product.image}" class="search-result-img" alt="\${product.name}" onerror="this.style.display='none'">
          <div class="search-result-info">
            <p class="search-result-name">\${product.name}</p>
            <p class="search-result-price">KSh \${product.price.toLocaleString("en-US")}</p>
          </div>
        \`;
        searchResults.appendChild(item);
      });
    });
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
    
    if (!html.includes('id="search-overlay"')) {
      const pathPrefix = (dir !== '.') ? '../' : '';
      const dataScript = `<script src="${pathPrefix}search-data.js"></script>`;
      
      const payload = htmlToInject + dataScript + jsToInject + '</body>';
      html = html.replace('</body>', payload);
      
      fs.writeFileSync(filePath, html, 'utf8');
      console.log('Injected Search UI into ' + file);
    }
  });
});
