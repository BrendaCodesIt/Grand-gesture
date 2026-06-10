/**
 * Generate sitemap.xml from search-data.js product URLs
 * Run: node scripts/generate-sitemap.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(ROOT, "search-data.js"), "utf8");
const match = src.match(/window\.PRODUCTS_DATA\s*=\s*(\[[\s\S]*\]);/);
const products = JSON.parse(match[1]);

const staticPages = [
  "",
  "index.html",
  "cart.html",
  "checkout.html",
  "wishlist.html",
  "contact.html",
  "delivery.html",
  "privacy.html",
  "categories/tvs.html",
  "categories/soundbars.html",
  "categories/refrigerators.html",
  "categories/washing-machines.html",
  "categories/air-conditioners.html",
  "categories/kitchen-appliances.html",
  "categories/other-appliances.html",
  "brands/hisense.html",
  "brands/sony.html",
  "brands/lg.html",
  "brands/skyworth.html",
];

const urls = [...staticPages.map((p) => p || "index.html"), ...products.map((p) => p.url)];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>/${u.replace(/^\//, "")}</loc></url>`).join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml, "utf8");
console.log("Generated sitemap.xml with", urls.length, "URLs");
