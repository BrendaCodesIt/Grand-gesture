const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for image uploads to ../images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../images'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

const categoriesDir = path.join(__dirname, '../categories');

// Helper to find all products
function getAllProducts() {
  const products = [];
  if (!fs.existsSync(categoriesDir)) return products;
  
  const files = fs.readdirSync(categoriesDir).filter(f => f.endsWith('.html'));
  
  files.forEach(file => {
    const content = fs.readFileSync(path.join(categoriesDir, file), 'utf8');
    const $ = cheerio.load(content);
    
    $('.btn-add-cart').each((i, btn) => {
      const $btn = $(btn);
      const name = $btn.attr('data-name');
      const price = $btn.attr('data-price');
      const image = $btn.attr('data-image');
      const category = file.replace('.html', '');
      
      if (name) {
        products.push({
          name,
          price,
          image,
          category,
          file
        });
      }
    });
  });
  
  return products;
}

// GET /api/products
app.get('/api/products', (req, res) => {
  res.json(getAllProducts());
});

// POST /api/upload
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // return relative path for HTML
  res.json({ imagePath: '../images/' + req.file.filename });
});

// POST /api/products/update
app.post('/api/products/update', (req, res) => {
  const { name, newPrice, newImage, file } = req.body;
  if (!name || !file) return res.status(400).json({ error: 'Name and file required' });

  const filePath = path.join(categoriesDir, file);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

  const content = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(content);
  let changed = false;

  $('.btn-add-cart').each((i, btn) => {
    const $btn = $(btn);
    if ($btn.attr('data-name') === name) {
      if (newPrice !== undefined) {
        $btn.attr('data-price', newPrice);
        // Try to update text if it contains "Add to Cart - "
        const text = $btn.text();
        if (text.includes('-')) {
            $btn.text(\`Add to Cart - KSh \${Number(newPrice).toLocaleString()}\`);
        }
      }
      if (newImage) {
        $btn.attr('data-image', newImage);
        // Also update the actual <img> tag inside the same .tv-featured-block
        const $block = $btn.closest('.tv-featured-block, .tv-product');
        if ($block.length > 0) {
          $block.find('img').attr('src', newImage);
        }
      }
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, $.html(), 'utf8');
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Product not found in file' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(\`Admin server running on http://localhost:\${PORT}\`);
});
