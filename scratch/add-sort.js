const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const dirs = ['./categories', './brands'];

const sortHTML = `
<div class="sort-toolbar" style="padding: 15px 5%; margin-bottom: 20px; display: flex; justify-content: flex-end; align-items: center; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
  <label for="sort-select" style="margin-right: 15px; font-weight: 600; color: #14213d;">Sort By:</label>
  <select id="sort-select" style="padding: 8px 12px; border-radius: 4px; border: 1px solid #ccc; font-family: 'Montserrat', sans-serif; font-size: 1rem; color: #333; outline: none; cursor: pointer;">
    <option value="default">Default</option>
    <option value="price-asc">Price: Low to High</option>
    <option value="price-desc">Price: High to Low</option>
    <option value="name-asc">Name: A to Z</option>
    <option value="name-desc">Name: Z to A</option>
  </select>
</div>
`;

const sortJS = `
<script>
  document.addEventListener("DOMContentLoaded", () => {
    const sortSelect = document.getElementById("sort-select");
    if (!sortSelect) return;

    // Find the container that holds the products. Usually the parent of the first .tv-featured-block
    const firstBlock = document.querySelector(".tv-featured-block, .tv-product");
    if (!firstBlock) return;
    const container = firstBlock.parentNode;

    // Get all product blocks as an array
    const productBlocks = Array.from(document.querySelectorAll(".tv-featured-block, .tv-product"));
    
    // Store original order to restore "default"
    const originalOrder = [...productBlocks];

    sortSelect.addEventListener("change", (e) => {
      const val = e.target.value;
      let sortedBlocks;

      if (val === "default") {
        sortedBlocks = originalOrder;
      } else {
        sortedBlocks = [...productBlocks].sort((a, b) => {
          // Extract price and name from the .btn-add-cart inside the block
          const btnA = a.querySelector(".btn-add-cart");
          const btnB = b.querySelector(".btn-add-cart");
          
          let priceA = btnA ? Number(btnA.getAttribute("data-price") || 0) : 0;
          let priceB = btnB ? Number(btnB.getAttribute("data-price") || 0) : 0;
          
          let nameA = btnA ? (btnA.getAttribute("data-name") || "") : "";
          let nameB = btnB ? (btnB.getAttribute("data-name") || "") : "";
          
          if (val === "price-asc") return priceA - priceB;
          if (val === "price-desc") return priceB - priceA;
          if (val === "name-asc") return nameA.localeCompare(nameB);
          if (val === "name-desc") return nameB.localeCompare(nameA);
          return 0;
        });
      }

      // Re-append to container
      sortedBlocks.forEach(block => container.appendChild(block));
    });
  });
</script>
`;

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We don't strictly need cheerio if we can just string replace, but cheerio handles HTML nicely.
    // However, cheerio sometimes messes up DOCTYPE and formatting.
    // Let's use string manipulation to be safe and preserve exact formatting.
    
    let changed = false;
    
    if (!content.includes('class="sort-toolbar"')) {
      // Find the first occurrence of <section class="tv-featured-block" or <section class="tv-product"
      const match = content.match(/<section class="(tv-featured-block|tv-product)"/);
      if (match) {
        const index = match.index;
        content = content.substring(0, index) + sortHTML + '\\n' + content.substring(index);
        changed = true;
      }
    }
    
    if (changed && !content.includes('id="sort-select"')) {
       // just a safety check, we just added it
    }
    
    if (!content.includes('sortSelect.addEventListener')) {
      content = content.replace('</body>', sortJS + '\\n  </body>');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Added sorting to ' + file);
    }
  });
});
