const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// --- 1. Add CSS for the Modal ---
const cssPath = path.join(__dirname, '../styles.css');
let css = fs.readFileSync(cssPath, 'utf8');

const modalCss = `
/* ── Cart Modal ── */
.cart-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.cart-modal-overlay.active {
  opacity: 1;
  pointer-events: auto;
}
.cart-modal {
  background: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  transform: translateY(20px);
  transition: transform 0.3s ease;
  position: relative;
}
.cart-modal-overlay.active .cart-modal {
  transform: translateY(0);
}
.cart-modal-close {
  position: absolute;
  top: 15px; right: 15px;
  background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;
}
.cart-modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
}
.cart-modal-icon {
  font-size: 2rem;
  color: #4caf50;
}
.cart-modal-title {
  margin: 0;
  font-family: 'Montserrat', sans-serif;
  font-size: 1.2rem;
  color: #333;
}
.cart-modal-msg {
  color: #666;
  font-size: 0.95rem;
  margin: 0;
}
.cart-modal-recs {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
}
.cart-modal-recs h4 {
  margin: 0 0 10px 0;
  font-size: 1rem;
  color: #14213d;
}
.rec-item {
  display: flex;
  gap: 15px;
  align-items: center;
}
.rec-item img {
  width: 60px;
  height: 60px;
  object-fit: contain;
  background: #fff;
  border-radius: 4px;
}
.rec-item-info {
  flex: 1;
}
.rec-item-name {
  margin: 0; font-size: 0.9rem; font-weight: 600; color: #333;
}
.rec-item-price {
  margin: 4px 0 0 0; font-size: 0.85rem; color: #fca311; font-weight: bold;
}
.cart-modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.btn-outline {
  flex: 1; padding: 10px; text-align: center; border: 1px solid #ccc; background: #fff; color: #333; border-radius: 4px; cursor: pointer; font-weight: 600; text-decoration: none;
}
.btn-primary {
  flex: 1; padding: 10px; text-align: center; border: none; background: #fca311; color: #14213d; border-radius: 4px; cursor: pointer; font-weight: 600; text-decoration: none;
}
`;

if (!css.includes('.cart-modal-overlay')) {
  fs.writeFileSync(cssPath, css + '\n' + modalCss, 'utf8');
  console.log('Added modal CSS');
}

// --- 2. Add Modal HTML and JS Logic to all pages ---
const modalHTML = `
<!-- Cart Modal -->
<div class="cart-modal-overlay" id="cart-modal">
  <div class="cart-modal">
    <button class="cart-modal-close" id="cart-modal-close">&times;</button>
    <div class="cart-modal-header">
      <div class="cart-modal-icon">&#10004;</div>
      <div>
        <h3 class="cart-modal-title" id="cart-modal-title">Added to Cart</h3>
        <p class="cart-modal-msg" id="cart-modal-msg">Item has been added to your cart.</p>
      </div>
    </div>
    <div class="cart-modal-recs" id="cart-modal-recs" style="display:none;">
      <h4>Frequently Bought Together</h4>
      <div class="rec-item" id="rec-item-container">
        <!-- populated by JS -->
      </div>
    </div>
    <div class="cart-modal-actions">
      <button class="btn-outline" id="cart-modal-continue">Continue Shopping</button>
      <a href="REPLACE_CART_PATH" class="btn-primary">View Cart</a>
    </div>
  </div>
</div>
`;

const scriptLogic = `
<script>
  /* ── Enhanced Cart Logic with Recommendations ── */
  const formatKshPrice = (num) => "KSh " + num.toLocaleString("en-US");
  
  const recData = [
    { name: "Hisense 55 ULED Mini LED U6 Pro", price: 63800, category: "TVs", image: "images/Hisense 55 ULED Mini LED U6 Pro.png" },
    { name: "Hisense AX3100G 3.1CH Soundbar", price: 19000, category: "Sound Bars", image: "images/Hisense AX3100G 3.1CH Soundbar, 280W – Black.png" },
    { name: "Hisense 10.5/6kg Wash & Dry", price: 58000, category: "Washing Machines", image: "images/Washing machine Front load 10.5 6kg.png" },
    { name: "Hisense 12000 BTU Air Conditioner", price: 45000, category: "Air Conditioners", image: "images/Air conditioner 2.png" },
    { name: "Hisense Fridge 424L Double Door", price: 63000, category: "Refrigerators", image: "images/Hisense Fridge 424L Double Door Silver REF418DR.png" },
    { name: "Hisense 6.3L Air Fryer", price: 12000, category: "Kitchen Appliances", image: "images/Hisense 6.3L Air Fryer H06AFBS1S3.png" }
  ];

  function getRecommendation(addedCategory) {
    if (!addedCategory) return recData[1];
    const cat = addedCategory.toLowerCase();
    let recCat = "Sound Bars";
    if (cat.includes("tv")) recCat = "Sound Bars";
    else if (cat.includes("sound")) recCat = "TVs";
    else if (cat.includes("wash")) recCat = "Air Conditioners";
    else if (cat.includes("refrigerator")) recCat = "Kitchen Appliances";
    else if (cat.includes("kitchen")) recCat = "Refrigerators";
    else if (cat.includes("air")) recCat = "Washing Machines";
    
    return recData.find(r => r.category === recCat) || recData[0];
  }

  function addSpecificItemToCart(item) {
    let cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
    const existing = cartItems.find((ci) => ci.name === item.name);
    let isNew = false;
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cartItems.push(Object.assign({}, item, {
        id: item.name.toLowerCase().replace(/\\s+/g, "-") + "-" + Date.now(),
        quantity: 1,
      }));
      isNew = true;
    }
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    showCartModal(item, isNew);
  }

  function showCartModal(item, isNew) {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    
    const title = document.getElementById('cart-modal-title');
    const msg = document.getElementById('cart-modal-msg');
    
    if (isNew) {
      title.textContent = "Added to Cart!";
      msg.textContent = item.name + " was added to your cart.";
    } else {
      title.textContent = "Cart Updated!";
      msg.textContent = item.name + " is already in your cart. We increased the quantity.";
    }
    
    // Recommendations
    const recsBlock = document.getElementById('cart-modal-recs');
    const recContainer = document.getElementById('rec-item-container');
    const rec = getRecommendation(item.category);
    
    if (rec && rec.name !== item.name) {
      const isSubdir = window.location.pathname.includes('categories/') || window.location.pathname.includes('brands/');
      const basePath = isSubdir ? '../' : '';
      const imgPath = basePath + rec.image;
      
      recContainer.innerHTML = \`
        <img src="\${imgPath}" alt="Recommendation">
        <div class="rec-item-info">
          <p class="rec-item-name">\${rec.name}</p>
          <p class="rec-item-price">\${formatKshPrice(rec.price)}</p>
          <button class="btn-primary btn-add-cart" data-name="\${rec.name}" data-price="\${rec.price}" data-category="\${rec.category}" data-image="\${imgPath}" style="padding: 4px 8px; font-size: 0.8rem; margin-top: 5px;">Add Too</button>
        </div>
      \`;
      recsBlock.style.display = 'block';
      
      // Bind event to new button
      const newBtn = recContainer.querySelector('.btn-add-cart');
      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addSpecificItemToCart({
          name: rec.name, price: rec.price, displayPrice: formatKshPrice(rec.price), category: rec.category, image: imgPath
        });
      });
      
    } else {
      recsBlock.style.display = 'none';
    }
    
    modal.classList.add('active');
  }

  // Close modal logic
  document.addEventListener("DOMContentLoaded", () => {
    const closeBtns = document.querySelectorAll('#cart-modal-close, #cart-modal-continue');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('cart-modal').classList.remove('active');
      });
    });
    
    // Override existing Add to Cart buttons
    document.querySelectorAll(".btn-add-cart").forEach((btn) => {
      // remove old listeners by cloning
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const item = {
          name: newBtn.dataset.name || "Product",
          price: Number(newBtn.dataset.price) || 0,
          displayPrice: formatKshPrice(Number(newBtn.dataset.price) || 0),
          category: newBtn.dataset.category || "Products",
          image: newBtn.dataset.image || "",
        };
        addSpecificItemToCart(item);
      });
    });
  });
</script>
`;;

const dirs = ['./products'];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Strip old cart logic block if present.
    // The old logic starts with /* ── Cart Logic ── */ or inline cart JS in categories
    // We will just remove it by looking for the start of the script tag and ending at the end
    // But since it's hard to isolate, I'll just remove the specific old inline listeners and functions if I can.
    // Actually, because my new script executes on DOMContentLoaded and clones buttons to remove old listeners,
    // the old listeners will be wiped out automatically!
    // I only need to redefine \`addSpecificItemToCart\` (which my script does, overriding the global function).
    
    if (!content.includes('cart-modal-overlay')) {
      const isSubdir = dir !== '.';
      const cartPath = isSubdir ? '../cart.html' : 'cart.html';
      const customizedModal = modalHTML.replace('REPLACE_CART_PATH', cartPath);
      
      // Inject modal HTML before closing body
      content = content.replace('</body>', customizedModal + '\\n</body>');
      
      // Inject new script
      content = content.replace('</body>', scriptLogic + '\\n</body>');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Added modal to ' + file);
    }
  });
});
