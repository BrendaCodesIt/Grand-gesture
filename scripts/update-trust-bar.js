/**
 * Modern trust bar — sync across all HTML pages
 * Fast delivery icon: Awicon / Flaticon (attribution required)
 */
const fs = require("fs");
const path = require("path");

function iconPathForFile(filePath, root) {
  const relDir = path.relative(root, path.dirname(filePath));
  if (!relDir || relDir === ".") return "images/icons/fast-delivery-awicon.png";
  const depth = relDir.split(path.sep).filter(Boolean).length;
  return "../".repeat(depth) + "images/icons/fast-delivery-awicon.png";
}

function buildTrustBar(fastDeliveryIconSrc) {
  return `<!-- Trust Bar -->
  <section class="trust-bar" aria-label="Store benefits">
    <div class="trust-bar-inner">
      <article class="trust-card">
        <div class="trust-icon-wrap trust-icon-wrap--flaticon" aria-hidden="true">
          <img src="${fastDeliveryIconSrc}" alt="" class="trust-icon-img" width="32" height="32" loading="lazy">
        </div>
        <div class="trust-item-text">
          <h4>Fast Delivery</h4>
          <p>Nationwide Shipping</p>
        </div>
      </article>
      <article class="trust-card">
        <div class="trust-icon-wrap trust-icon-wrap--whatsapp" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
          </svg>
        </div>
        <div class="trust-item-text">
          <h4>WhatsApp Orders</h4>
          <p>Fast &amp; Easy</p>
        </div>
      </article>
      <article class="trust-card">
        <div class="trust-icon-wrap" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
        <div class="trust-item-text">
          <h4>100% Genuine</h4>
          <p>Certified Products</p>
        </div>
      </article>
      <article class="trust-card">
        <div class="trust-icon-wrap" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/>
            <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/>
            <path d="M12 3v6"/>
            <path d="m16 13-4 4-2-2"/>
          </svg>
        </div>
        <div class="trust-item-text">
          <h4>Easy Returns</h4>
          <p>Hassle-Free Policy</p>
        </div>
      </article>
    </div>
  </section>`;
}

const ATTRIBUTION =
  '<p class="icon-attribution"><a href="https://www.flaticon.com/free-icons/fast-delivery" title="fast delivery icons" target="_blank" rel="noopener noreferrer">Fast delivery icons created by Awicon - Flaticon</a></p>';

const root = path.join(__dirname, "..");
const dirs = [".", "categories", "brands", "products"];

function walkHtmlFiles(dir) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter((f) => f.endsWith(".html")).map((f) => path.join(full, f));
}

let updated = 0;
for (const dir of dirs) {
  for (const filePath of walkHtmlFiles(dir)) {
    let html = fs.readFileSync(filePath, "utf8");
    let changed = false;

    const start = html.indexOf("<!-- Trust Bar -->");
    if (start !== -1) {
      const sectionStart = html.indexOf('<section class="trust-bar"', start);
      const end = html.indexOf("</section>", sectionStart);
      if (sectionStart !== -1 && end !== -1) {
        const iconSrc = iconPathForFile(filePath, root);
        const newBar = buildTrustBar(iconSrc);
        html =
          html.slice(0, sectionStart) +
          newBar.slice(newBar.indexOf("<section")) +
          html.slice(end + 10);
        changed = true;
      }
    }

    if (!html.includes("icon-attribution") && html.includes('class="footer-bottom"')) {
      html = html.replace(
        /(<div class="footer-bottom">\s*<p>©[^<]+<\/p>)/,
        `$1\n        ${ATTRIBUTION}`
      );
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, html, "utf8");
      updated++;
      console.log("Updated", path.relative(root, filePath));
    }
  }
}

console.log("Done.", updated, "files updated.");
