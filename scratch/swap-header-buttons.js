const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const dirs = ['.', './categories', './brands'];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const $ = cheerio.load(content);
    
    const $nav = $('.header-actions');
    if ($nav.length > 0) {
      // Current order: 0=Cart, 1=Search, 2=Menu
      const children = $nav.children();
      if (children.length === 3) {
        const cartNode = children.eq(0);
        const searchNode = children.eq(1);
        const menuNode = children.eq(2);
        
        // Let's make sure they are actually what we expect
        if (cartNode.attr('aria-label') === 'Cart' && menuNode.attr('aria-label') === 'Categories') {
          // Swap them!
          $nav.empty();
          $nav.append(menuNode);
          $nav.append(searchNode);
          $nav.append(cartNode);
          
          fs.writeFileSync(filePath, $.html(), 'utf8');
          console.log(`Swapped buttons in ${file}`);
        }
      }
    }
  });
});
