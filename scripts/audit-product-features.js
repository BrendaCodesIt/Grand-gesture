const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "products");
const files = [...new Set(fs.readdirSync(dir).filter((f) => f.endsWith(".html")))];

const empty = [];
const hasFeatures = [];

for (const f of files) {
  const html = fs.readFileSync(path.join(dir, f), "utf8");
  const titleMatch = html.match(/<h1 class="pdp-title">([\s\S]*?)<\/h1>/);
  const title = titleMatch
    ? titleMatch[1].replace(/&quot;/g, '"').replace(/<[^>]+>/g, "").trim()
    : f;

  const m = html.match(/<ul class="pdp-features">([\s\S]*?)<\/ul>/);
  let items = [];
  if (m) {
    items = [...m[1].matchAll(/<li[\s\S]*?<span>([\s\S]*?)<\/span>\s*<\/li>/g)]
      .map((x) => x[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }

  const rec = { file: f, title, count: items.length, sample: items.slice(0, 3) };
  if (!m || items.length === 0) empty.push(rec);
  else hasFeatures.push(rec);
}

console.log("=== PRODUCTS WITHOUT FEATURES (" + empty.length + ") ===");
empty.forEach((r) => console.log("-", r.file, "|", r.title));

console.log("\n=== PRODUCTS WITH FEW FEATURES (<3) ===");
hasFeatures
  .filter((r) => r.count < 3)
  .forEach((r) => console.log("-", r.file, "|", r.count, "|", r.title));

console.log("\nTotal products:", files.length);
console.log("With features:", hasFeatures.length);
console.log("Without features:", empty.length);

fs.writeFileSync(
  path.join(__dirname, "..", "scratch", "products-without-features.json"),
  JSON.stringify({ empty, hasFeatures }, null, 2)
);
