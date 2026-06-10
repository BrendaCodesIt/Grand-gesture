/**
 * Label all TV cart buttons with size/series + price (HTML fallback before JS runs)
 */
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const file = path.join(__dirname, "..", "categories", "tvs.html");
const html = fs.readFileSync(file, "utf8");
const $ = cheerio.load(html, { decodeEntities: false });

function formatKsh(n) {
  return "KSh " + Number(n).toLocaleString("en-US");
}

function extractSize(name) {
  const m = name.match(/(\d{2,3})\s*(?:"|″|\s*inch\b)/i);
  return m ? m[1] + '"' : null;
}

function extractSeries(name) {
  const paren = name.match(/\(([^)]+)\)/);
  if (paren) return paren[1].trim();
  const series = name.match(/\b(A[467]|Q[67]|U6 PRO|U7 PRO|U7Q|Mini-LED|Mini Led|NanoCell|BRAVIA|OLED)\b/i);
  if (series) return series[1];
  return null;
}

function variantLabel(name) {
  const size = extractSize(name);
  const series = extractSeries(name);
  if (size && series) return size + " · " + series;
  if (size) return size + " TV";
  if (series) return series;
  return name.length > 40 ? name.slice(0, 38) + "…" : name;
}

let count = 0;
$(".btn-add-cart, .tv-model-btn.btn-add-cart").each((_, el) => {
  const $btn = $(el);
  const name = ($btn.attr("data-name") || "").replace(/&quot;/g, '"').trim();
  const price = Number($btn.attr("data-price") || 0);
  if (!name || !price) return;

  const label = variantLabel(name);
  const oos = $btn.attr("disabled") !== undefined || $btn.hasClass("btn-out-of-stock");
  $btn.removeAttr("style");
  $btn.addClass("tv-model-btn--labeled");

  $btn.html(
    '<span class="tv-btn-label">' +
      label +
      "</span>" +
      '<span class="tv-btn-price">' +
      formatKsh(price) +
      (oos ? " <em>OOS</em>" : "") +
      "</span>"
  );
  count++;
});

fs.writeFileSync(file, $.html(), "utf8");
console.log("Labeled", count, "cart buttons in tvs.html");
