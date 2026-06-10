/**
 * Strip inline styles from TV cart buttons so CSS labels display correctly
 */
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const file = path.join(__dirname, "..", "categories", "tvs.html");
const $ = cheerio.load(fs.readFileSync(file, "utf8"), { decodeEntities: false });

let count = 0;
$(".btn-add-cart, .tv-model-btn").each((_, el) => {
  const $el = $(el);
  if ($el.attr("style")) {
    $el.removeAttr("style");
    count++;
  }
});

fs.writeFileSync(file, $.html(), "utf8");
console.log("Removed inline styles from", count, "buttons in tvs.html");
