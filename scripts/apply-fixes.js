/**
 * Grand Gesture — batch site fixes
 * Run: node scripts/apply-fixes.js
 */
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const ROOT = path.join(__dirname, "..");

function loadProducts() {
  const src = fs.readFileSync(path.join(ROOT, "search-data.js"), "utf8");
  const match = src.match(/window\.PRODUCTS_DATA\s*=\s*(\[[\s\S]*\]);/);
  if (!match) throw new Error("Could not parse search-data.js");
  return JSON.parse(match[1]);
}

function formatKsh(n) {
  return "KSh " + Number(n).toLocaleString("en-US");
}

function walkHtml(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== "scripts" && entry.name !== "scratch") {
      walkHtml(full, files);
    } else if (entry.isFile() && entry.name.endsWith(".html") && entry.name !== "admin.html") {
      files.push(full);
    }
  }
  return files;
}

function fixWishlistButtons($) {
  $(".btn-wishlist").each((_, el) => {
    const $wl = $(el);
    const name = $wl.attr("data-name") || "";
    const isBroken =
      name.includes('=""') ||
      /="\s*$/.test($.html(el)) ||
      !$wl.attr("data-category") ||
      ($wl.attr("data-url") === "" && $wl.hasClass("card-wishlist-btn"));

    if (isBroken || name.split('"').length > 3) {
      let $cart = $wl.next(".btn-add-cart, .tv-model-btn");
      if (!$cart.length) $cart = $wl.siblings(".btn-add-cart, .tv-model-btn").first();
      if (!$cart.length) $cart = $wl.parent().find(".btn-add-cart, .tv-model-btn").first();

      if ($cart.length) {
        const cartName = $cart.attr("data-name") || "";
        $wl.attr("data-name", cartName);
        $wl.attr("data-price", $cart.attr("data-price") || "");
        $wl.attr("data-image", $cart.attr("data-image") || "");
        const cat = $cart.attr("data-category") || inferCategoryFromName(cartName);
        $wl.attr("data-category", cat);
        // Strip bogus attributes cheerio parsed from broken HTML
        const keep = new Set(["type", "class", "title", "aria-label", "data-name", "data-price", "data-image", "data-category", "data-url", "disabled", "style"]);
        Object.keys(el.attribs || {}).forEach((key) => {
          if (!keep.has(key)) $wl.removeAttr(key);
        });
      }
    }
  });
}

function inferCategoryFromName(name) {
  const lower = (name || "").toLowerCase();
  if (/tv|uled|qled|oled|bravia|laser/.test(lower)) return "TVs";
  if (/soundbar|speaker|party rocker/.test(lower)) return "Sound Bars";
  if (/fridge|refrigerator|freezer/.test(lower)) return "Refrigerators";
  if (/wash|dryer|drying/.test(lower)) return "Washing Machines";
  if (/air conditioner|btu|split|cassette/.test(lower)) return "Air Conditioners";
  if (/microwave|air fryer|fryer/.test(lower)) return "Kitchen Appliances";
  return "Electronics";
}

function removePublicAdminLinks($) {
  $(".side-menu-group").each((_, group) => {
    const $g = $(group);
    if ($g.find(".admin-link").length || $g.find('a[href*="admin.html"]').length) {
      $g.remove();
    }
  });
  $('a.admin-link, a[href="admin.html"], a[href="../admin.html"]').remove();
}

function removeDeadAccountLinks($) {
  $(".side-menu-group").each((_, group) => {
    const $g = $(group);
    const text = $g.text();
    if (text.includes("My Account") || text.includes("Order History")) {
      $g.remove();
    }
  });
}

function fixTrustBar($) {
  $(".trust-item").each((_, item) => {
    const $item = $(item);
    const h4 = $item.find("h4").text().trim();
    if (h4 === "Secure Checkout") {
      $item.find("h4").text("WhatsApp Orders");
      $item.find("p").text("Fast & Easy");
    }
  });
}

function addFooterLinks($, basePath) {
  const $footer = $(".footer-links ul").first();
  if (!$footer.length) return;
  const links = [
    { href: basePath + "contact.html", label: "Contact Us" },
    { href: basePath + "delivery.html", label: "Delivery & Returns" },
    { href: basePath + "privacy.html", label: "Privacy Policy" },
  ];
  links.forEach(({ href, label }) => {
    if ($footer.find(`a[href="${href}"]`).length === 0) {
      $footer.append(`<li><a href="${href}">${label}</a></li>`);
    }
  });
}

function getBasePath(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  const depth = rel.split("/").length - 1;
  return depth > 0 ? "../".repeat(depth) : "";
}

function syncProductPage(filePath, product) {
  let html = fs.readFileSync(filePath, "utf8");
  const $ = cheerio.load(html, { decodeEntities: false });
  const price = product.price;
  const priceText = formatKsh(price);
  const img = "../" + product.image.replace(/^\.\.\//, "");

  $(".pdp-price").text(priceText);
  $(".btn-add-cart, .pdp-add-btn, .pdp-sticky-btn").each((_, btn) => {
    const $btn = $(btn);
    $btn.attr("data-price", String(price));
    $btn.attr("data-name", product.name);
    if ($btn.hasClass("pdp-add-btn")) {
      $btn.text(`Add to Cart — ${priceText}`);
    } else if ($btn.hasClass("pdp-sticky-btn")) {
      $btn.text("Add to Cart");
    }
    if (product.image) $btn.attr("data-image", img);
  });

  $(".btn-wishlist, .pdp-wishlist-btn").each((_, btn) => {
    const $btn = $(btn);
    $btn.attr("data-name", product.name);
    $btn.attr("data-price", String(price));
    $btn.attr("data-image", img);
    $btn.attr("data-url", "../" + product.url);
  });

  // Replace fake star ratings with stock status only
  $(".pdp-rating .pdp-stars").remove();
  if ($(".pdp-rating-count").length && $(".pdp-rating-count").text().includes("★")) {
    $(".pdp-rating-count").text("(In Stock)");
  }

  // Fix related product prices from PRODUCTS_DATA lookup
  $(".pdp-related-card").each((_, card) => {
    const $card = $(card);
    const name = $card.find(".pdp-related-card-name, h4, h3").first().text().trim();
    const $price = $card.find(".pdp-related-card-price");
    if ($price.text().includes("Contact for price") && name) {
      const match = loadProducts().find(
        (p) => p.name.toLowerCase().includes(name.toLowerCase().slice(0, 20)) ||
          name.toLowerCase().includes(p.name.toLowerCase().slice(0, 20))
      );
      if (match && match.price > 0) {
        $price.text(formatKsh(match.price));
      }
    }
  });

  fixWishlistButtons($);
  removePublicAdminLinks($);
  removeDeadAccountLinks($);
  fixTrustBar($);
  addFooterLinks($, "../");

  fs.writeFileSync(filePath, $.html(), "utf8");
}

function processGenericPage(filePath) {
  let html = fs.readFileSync(filePath, "utf8");
  const $ = cheerio.load(html, { decodeEntities: false });
  fixWishlistButtons($);
  removePublicAdminLinks($);
  removeDeadAccountLinks($);
  fixTrustBar($);
  addFooterLinks($, getBasePath(filePath));
  fs.writeFileSync(filePath, $.html(), "utf8");
}

// --- Main ---
const products = loadProducts();
const productByUrl = {};
products.forEach((p) => {
  productByUrl[p.url.replace(/^products\//, "")] = p;
});

let synced = 0;
for (const [slug, product] of Object.entries(productByUrl)) {
  const pdpPath = path.join(ROOT, "products", slug);
  if (fs.existsSync(pdpPath)) {
    syncProductPage(pdpPath, product);
    synced++;
  }
}

const htmlFiles = walkHtml(ROOT);
let processed = 0;
for (const file of htmlFiles) {
  if (file.includes(path.join("products", "")) && productByUrl[path.basename(file)]) {
    continue; // already synced
  }
  processGenericPage(file);
  processed++;
}

console.log(`Synced ${synced} product pages. Processed ${processed} other pages.`);
