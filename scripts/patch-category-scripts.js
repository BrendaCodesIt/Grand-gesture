const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "categories");
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".html"))) {
  const p = path.join(dir, f);
  let h = fs.readFileSync(p, "utf8");
  if (h.includes("category-variants.js")) {
    console.log("skip", f);
    continue;
  }
  const needle = '<script src="../cart-shared.js"></script>';
  if (h.includes(needle)) {
    h = h.replace(
      needle,
      needle + '\n  <script src="../category-variants.js"></script>'
    );
    fs.writeFileSync(p, h);
    console.log("patched", f);
  } else {
    console.log("no cart-shared in", f);
  }
}
