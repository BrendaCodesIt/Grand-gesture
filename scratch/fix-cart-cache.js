const fs = require('fs');
const path = require('path');

const dirs = ['.', './categories', './brands', './products'];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it already has the inline style
    if (!content.includes('class="icon-btn" aria-label="Cart" style="position: relative;"')) {
      content = content.replace(/class="icon-btn" aria-label="Cart"/g, 'class="icon-btn" aria-label="Cart" style="position: relative;"');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed inline style on ' + file);
    }
  });
});
