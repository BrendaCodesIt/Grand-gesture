const fs = require('fs');
const path = require('path');

const dirs = ['./products'];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('\\n')) {
      content = content.replace(/\\n/g, '');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Removed \\\\n from ' + file);
    }
  });
});
