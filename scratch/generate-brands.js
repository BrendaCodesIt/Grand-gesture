const fs = require('fs');
const path = require('path');

const catDir = './categories';
const brandsDir = './brands';

const files = fs.readdirSync(catDir).filter(f => f.endsWith('.html'));

const brandsData = {
  Hisense: [],
  Sony: [],
  LG: [],
  Skyworth: []
};

files.forEach(file => {
  const content = fs.readFileSync(path.join(catDir, file), 'utf8');
  
  // Extract main tv-product
  const productMatch = content.match(/<section class="tv-product"[\s\S]*?<\/aside>\s*<\/section>/i);
  if (productMatch) {
    let block = productMatch[0];
    if (block.match(/Hisense/i)) brandsData.Hisense.push(block);
    else if (block.match(/Sony/i)) brandsData.Sony.push(block);
    else if (block.match(/LG/i)) brandsData.LG.push(block);
    else if (block.match(/Skyworth/i)) brandsData.Skyworth.push(block);
  }

  // Extract tv-featured-blocks
  const blocks = content.match(/<section class="tv-featured-block"[\s\S]*?<\/section>/gi);
  if (blocks) {
    blocks.forEach(block => {
      // Check if it's a closed section (sometimes aside is the last thing, and the section closes right after it)
      if (block.match(/Hisense/i)) brandsData.Hisense.push(block);
      else if (block.match(/Sony/i)) brandsData.Sony.push(block);
      else if (block.match(/LG/i)) brandsData.LG.push(block);
      else if (block.match(/Skyworth/i)) brandsData.Skyworth.push(block);
    });
  }
});

const templateContent = fs.readFileSync(path.join(catDir, 'tvs.html'), 'utf8');
const templateParts = templateContent.split(/<main[^>]*>/i);
const header = templateParts[0] + '<main class="tv-page">';
const footerParts = templateParts[1].split('</main>');
const footer = '</main>' + footerParts[1];

Object.keys(brandsData).forEach(brand => {
  if (brandsData[brand].length === 0) return;
  
  // We need to fix the title
  let brandHeader = header.replace(/<title>.*<\/title>/i, `<title>${brand} Products - Grand Gesture</title>`);
  
  // Update categories menu links to point to ../categories/... since we are in /brands
  brandHeader = brandHeader.replace(/href="([^"]*\.html)"/g, (match, p1) => {
    if (p1.includes('/') || p1.startsWith('http') || p1.startsWith('#')) return match;
    return `href="../categories/${p1}"`;
  });
  brandHeader = brandHeader.replace(/href="\.\.\/categories\/tvs\.html"/g, 'href="../categories/tvs.html"'); // ensure it's not double ../categories/../categories

  let html = brandHeader + `\n<h1 class="section-heading" style="margin-top: 20px;">${brand} Products</h1>\n` + brandsData[brand].join('\n\n') + footer;
  
  fs.writeFileSync(path.join(brandsDir, `${brand.toLowerCase()}.html`), html);
  console.log(`Generated ${brand}.html with ${brandsData[brand].length} products.`);
});
