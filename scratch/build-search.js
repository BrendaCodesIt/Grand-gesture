const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const productsDir = './products';
if (!fs.existsSync(productsDir)) {
  console.log('No products dir');
  process.exit(1);
}

const files = fs.readdirSync(productsDir).filter(f => f.endsWith('.html'));
const db = [];

files.forEach(file => {
  const filePath = path.join(productsDir, file);
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html);
  
  let name = $('h1').first().text().trim() || $('title').text().replace('- Grand Gesture', '').trim();
  
  // Try to find the price in the inline script first
  let priceNum = 0;
  let imgSrc = '';
  
  const scriptContent = html; // We can regex the script block since it's JSON-like
  const priceMatch = scriptContent.match(/price:\\s*(\\d+)/);
  if (priceMatch) {
    priceNum = parseInt(priceMatch[1], 10);
  } else {
    // Try to find KSh in HTML
    const priceText = $('body').text().match(/KSh\\s*[0-9,]+/i);
    if (priceText) {
      priceNum = parseInt(priceText[0].replace(/[^0-9]/g, ''), 10);
    }
  }
  
  const imgMatch = scriptContent.match(/image:\\s*(['"])(.*?)\\1/);
  if (imgMatch) {
    imgSrc = imgMatch[2];
  } else {
    imgSrc = $('img').first().attr('src') || '';
  }
  
  if (imgSrc.startsWith('../')) imgSrc = imgSrc.replace('../', '');
  if (imgSrc && !imgSrc.includes('/')) imgSrc = 'images/' + imgSrc;

  if (name) {
    db.push({
      name,
      price: priceNum,
      image: imgSrc,
      url: `products/${file}`
    });
  }
});

const jsContent = `window.PRODUCTS_DATA = ${JSON.stringify(db, null, 2)};`;
fs.writeFileSync('search-data.js', jsContent, 'utf8');
console.log(`Generated search-data.js with ${db.length} products.`);
