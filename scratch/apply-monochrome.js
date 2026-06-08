const fs = require('fs');
const path = require('path');

const dirs = ['.', './categories', './brands', './products', './admin/public'];

// CSS replacements specifically for styles.css and admin.html
function replaceCSS(content) {
  // Replace the navy blue background
  content = content.replace(/#14213d/gi, '#0a0a0a');
  // Replace the yellow accents
  content = content.replace(/#fca311/gi, '#ffffff');
  return content;
}

// HTML replacements
function replaceHTML(content) {
  // Common inline styles for buttons
  content = content.replace(/background:\s*#fca311;\s*color:\s*#14213d;/gi, 'background: #ffffff; color: #000000;');
  // Common admin dashboard icon
  content = content.replace(/background:#fca311;\s*border-radius:50%;\s*display:flex;\s*align-items:center;\s*justify-content:center;\s*color:#14213d;/gi, 'background:#ffffff; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#000000;');
  
  // Any leftover raw hex codes in inline styles or tags
  content = content.replace(/#fca311/gi, '#ffffff');
  content = content.replace(/#14213d/gi, '#0a0a0a');
  return content;
}

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    if (file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.js')) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        let newContent = content;
        if (file.endsWith('.css')) {
            newContent = replaceCSS(content);
        } else if (file.endsWith('.html')) {
            newContent = replaceHTML(content);
        } else if (file.endsWith('.js')) {
            newContent = replaceCSS(content);
        }

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated ' + filePath);
        }
      }
    }
  });
});
