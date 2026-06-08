const fs = require('fs');
const path = require('path');

const dirs = ['.', './categories', './brands', './products'];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    let html = fs.readFileSync(filePath, 'utf8');
    
    if (html.includes('badge.style.display = total > 0 ? "flex" : "none";')) {
      html = html.replace('badge.style.display = total > 0 ? "flex" : "none";', 'badge.style.display = "flex";');
      fs.writeFileSync(filePath, html, 'utf8');
      console.log('Fixed cart badge logic in ' + file);
    }
  });
});
