/**
 * Extract all product variants from category pages and merge into search-data.js
 * Run: node scripts/build-variant-search.js
 */
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const ROOT = path.join(__dirname, "..");
const categoriesDir = path.join(ROOT, "categories");

function decodeHtml(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'");
}

function normalizeImage(img, categoryFile) {
  if (!img) return "";
  img = img.replace(/^\.\.\//, "");
  if (!img.startsWith("images/")) img = "images/" + path.basename(img);
  return img;
}

function extractVariantsFromFile(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  const $ = cheerio.load(html);
  const category = path.basename(filePath, ".html");
  const variants = [];
  const seen = new Set();

  function addVariant(data) {
    if (!data.name || data.name === "Product" || seen.has(data.name)) return;
    seen.add(data.name);
    variants.push(data);
  }

  $(".btn-add-cart").each((_, el) => {
    const $btn = $(el);
    const name = decodeHtml($btn.attr("data-name") || "").trim();
    if (!name) return;
    const price = Number($btn.attr("data-price") || 0);
    let image = $btn.attr("data-image") || "";
    const $section = $btn.closest(".tv-product, .tv-featured-block");
    if (!image && $section.length) {
      image = $section.find("img").first().attr("src") || "";
    }
    image = normalizeImage(image.replace(/^\.\.\//, ""), category);

    let url = $btn.attr("data-url") || "";
    const $row = $btn.closest('div[style*="display: flex"]');
    if ($row.length) {
      const href = $row.find("a.btn-view").attr("href") || "";
      if (href) url = href.replace(/^\.\.\//, "");
    }

    addVariant({ name, price, image, url, category });
  });

  return variants;
}

// Load existing search-data (PDP entries take precedence)
const searchPath = path.join(ROOT, "search-data.js");
const src = fs.readFileSync(searchPath, "utf8");
const match = src.match(/window\.PRODUCTS_DATA\s*=\s*(\[[\s\S]*\]);/);
const existing = JSON.parse(match[1]);
const byName = new Map(existing.map((p) => [p.name.toLowerCase(), p]));

// Extract from all category pages
const categoryFiles = fs.readdirSync(categoriesDir).filter((f) => f.endsWith(".html"));
let added = 0;

for (const file of categoryFiles) {
  const extracted = extractVariantsFromFile(path.join(categoriesDir, file));
  for (const v of extracted) {
    const key = v.name.toLowerCase();
    if (!byName.has(key)) {
      byName.set(key, {
        name: v.name,
        price: v.price,
        image: v.image,
        url: v.url || "",
        category: v.category,
      });
      added++;
    }
  }
}

const merged = Array.from(byName.values()).sort((a, b) =>
  a.name.localeCompare(b.name)
);

const output =
  "window.PRODUCTS_DATA = " +
  JSON.stringify(merged, null, 2)
    .replace(/"([^"]+)":/g, '"$1":')
    .replace(/\n/g, "\n") +
  ";\n";

fs.writeFileSync(searchPath, output, "utf8");
console.log(`search-data.js updated: ${existing.length} → ${merged.length} products (+${added} variants from categories)`);
