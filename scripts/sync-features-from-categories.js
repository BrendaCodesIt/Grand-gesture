/**
 * Extract product highlights from category pages and sync to PDP feature tabs.
 * Also applies manual overrides from product-features-manual.json.
 */
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const root = path.join(__dirname, "..");
const categoriesDir = path.join(root, "categories");
const productsDir = path.join(root, "products");
const manualPath = path.join(__dirname, "product-features-manual.json");

function normalizeHref(href) {
  if (!href) return "";
  const cleaned = href.replace(/^\.\.\//, "").replace(/^\/+/, "");
  return cleaned.startsWith("products/") ? cleaned : `products/${path.basename(cleaned)}`;
}

function extractFeatures($, $section) {
  const features = [];

  $section.find(".tv-highlights li, .tv-featured-highlights li").each((_, li) => {
    const text = $(li).text().replace(/\s+/g, " ").trim();
    if (text) features.push(text);
  });

  $section.find(".ac-features-grid .ac-feature-label").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text) features.push(text);
  });

  return features;
}

function collectFromCategories() {
  const map = new Map();

  for (const file of fs.readdirSync(categoriesDir).filter((f) => f.endsWith(".html"))) {
    const html = fs.readFileSync(path.join(categoriesDir, file), "utf8");
    const $ = cheerio.load(html, { decodeEntities: false });

    $("section.tv-featured-block").each((_, section) => {
      const $s = $(section);
      const features = extractFeatures($, $s);
      if (!features.length) return;

      const links = new Set();
      $s.find('a[href*="products/"]').each((__, a) => {
        const href = normalizeHref($(a).attr("href"));
        if (href) links.add(path.basename(href));
      });

      for (const filename of links) {
        if (!map.has(filename)) map.set(filename, features);
      }
    });
  }

  return map;
}

function loadManual() {
  if (!fs.existsSync(manualPath)) return {};
  return JSON.parse(fs.readFileSync(manualPath, "utf8"));
}

function featuresToHtml(features) {
  return features
    .map(
      (f) =>
        `            <li><span class="pdp-feature-icon"></span><span>${f.replace(/&/g, "&amp;")}</span></li>`
    )
    .join("\n");
}

function getFeatureCount(html) {
  const ulMatch = html.match(/<ul class="pdp-features">([\s\S]*?)<\/ul>/);
  if (!ulMatch) return -1;
  const items = [...ulMatch[1].matchAll(/<li[\s\S]*?<\/li>/g)];
  return items.length;
}

function updatePdpFile(filePath, features, opts) {
  let html = fs.readFileSync(filePath, "utf8");
  const count = getFeatureCount(html);
  if (count < 0) return false;
  if (!opts?.force && count > 0) return false;

  const newUl = `<ul class="pdp-features">\n${featuresToHtml(features)}\n              </ul>`;
  html = html.replace(/<ul class="pdp-features">[\s\S]*?<\/ul>/, newUl);
  fs.writeFileSync(filePath, html, "utf8");
  return true;
}

const featureMap = collectFromCategories();
const manual = loadManual();
let updated = 0;
let stillEmpty = [];

for (const file of fs.readdirSync(productsDir).filter((f) => f.endsWith(".html"))) {
  const p = path.join(productsDir, file);
  const html = fs.readFileSync(p, "utf8");
  const count = getFeatureCount(html);

  const manualFeatures = manual[file];
  const categoryFeatures = featureMap.get(file);
  const forceManual = Array.isArray(manualFeatures) && manualFeatures.length > 0;

  if (forceManual) {
    if (updatePdpFile(p, manualFeatures, { force: true })) {
      updated++;
      console.log("Updated from manual:", file, `(${manualFeatures.length} features)`);
      continue;
    }
  }

  if (count === 0 && categoryFeatures && categoryFeatures.length) {
    if (updatePdpFile(p, categoryFeatures)) {
      updated++;
      console.log("Updated from category:", file, `(${categoryFeatures.length} features)`);
      continue;
    }
  }

  if (getFeatureCount(fs.readFileSync(p, "utf8")) === 0) {
    stillEmpty.push(file);
  }
}

console.log("\nUpdated:", updated);
console.log("Still empty:", stillEmpty.length);
stillEmpty.forEach((f) => console.log(" -", f));

fs.mkdirSync(path.join(root, "scratch"), { recursive: true });
fs.writeFileSync(
  path.join(root, "scratch", "products-still-no-features.json"),
  JSON.stringify(stillEmpty, null, 2)
);
