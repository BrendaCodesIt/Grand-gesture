/**
 * Inject theme.js into all public HTML pages (head, before </head>)
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dirs = [".", "categories", "brands", "products"];

function walkHtmlFiles(dir) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".html"))
    .map((f) => path.join(full, f));
}

function themeSrc(filePath) {
  const relDir = path.relative(root, path.dirname(filePath));
  if (!relDir || relDir === ".") return "theme.js";
  const depth = relDir.split(path.sep).filter(Boolean).length;
  return "../".repeat(depth) + "theme.js";
}

let updated = 0;
for (const dir of dirs) {
  for (const filePath of walkHtmlFiles(dir)) {
    let html = fs.readFileSync(filePath, "utf8");
    if (html.includes("theme.js")) continue;

    const src = themeSrc(filePath);
    const tag = `  <script src="${src}"></script>\n`;
    const headClose = html.indexOf("</head>");
    if (headClose === -1) continue;

    html = html.slice(0, headClose) + tag + html.slice(headClose);

    html = html.replace(/\sclass="page-home"/g, "");

    fs.writeFileSync(filePath, html, "utf8");
    updated++;
    console.log("Injected theme.js into", path.relative(root, filePath));
  }
}

console.log("Done.", updated, "files updated.");
