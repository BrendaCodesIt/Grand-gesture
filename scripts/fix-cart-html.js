/**
 * Rewrites cart.html with valid document structure
 */
const fs = require("fs");
const path = require("path");

const cartPath = path.join(__dirname, "..", "cart.html");
let html = fs.readFileSync(cartPath, "utf8");

// Extract body content between first header and closing body
const headerStart = html.indexOf('<header class="top-header"');
const scriptStart = html.indexOf("<script>", html.indexOf("cart-page"));
const inlineScript = html.slice(scriptStart, html.indexOf("</script>", scriptStart) + 9);
const afterScript = html.slice(html.indexOf("<!-- Cart Modal -->"));

const fixed = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cart - Grand Gesture</title>
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  ${html.slice(headerStart, scriptStart)}
${inlineScript}
${afterScript.replace(/admin\.html[^<]*/g, "").replace(/<div class="side-menu-group">\s*<h3>System<\/h3>[\s\S]*?<\/div>\s*/g, "")}`;

// Fix subtitle
const final = fixed.replace(
  "Items selected from the TVs page appear here with image and price.",
  "Review your items below before proceeding to checkout."
);

fs.writeFileSync(cartPath, final, "utf8");
console.log("Fixed cart.html");
