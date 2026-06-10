/* ═══════════════════════════════════════════════════════════
   Grand Gesture — Category Variant Picker
   Multi-size / multi-model products: select variant, then cart
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
    const series = name.match(/\b(A[467]|Q[67]|U6 PRO|U7 PRO|U7Q|Mini-LED|Mini Led|NanoCell|BRAVIA|OLED)\b/i);
    if (series) return series[1];
    return null;
  }

  function variantLabel(name, allSizes) {
    const size = extractSize(name);
    const series = extractSeries(name);
    const uniqueSizes = new Set(allSizes.filter(Boolean));

    if (uniqueSizes.size > 1 && size) {
      return series ? size + " · " + series : size;
    }
    if (size && series) return size + " · " + series;
    if (size) return size + " TV";
    if (series) return series;
    return name.length > 48 ? name.slice(0, 46) + "…" : name;
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
      const name = decodeHtml(btn.getAttribute("data-name") || "").trim();
      if (!name || name === "Product") return;
      const id = btn.getAttribute("data-id") || name;
      if (seen.has(id)) return;
      seen.add(id);

      variants.push({
        id,
        name,
        price: Number(btn.getAttribute("data-price") || 0),
        originalPrice: Number(btn.getAttribute("data-original-price") || 0),
        image: btn.getAttribute("data-image") || defaultImage,
        category: btn.getAttribute("data-category") || category,
        url: viewUrl || btn.getAttribute("data-url") || "",
        outOfStock: btn.disabled || btn.classList.contains("btn-out-of-stock"),
        size: extractSize(name),
      });
    }

    container.querySelectorAll('div[style*="display: flex"]').forEach((row) => {
      const cartBtn = row.querySelector(".btn-add-cart");
      const viewLink = row.querySelector("a.btn-view");
      addFromButton(cartBtn, viewLink ? viewLink.getAttribute("href") : "");
    });

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
        ? "Select Size & Model"
        : "Select Model";

    const chips = document.createElement("div");
    chips.className = "variant-chips";
    chips.setAttribute("role", "listbox");
    chips.setAttribute("aria-label", "Product variants");

    variants.forEach((v, i) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className =
        "variant-chip" +
        (v.outOfStock ? " variant-chip--oos" : "") +
        (i === 0 && !v.outOfStock ? " is-selected" : "");
      chip.setAttribute("role", "option");
      chip.setAttribute("aria-selected", i === 0 && !v.outOfStock ? "true" : "false");
      chip.dataset.index = String(i);
      chip.innerHTML =
        '<span class="variant-chip-label">' +
        variantLabel(v.name, allSizes) +
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
    const priceEl = document.createElement("span");
    priceEl.className = "variant-price";
    const compareEl = document.createElement("span");
    compareEl.className = "variant-compare";
    priceBlock.appendChild(priceEl);
    priceBlock.appendChild(compareEl);

    const selectedName = document.createElement("p");
    selectedName.className = "variant-selected-name";

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

    const sortMeta = document.createElement("span");
    sortMeta.className = "variant-sort-meta visually-hidden";

    picker.appendChild(label);
    picker.appendChild(chips);
    picker.appendChild(selectedName);
    picker.appendChild(priceBlock);
    picker.appendChild(actions);
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

      priceEl.textContent = formatKsh(v.price);
      selectedName.textContent = v.name;

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
        : "Add to Cart — " + variantLabel(v.name, allSizes) + " — " + formatKsh(v.price);

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

      if (window.GrandGestureWishlist) window.GrandGestureWishlist.syncButtons();
    }

    chips.addEventListener("click", (e) => {
      const chip = e.target.closest(".variant-chip");
      if (!chip || chip.disabled) return;
      selectVariant(Number(chip.dataset.index));
    });

    selectVariant(selectedIdx);

    if (window.GrandGestureCart) window.GrandGestureCart.bindButtons(picker);
  }

  /** Label standalone cart buttons with size + price (single-variant blocks) */
  function labelStandaloneButton(btn) {
    const name = decodeHtml(btn.getAttribute("data-name") || "");
    const price = Number(btn.getAttribute("data-price") || 0);
    if (!name || !price) return;

    const size = extractSize(name);
    const series = extractSeries(name);
    let short = variantLabel(name, size ? [size] : []);
    const outOfStock = btn.disabled || btn.classList.contains("btn-out-of-stock");

    btn.removeAttribute("style");
    btn.classList.add("tv-model-btn--labeled");

    if (outOfStock) {
      btn.innerHTML =
        '<span class="tv-btn-label">' + short + '</span>' +
        '<span class="tv-btn-price">' + formatKsh(price) + ' <em>OOS</em></span>';
      return;
    }

    btn.innerHTML =
      '<span class="tv-btn-label">' + short + '</span>' +
      '<span class="tv-btn-price">' + formatKsh(price) + '</span>';
  }

  function transformContainer(container, section) {
    if (container.classList.contains("variant-transformed")) return;

    const variants = collectVariantsFromContainer(container, section);
    if (variants.length >= 2) {
      buildPicker(container, section, variants);
      container.classList.add("variant-transformed");
      return;
    }

    if (variants.length === 1) {
      container.querySelectorAll(".btn-add-cart").forEach(labelStandaloneButton);
      container.classList.add("variant-transformed");
    }
  }

  function init() {
    document.querySelectorAll(".tv-product > aside.tv-featured-models").forEach((el) => el.remove());

    document.querySelectorAll(".tv-product, .tv-featured-block").forEach((section) => {
      section.querySelectorAll(".tv-model-list, .tv-featured-models").forEach((container) => {
        transformContainer(container, section);
      });
    });

    if (window.GrandGestureWishlist) window.GrandGestureWishlist.syncButtons();
    if (window.GrandGestureCart) window.GrandGestureCart.bindButtons(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.GrandGestureVariants = { init, formatKsh };
})();
