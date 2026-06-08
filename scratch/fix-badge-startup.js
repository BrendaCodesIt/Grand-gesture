const fs = require('fs');
const path = require('path');

const dirs = ['.', './categories', './brands', './products'];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    let html = fs.readFileSync(filePath, 'utf8');
    
    // Fix hardcoded display:none in HTML
    html = html.replace(/<span class="cart-badge" id="cart-badge" style="display:none;">/g, '<span class="cart-badge" id="cart-badge" style="display:flex;">');
    
    // Fix DOMContentLoaded issue by calling it immediately
    html = html.replace(/document\.addEventListener\("DOMContentLoaded", updateCartBadge\);/g, 'updateCartBadge();');
    
    fs.writeFileSync(filePath, html, 'utf8');
    console.log('Fixed cart badge startup in ' + file);
  });
});
