const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const dirs = ['./categories', './brands'];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const $ = cheerio.load(content);
    let changed = false;

    // Find all product blocks
    $('.tv-featured-block, .tv-product').each((i, block) => {
      const $block = $(block);
      const title = $block.find('.tv-featured-title').text().trim() || 'Product';
      const imgPath = $block.find('img').attr('src') || '';
      
      const $aside = $block.find('.tv-featured-models');
      
      // If aside is missing, add it
      if ($aside.length === 0) {
        $block.append(`<aside class="tv-featured-models"></aside>`);
      }
      
      const $models = $block.find('.tv-featured-models');
      
      // If aside is completely empty, inject a button
      if ($models.children().length === 0) {
        $models.append(`
          <button
            type="button"
            class="tv-model-btn tv-model-btn--inline btn-add-cart"
            data-name="${title}"
            data-price="0"
            data-image="${imgPath}"
            style="display:block; width:100%; padding: 0.6rem; background: #fca311; color: #14213d; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; text-align: center; margin-bottom: 10px;"
          >
            Add to Cart
          </button>
        `);
        changed = true;
      } else {
        // Iterate through children. If we find an 'a' tag that acts as a model button,
        // let's make sure there's also an Add to Cart button.
        $models.children().each((j, child) => {
          const $child = $(child);
          
          if ($child.is('a') && $child.hasClass('tv-model-btn')) {
            // It's a link to a product page. Let's wrap it and add a cart button.
            const name = $child.attr('data-name') || $child.text().trim() || title;
            const price = $child.attr('data-price') || "0";
            const linkHref = $child.attr('href');
            
            const newHTML = `
              <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <a href="${linkHref}" class="btn-view" style="flex: 1; text-align: center; padding: 0.6rem; background: #eee; border-radius: 4px; text-decoration: none; color: #333;">View Details</a>
                <button type="button" class="btn-add-cart" data-name="${name}" data-price="${price}" data-image="${imgPath}" style="flex: 1; padding: 0.6rem; background: #fca311; color: #14213d; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">Add to Cart</button>
              </div>
            `;
            $child.replaceWith(newHTML);
            changed = true;
          } else if ($child.is('button') && $child.hasClass('tv-model-btn')) {
            // Already a button. Let's make sure it has btn-add-cart class so the global script catches it
            if (!$child.hasClass('btn-add-cart') && !$child.hasClass('btn-out-of-stock')) {
               $child.addClass('btn-add-cart');
               $child.attr('data-image', imgPath);
               if(!$child.attr('data-name')) $child.attr('data-name', $child.text().trim());
               changed = true;
            }
          }
        });
      }
    });

    // Make sure the bottom cart logic exists to handle .btn-add-cart if not present in index style
    // Wait, the index.html uses a standard global cart script, but category pages use the QuickAdd overlay.
    // To make sure .btn-add-cart works perfectly everywhere, we can inject the cart listener at the bottom if it doesn't exist.
    if (changed) {
      fs.writeFileSync(filePath, $.html(), 'utf8');
      console.log(`Standardized ${file}`);
    }
  });
});
