const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const dirs = ['.', './categories', './brands', './products'];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    let html = fs.readFileSync(filePath, 'utf8');
    
    const $ = cheerio.load(html);
    
    const menuBtn = $('#menu-toggle');
    if (menuBtn.length && menuBtn[0].tagName === 'button') {
      const isSubdir = dir !== '.';
      const href = isSubdir ? '../index.html' : 'index.html';
      
      const aTag = `<a href="${href}" class="icon-btn" aria-label="Menu" id="menu-toggle">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </a>`;
      
      menuBtn.replaceWith(aTag);
      
      // Also remove the categories menu if we want to be clean
      $('#categories-menu').remove();
      
      let modifiedHtml = $.html();
      
      // Safely guard JS
      modifiedHtml = modifiedHtml.replace(/const categoriesMenu = document.getElementById\("categories-menu"\);/g, 'const categoriesMenu = document.getElementById("categories-menu");');
      if (!modifiedHtml.includes('id="categories-menu"')) {
        modifiedHtml = modifiedHtml.replace('</body>', '<div id="categories-menu" style="display:none;"></div>\n</body>');
      }

      fs.writeFileSync(filePath, modifiedHtml, 'utf8');
      console.log('Updated Menu Button to Link in ' + file);
    }
  });
});
