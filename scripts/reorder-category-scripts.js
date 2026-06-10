const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "categories");
const oldBlock =
  '<script src="../cart-shared.js"></script>\n  <script src="../category-variants.js"></script>';
const newBlock =
  '<script src="../category-variants.js"></script>\n  <script src="../cart-shared.js"></script>';

for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".html"))) {
  const p = path.join(dir, f);
  let h = fs.readFileSync(p, "utf8");
  if (h.includes(oldBlock)) {
    h = h.replace(oldBlock, newBlock);
    fs.writeFileSync(p, h);
    console.log("reordered scripts in", f);
  }
}
