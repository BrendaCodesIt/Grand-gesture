/**
 * Replace ac-features-grid on air-conditioners category page with researched tv-highlights.
 * Also apply image fixes for upside-down cassette product shots.
 */
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const root = path.join(__dirname, "..");
const pagePath = path.join(root, "categories", "air-conditioners.html");
const featuresPath = path.join(__dirname, "category-ac-features.json");

const featuresBySection = JSON.parse(fs.readFileSync(featuresPath, "utf8"));

function highlightsHtml(features) {
  const items = features.map((f) => `<li>${f.replace(/&/g, "&amp;")}</li>`).join("\n            ");
  return `<ul class="tv-highlights tv-featured-highlights">\n            ${items}\n          </ul>`;
}

let html = fs.readFileSync(pagePath, "utf8");
const $ = cheerio.load(html, { decodeEntities: false });

let replaced = 0;
let updatedLists = 0;

$("section.tv-featured-block").each((_, section) => {
  const $s = $(section);
  const label = $s.attr("aria-label") || "";
  const features = featuresBySection[label];
  if (!features || !features.length) return;

  const $grid = $s.find(".ac-features-grid").first();
  if ($grid.length) {
    $grid.replaceWith(highlightsHtml(features));
    replaced++;
    console.log("Replaced ac-features-grid:", label);
    return;
  }

  const $list = $s.find(".tv-highlights.tv-featured-highlights").first();
  if ($list.length) {
    $list.replaceWith(highlightsHtml(features));
    updatedLists++;
    console.log("Updated tv-highlights:", label);
  }
});

// Fix cassette product images — use correct-orientation assets
const imageFixes = [
  {
    from: "../images/Air conditioner 5.png",
    to: "../images/Hisense 18000BTU Cassette Air Conditioner AUC-18HR4SAA1.png",
    alt: "Hisense Cassette 18000 BTU air conditioner product image",
  },
];

$("img.tv-featured-image").each((_, img) => {
  const src = $(img).attr("src") || "";
  const fix = imageFixes.find((f) => src === f.from);
  if (fix) {
    $(img).attr("src", fix.to);
    if (fix.alt) $(img).attr("alt", fix.alt);
    console.log("Fixed image:", fix.from, "→", fix.to);
  }
});

fs.writeFileSync(pagePath, $.html(), "utf8");
console.log("\nGrids replaced:", replaced);
console.log("Lists updated:", updatedLists);
