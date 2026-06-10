/* ═══════════════════════════════════════════════════════════
   Grand Gesture — Category Variant Picker
   Transforms stacked "Add to Cart" buttons into size/model
   selectors with a single price display and cart action.
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const formatKsh = (n) => "KSh " + Number(n).toLocaleString("en-US");

  function decodeHtml(str) {
    const d = document.createElement("textarea");
    d.innerHTML = str;
    return d.value;
  }

  function extractSize(name) {
    const m = name.match(/(\d{2,3})\s*(?:"|″|\s*inch\b)/i);
    return m ? m[1] + '"' : null;
  }

  function extractSeries(name) {
    const paren = name.match(/\(([^)]+)\)/);
    if (paren) return paren[1].trim();
    const series = name.match(/\b(A[467]|Q[67]|U[67]|U6 PRO|U7 PRO|Mini-LED|NanoCell|BRAVIA|OLED)\b/i);
    if (series) return series[1];
    return null;
  }

  function shortLabel(name, size, allSizes) {
    const series = extractSeries(name);
    const uniqueSizes = new Set(allSizes.filter(Boolean));
    if (uniqueSizes.size > 1 && size) {
      return series ? size + " · " + series : size;
    }
    if (series) return series;
    if (size) return size;
    return name.length > 42 ? name.slice(0, 40) + "…" : name;
  }

  function inferCategory(section) {
    const path = window.location.pathname;
    if (path.includes("tvs")) return "TVs";
    if (path.includes("washing")) return "Washing Machines";
    if (path.includes("refrigerator")) return "Refrigerators";
    if (path.includes("air-conditioner")) return "Air Conditioners";
    if (path.includes("kitchen")) return "Kitchen Appliances";
    if (path.includes("soundbar")) return "Sound Bars";
    return "Electronics";
  }

  function getSectionImage(section) {
    const img = section.querySelector(".tv-image, .tv-featured-image");
    return img ? img.getAttribute("src") || "" : "";
  }

  function collectVariantsFromContainer(container, section) {
    const variants = [];
    const seen = new Set();
    const defaultImage = getSectionImage(section);
    const category = inferCategory(section);

    function addFromButton(btn, viewUrl) {
      if (!btn || !btn.classList.contains("btn-add-cart")) return;
      const name = decodeHtml(btn.getAttribute("data-name") || btn.textContent.replace(/Add to Cart.*/i, "").trim());
      if (!name || name === "Product") return;
      const id = btn.getAttribute("data-id") || name;
      if (seen.has(id)) return;
      seen.add(id);

      const price = Number(btn.getAttribute("data-price") || 0);
      const originalPrice = Number(btn.getAttribute("data-original-price") || 0);
      const image = btn.getAttribute("data-image") || defaultImage;
      const outOfStock = btn.disabled || btn.classList.contains("btn-out-of-stock");
      const url = viewUrl || btn.getAttribute("data-url") || "";

      variants.push({
        id,
        name,
        price,
        originalPrice,
        image,
        category,
        url,
        outOfStock,
        size: extractSize(name),
      });
    }

    /* Flex rows: View Details + wishlist + cart */
    container.querySelectorAll('div[style*="display: flex"]').forEach((row) => {
      const cartBtn = row.querySelector(".btn-add-cart");
      const viewLink = row.querySelector("a.btn-view");
      addFromButton(cartBtn, viewLink ? viewLink.getAttribute("href") : "");
    });

    /* Standalone cart / tv-model buttons */
    container.querySelectorAll(".btn-add-cart, .tv-model-btn.btn-add-cart").forEach((btn) => {
      if (btn.closest('div[style*="display: flex"]')) return;
      addFromButton(btn, "");
    });

    return variants;
  }

  function buildPicker(container, section, variants) {
    const allSizes = variants.map((v) => v.size);
    const prices = variants.map((v) => v.price).filter((p) => p > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;

    section.setAttribute("data-variant-min-price", String(minPrice));
    section.setAttribute("data-variant-max-price", String(maxPrice));

    const picker = document.createElement("div");
    picker.className = "variant-picker";

    const label = document.createElement("p");
    label.className = "variant-picker-title";
    label.textContent =
      new Set(allSizes.filter(Boolean)).size > 1
        ? "Select Size / Model"
        : variants.length > 1
        ? "Select Model"
        : "Options";

    const chips = document.createElement("div");
    chips.className = "variant-chips";
    chips.setAttribute("role", "listbox");
    chips.setAttribute("aria-label", "Product variants");

    variants.forEach((v, i) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "variant-chip" + (v.outOfStock ? " variant-chip--oos" : "") + (i === 0 ? " is-selected" : "");
      chip.setAttribute("role", "option");
      chip.setAttribute("aria-selected", i === 0 ? "true" : "false");
      chip.dataset.index = String(i);
      chip.innerHTML =
        '<span class="variant-chip-label">' +
        shortLabel(v.name, v.size, allSizes) +
        "</span>" +
        '<span class="variant-chip-price">' +
        formatKsh(v.price) +
        (v.outOfStock ? ' <em>OOS</em>' : "") +
        "</span>";
      if (v.outOfStock) chip.disabled = true;
      chips.appendChild(chip);
    });

    const priceBlock = document.createElement("div");
    priceBlock.className = "variant-price-block";
    priceBlock.innerHTML =
      '<span class="variant-price" id="vp-price"></span>' +
      '<span class="variant-compare" id="vp-compare"></span>';

    const actions = document.createElement("div");
    actions.className = "variant-picker-actions";

    const viewLink = document.createElement("a");
    viewLink.className = "btn-view variant-view-link";
    viewLink.textContent = "View Details";
    viewLink.style.display = "none";

    const wishBtn = document.createElement("button");
    wishBtn.type = "button";
    wishBtn.className = "btn-wishlist card-wishlist-btn";
    wishBtn.title = "Add to Wishlist";
    wishBtn.setAttribute("aria-label", "Add to Wishlist");
    wishBtn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

    const cartBtn = document.createElement("button");
    cartBtn.type = "button";
    cartBtn.className = "btn-add-cart variant-add-btn";

    actions.appendChild(viewLink);
    actions.appendChild(wishBtn);
    actions.appendChild(cartBtn);

    picker.appendChild(label);
    picker.appendChild(chips);
    picker.appendChild(priceBlock);
    picker.appendChild(actions);

    /* Hidden sort meta for filters/sort scripts */
    const sortMeta = document.createElement("span");
    sortMeta.className = "variant-sort-meta visually-hidden";
    sortMeta.setAttribute("data-price", String(minPrice));
    sortMeta.setAttribute("data-name", variants[0].name);
    picker.appendChild(sortMeta);

    container.innerHTML = "";
    container.appendChild(picker);

    let selectedIdx = variants.findIndex((v) => !v.outOfStock);
    if (selectedIdx < 0) selectedIdx = 0;

    function selectVariant(index) {
      const v = variants[index];
      if (!v) return;
      selectedIdx = index;

      chips.querySelectorAll(".variant-chip").forEach((c, i) => {
        c.classList.toggle("is-selected", i === index);
        c.setAttribute("aria-selected", i === index ? "true" : "false");
      });

      document.getElementById("vp-price").textContent = formatKsh(v.price);
      const compareEl = document.getElementById("vp-compare");
      if (v.originalPrice > v.price) {
        compareEl.textContent = formatKsh(v.originalPrice);
        compareEl.style.display = "inline";
      } else {
        compareEl.textContent = "";
        compareEl.style.display = "none";
      }

      sortMeta.setAttribute("data-price", String(v.price));
      sortMeta.setAttribute("data-name", v.name);

      cartBtn.setAttribute("data-id", v.id);
      cartBtn.setAttribute("data-name", v.name);
      cartBtn.setAttribute("data-price", String(v.price));
      cartBtn.setAttribute("data-image", v.image);
      cartBtn.setAttribute("data-category", v.category);
      cartBtn.disabled = v.outOfStock;
      cartBtn.textContent = v.outOfStock
        ? "Out of Stock"
        : "Add to Cart — " + formatKsh(v.price);

      wishBtn.setAttribute("data-name", v.name);
      wishBtn.setAttribute("data-price", String(v.price));
      wishBtn.setAttribute("data-image", v.image);
      wishBtn.setAttribute("data-category", v.category);
      wishBtn.setAttribute("data-url", v.url);

      if (v.url) {
        viewLink.href = v.url;
        viewLink.style.display = "inline-flex";
      } else {
        viewLink.style.display = "none";
      }

      if (window.GrandGestureWishlist) {
        window.GrandGestureWishlist.syncButtons();
      }
    }

    chips.addEventListener("click", (e) => {
      const chip = e.target.closest(".variant-chip");
      if (!chip || chip.disabled) return;
      selectVariant(Number(chip.dataset.index));
    });

    selectVariant(selectedIdx);

    if (window.GrandGestureCart) {
      window.GrandGestureCart.bindButtons(picker);
    }
  }

  function transformContainer(container, section) {
    if (container.classList.contains("variant-transformed")) return;
    const variants = collectVariantsFromContainer(container, section);
    if (variants.length < 2) return;
    buildPicker(container, section, variants);
    container.classList.add("variant-transformed");
  }

  function cleanupBrokenNodes() {
    /* Remove duplicate orphan aside inside .tv-product */
    document.querySelectorAll(".tv-product > aside.tv-featured-models").forEach((el) => el.remove());
  }

  function init() {
    cleanupBrokenNodes();

    document.querySelectorAll(".tv-product, .tv-featured-block").forEach((section) => {
      section.querySelectorAll(".tv-models, .tv-featured-models, .tv-model-list").forEach((container) => {
        transformContainer(container, section);
      });
    });

    /* Re-bind wishlist after DOM rewrite */
    if (window.GrandGestureWishlist) {
      window.GrandGestureWishlist.syncButtons();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.GrandGestureVariants = { init, formatKsh };
})();
