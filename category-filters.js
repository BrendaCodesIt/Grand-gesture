/* ═══════════════════════════════════════════════════════════
   Grand Gesture — Category Page Filters
   Brand checkboxes + Price range slider
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const KNOWN_BRANDS = ["Hisense", "LG", "Sony", "Skyworth"];

  function extractBrand(name) {
    if (!name) return "Other";
    const lower = name.toLowerCase();
    for (const brand of KNOWN_BRANDS) {
      if (lower.startsWith(brand.toLowerCase())) return brand;
    }
    return "Other";
  }

  function init() {
    const sortToolbar = document.querySelector(".sort-toolbar");
    if (!sortToolbar) return;

    // Gather all product sections
    const sections = Array.from(
      document.querySelectorAll(".tv-featured-block, .tv-product")
    );
    if (sections.length === 0) return;

    // Extract data from each section
    const sectionData = sections.map((section) => {
      const btn =
        section.querySelector(".btn-add-cart") ||
        section.querySelector(".tv-model-btn");
      const name = btn ? btn.getAttribute("data-name") || "" : "";
      const price = btn ? Number(btn.getAttribute("data-price")) || 0 : 0;
      const brand = extractBrand(name);
      return { section, name, price, brand };
    });

    // Find unique brands present on this page
    const brandsOnPage = [
      ...new Set(sectionData.map((d) => d.brand)),
    ].sort();

    // Find price range
    const prices = sectionData.map((d) => d.price).filter((p) => p > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 500000;

    // Round for nice slider steps
    const sliderMin = Math.floor(minPrice / 1000) * 1000;
    const sliderMax = Math.ceil(maxPrice / 1000) * 1000;

    // Build filter bar HTML
    const filterBar = document.createElement("div");
    filterBar.className = "filter-bar";
    filterBar.innerHTML = `
      <button class="filter-toggle" id="filter-toggle" aria-expanded="false">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="9" y2="18"/>
          <circle cx="8" cy="6" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="13" cy="18" r="2"/>
        </svg>
        Filters
        <span class="filter-count" id="filter-count" hidden>0</span>
      </button>
      <div class="filter-panel" id="filter-panel" hidden>
        <div class="filter-section">
          <h4 class="filter-heading">Brand</h4>
          <div class="filter-brand-list" id="filter-brands">
            ${brandsOnPage
              .map(
                (b) => `
              <label class="filter-checkbox">
                <input type="checkbox" value="${b}" checked>
                <span class="filter-checkmark"></span>
                ${b}
              </label>
            `
              )
              .join("")}
          </div>
        </div>
        <div class="filter-section">
          <h4 class="filter-heading">Price Range</h4>
          <div class="filter-price-display">
            <span id="price-min-label">KSh ${sliderMin.toLocaleString()}</span>
            <span>—</span>
            <span id="price-max-label">KSh ${sliderMax.toLocaleString()}</span>
          </div>
          <div class="filter-range-wrapper">
            <input type="range" id="price-min" min="${sliderMin}" max="${sliderMax}" value="${sliderMin}" step="1000" class="filter-range">
            <input type="range" id="price-max" min="${sliderMin}" max="${sliderMax}" value="${sliderMax}" step="1000" class="filter-range">
          </div>
        </div>
        <div class="filter-actions">
          <button class="filter-reset" id="filter-reset">Reset Filters</button>
          <span class="filter-results" id="filter-results">${sections.length} products</span>
        </div>
      </div>
    `;

    sortToolbar.after(filterBar);

    // References
    const toggleBtn = document.getElementById("filter-toggle");
    const panel = document.getElementById("filter-panel");
    const brandCheckboxes = document.querySelectorAll(
      "#filter-brands input[type=checkbox]"
    );
    const priceMinSlider = document.getElementById("price-min");
    const priceMaxSlider = document.getElementById("price-max");
    const priceMinLabel = document.getElementById("price-min-label");
    const priceMaxLabel = document.getElementById("price-max-label");
    const filterResults = document.getElementById("filter-results");
    const filterCount = document.getElementById("filter-count");
    const resetBtn = document.getElementById("filter-reset");

    // Toggle panel
    toggleBtn.addEventListener("click", () => {
      const isOpen = panel.hidden;
      panel.hidden = !isOpen;
      toggleBtn.setAttribute("aria-expanded", isOpen);
      toggleBtn.classList.toggle("active", isOpen);
    });

    // Apply filters
    function applyFilters() {
      const selectedBrands = Array.from(brandCheckboxes)
        .filter((cb) => cb.checked)
        .map((cb) => cb.value);

      const pMin = Math.min(
        Number(priceMinSlider.value),
        Number(priceMaxSlider.value)
      );
      const pMax = Math.max(
        Number(priceMinSlider.value),
        Number(priceMaxSlider.value)
      );

      priceMinLabel.textContent = "KSh " + pMin.toLocaleString();
      priceMaxLabel.textContent = "KSh " + pMax.toLocaleString();

      let visible = 0;
      sectionData.forEach(({ section, brand, price }) => {
        const brandMatch = selectedBrands.includes(brand);
        const priceMatch = price >= pMin && price <= pMax;

        if (brandMatch && priceMatch) {
          section.style.display = "";
          visible++;
        } else {
          section.style.display = "none";
        }
      });

      filterResults.textContent = visible + " product" + (visible !== 1 ? "s" : "");

      // Show/hide no-results message
      let emptyMsg = document.getElementById("filter-empty-msg");
      if (visible === 0) {
        if (!emptyMsg) {
          emptyMsg = document.createElement("div");
          emptyMsg.id = "filter-empty-msg";
          emptyMsg.style.cssText = "text-align:center;padding:40px 20px;color:#888;font-family:'Montserrat',sans-serif;font-size:1rem;grid-column:1/-1;";
          emptyMsg.innerHTML = '<p style="font-size:1.5rem;margin-bottom:10px;">🔍</p><p>No products match your filters.</p><p style="font-size:0.85rem;margin-top:8px;">Try adjusting the brand or price range.</p>';
          const parent = sections[0] && sections[0].parentElement;
          if (parent) parent.appendChild(emptyMsg);
        }
        emptyMsg.style.display = "block";
      } else if (emptyMsg) {
        emptyMsg.style.display = "none";
      }

      // Update active filter count
      const totalBrands = brandCheckboxes.length;
      const checkedBrands = selectedBrands.length;
      const priceChanged =
        Number(priceMinSlider.value) !== sliderMin ||
        Number(priceMaxSlider.value) !== sliderMax;
      const activeCount =
        (totalBrands - checkedBrands) + (priceChanged ? 1 : 0);

      if (activeCount > 0) {
        filterCount.textContent = activeCount;
        filterCount.hidden = false;
      } else {
        filterCount.hidden = true;
      }
    }

    brandCheckboxes.forEach((cb) =>
      cb.addEventListener("change", applyFilters)
    );
    priceMinSlider.addEventListener("input", applyFilters);
    priceMaxSlider.addEventListener("input", applyFilters);

    // Reset
    resetBtn.addEventListener("click", () => {
      brandCheckboxes.forEach((cb) => (cb.checked = true));
      priceMinSlider.value = sliderMin;
      priceMaxSlider.value = sliderMax;
      applyFilters();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
