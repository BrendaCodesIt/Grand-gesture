/* ═══════════════════════════════════════════════════════════
   Grand Gesture — Shared Site Interactions
   Search overlay, sidebar menu, scroll-to-top
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  function getBasePath() {
    const path = window.location.pathname;
    if (path.includes("/categories/") || path.includes("/brands/") || path.includes("/products/")) {
      return "../";
    }
    return "";
  }

  /* ── Search Overlay ── */
  function initSearch() {
    const searchBtns = document.querySelectorAll('button[aria-label="Search"]');
    const searchOverlay = document.getElementById("search-overlay");
    const searchClose = document.getElementById("search-overlay-close");
    const searchInput = document.getElementById("search-input");
    const searchResults = document.getElementById("search-results");

    if (!searchOverlay || !searchInput) return;

    const pathPrefix = getBasePath();

    /* ── Fuzzy matching helpers ── */
    function levenshtein(a, b) {
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;
      const matrix = [];
      for (let i = 0; i <= b.length; i++) matrix[i] = [i];
      for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          const cost = b[i - 1] === a[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
        }
      }
      return matrix[b.length][a.length];
    }

    function fuzzyMatch(productName, query) {
      const nameLower = productName.toLowerCase();
      const queryLower = query.toLowerCase().trim();

      // Exact substring match — highest score
      if (nameLower.includes(queryLower)) return { score: 100, type: "exact" };

      // Token-based matching
      const queryTokens = queryLower.split(/\s+/).filter(t => t.length > 0);
      const nameTokens = nameLower.split(/[\s\-\/,]+/).filter(t => t.length > 0);

      let matchedTokens = 0;
      let totalScore = 0;

      for (const qt of queryTokens) {
        let bestTokenScore = 0;

        for (const nt of nameTokens) {
          // Direct substring in token
          if (nt.includes(qt) || qt.includes(nt)) {
            bestTokenScore = Math.max(bestTokenScore, 80);
            continue;
          }
          // Levenshtein distance (only for tokens of similar length)
          if (Math.abs(nt.length - qt.length) <= 2 && qt.length >= 3) {
            const dist = levenshtein(qt, nt);
            const maxLen = Math.max(qt.length, nt.length);
            if (dist <= Math.ceil(maxLen * 0.35)) {
              bestTokenScore = Math.max(bestTokenScore, 60 - dist * 10);
            }
          }
        }

        if (bestTokenScore > 0) {
          matchedTokens++;
          totalScore += bestTokenScore;
        }
      }

      if (matchedTokens === 0) return { score: 0, type: "none" };
      const ratio = matchedTokens / queryTokens.length;
      return { score: totalScore * ratio, type: ratio >= 1 ? "full" : "partial" };
    }

    function highlightMatch(text, query) {
      if (!query) return text;
      const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
      let result = text;
      for (const token of tokens) {
        const regex = new RegExp("(" + token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
        result = result.replace(regex, '<mark>$1</mark>');
      }
      return result;
    }

    /* ── Open/close search ── */
    function openSearch() {
      searchOverlay.classList.add("active");
      searchInput.value = "";
      searchResults.innerHTML = "";
      setTimeout(() => searchInput.focus(), 100);
    }

    // Add keyboard shortcut hint to search placeholder on desktop
    if (window.innerWidth > 768) {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      searchInput.placeholder = "Search for products... (" + (isMac ? "⌘" : "Ctrl+") + "K)";
    }

    searchBtns.forEach((btn) => {
      btn.addEventListener("click", openSearch);
    });

    if (searchClose) {
      searchClose.addEventListener("click", () => {
        searchOverlay.classList.remove("active");
      });
    }

    searchOverlay.addEventListener("click", (e) => {
      if (e.target === searchOverlay) searchOverlay.classList.remove("active");
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && searchOverlay.classList.contains("active")) {
        searchOverlay.classList.remove("active");
      }
      // Ctrl+K / Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
      }
    });

    /* ── Search input handler ── */
    let debounceTimer;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = e.target.value.trim();
        searchResults.innerHTML = "";
        if (!query || query.length < 2 || !window.PRODUCTS_DATA) return;

        const scored = window.PRODUCTS_DATA
          .map((p) => ({ product: p, ...fuzzyMatch(p.name, query) }))
          .filter((m) => m.score > 0)
          .sort((a, b) => b.score - a.score);

        if (scored.length === 0) {
          searchResults.innerHTML = `
            <div class="search-no-results">
              <p>No products found for "<strong>${query}</strong>"</p>
              <p style="font-size:0.82rem;color:#888;margin-top:6px;">Try: "hisense tv", "washing machine", "air fryer"</p>
            </div>`;
          return;
        }

        scored.slice(0, 10).forEach(({ product }) => {
          const item = document.createElement("a");
          item.href = pathPrefix + product.url;
          item.className = "search-result-item";
          const priceText = product.price > 0
            ? `KSh ${product.price.toLocaleString("en-US")}`
            : "Contact for price";

          const highlightedName = highlightMatch(product.name, query);

          item.innerHTML = `
            <img src="${pathPrefix + product.image}" class="search-result-img" alt="${product.name}" onerror="this.style.display='none'">
            <div class="search-result-info">
              <p class="search-result-name">${highlightedName}</p>
              <p class="search-result-price">${priceText}</p>
            </div>
          `;
          searchResults.appendChild(item);
        });
      }, 150);
    });
  }

  /* ── Sidebar Menu ── */
  function initSidebar() {
    const menuToggleBtn = document.getElementById("menu-toggle");
    const sideMenu = document.getElementById("side-menu");
    const sidebarOverlay = document.getElementById("sidebar-overlay");
    const sideMenuClose = document.getElementById("side-menu-close");

    if (!menuToggleBtn || !sideMenu) return;

    function openMenu() {
      sideMenu.classList.add("active");
      if (sidebarOverlay) sidebarOverlay.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    function closeMenu() {
      sideMenu.classList.remove("active");
      if (sidebarOverlay) sidebarOverlay.classList.remove("active");
      document.body.style.overflow = "";
    }

    menuToggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openMenu();
    });

    if (sideMenuClose) {
      sideMenuClose.addEventListener("click", closeMenu);
    }

    if (sidebarOverlay) {
      sidebarOverlay.addEventListener("click", closeMenu);
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ── Scroll to Top ── */
  function initScrollToTop() {
    const btn = document.getElementById("scroll-to-top");
    if (!btn) return;

    window.addEventListener("scroll", () => {
      if (window.scrollY > 400) {
        btn.classList.add("visible");
      } else {
        btn.classList.remove("visible");
      }
    });

    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ── Wishlist Logic ── */
  window.GrandGestureWishlist = {
    getItems: function() {
      return JSON.parse(localStorage.getItem("wishlistItems") || "[]");
    },
    toggleItem: function(item) {
      let items = this.getItems();
      const index = items.findIndex(i => i.name === item.name);
      let added = false;
      if (index > -1) {
        items.splice(index, 1);
      } else {
        items.push(item);
        added = true;
      }
      localStorage.setItem("wishlistItems", JSON.stringify(items));
      this.updateBadge();
      this.syncButtons();
      return added;
    },
    updateBadge: function() {
      const items = this.getItems();
      const badge = document.getElementById("wishlist-badge");
      if (badge) {
        badge.textContent = items.length;
        badge.style.display = items.length > 0 ? "flex" : "none";
      }
    },
    syncButtons: function() {
      const items = this.getItems();
      document.querySelectorAll(".btn-wishlist").forEach(btn => {
        const name = btn.getAttribute("data-name");
        const isSaved = items.some(i => i.name === name);
        if (isSaved) {
          btn.classList.add("saved");
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
        } else {
          btn.classList.remove("saved");
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
        }
      });
    },
    bindButtons: function() {
      document.body.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-wishlist");
        if (btn) {
          e.preventDefault();
          const item = {
            name: btn.getAttribute("data-name"),
            price: btn.getAttribute("data-price"),
            image: btn.getAttribute("data-image"),
            url: btn.getAttribute("data-url") || ""
          };
          const added = this.toggleItem(item);
          
          // Optional: Add a little pop animation class
          btn.classList.add("pop");
          setTimeout(() => btn.classList.remove("pop"), 300);
        }
      });
    }
  };

  function initWishlist() {
    window.GrandGestureWishlist.updateBadge();
    window.GrandGestureWishlist.syncButtons();
    window.GrandGestureWishlist.bindButtons();
  }

  /* ── Recently Viewed Products ── */
  function initRecentlyViewed() {
    var STORAGE_KEY = "recentlyViewed";
    var MAX_ITEMS = 10;
    var DISPLAY_ITEMS = 6;

    // Helper: get stored items
    function getItems() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      } catch (e) {
        return [];
      }
    }

    // Track product view if on a product page
    var path = window.location.pathname;
    if (path.includes("/products/")) {
      var titleEl = document.querySelector(".pdp-title");
      var priceEl = document.querySelector(".pdp-price");
      var imageEl = document.querySelector(".pdp-main-image img");

      if (titleEl && priceEl && imageEl) {
        var product = {
          name: titleEl.textContent.trim(),
          price: priceEl.textContent.trim(),
          image: imageEl.getAttribute("src") || "",
          url: window.location.pathname
        };

        var items = getItems();
        // Remove duplicate by name
        items = items.filter(function (item) {
          return item.name !== product.name;
        });
        // Add newest first
        items.unshift(product);
        // Limit to max
        if (items.length > MAX_ITEMS) {
          items = items.slice(0, MAX_ITEMS);
        }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
          // Storage full or unavailable
        }
      }
    }

    // Render recently viewed section on homepage
    var isHomepage = path === "/" || path.endsWith("/index.html") || path.endsWith("/GrandGesture/");
    var container = document.getElementById("recently-viewed-section");
    if (isHomepage && container) {
      var items = getItems();
      if (items.length === 0) {
        container.style.display = "none";
        return;
      }

      var basePath = getBasePath();
      var displayItems = items.slice(0, DISPLAY_ITEMS);

      var cardsHtml = displayItems.map(function (item) {
        // Fix image path: if it starts with ../ (from product page), strip it for homepage
        var imgSrc = item.image;
        if (imgSrc.startsWith("../")) {
          imgSrc = imgSrc.substring(3);
        }
        // Fix URL path similarly
        var itemUrl = item.url;
        if (itemUrl.startsWith("/")) {
          // Absolute path – make relative
          var parts = itemUrl.split("/");
          // Keep from products/ onward
          var prodIdx = parts.indexOf("products");
          if (prodIdx > -1) {
            itemUrl = parts.slice(prodIdx).join("/");
          }
        }
        // If URL doesn't start with products/, add it
        if (!itemUrl.startsWith("products/") && !itemUrl.startsWith("./products/")) {
          // Try to extract just the filename portion after /products/
          var match = itemUrl.match(/products\/(.+)$/);
          if (match) {
            itemUrl = "products/" + match[1];
          }
        }

        return '<a href="' + basePath + itemUrl + '" class="rv-card">' +
          '<div class="rv-card-img-wrap">' +
            '<img src="' + basePath + imgSrc + '" alt="' + item.name.replace(/"/g, '&quot;') + '" loading="lazy" onerror="this.style.display=\'none\'">' +
          '</div>' +
          '<div class="rv-card-info">' +
            '<p class="rv-card-name">' + item.name + '</p>' +
            '<p class="rv-card-price">' + item.price + '</p>' +
          '</div>' +
        '</a>';
      }).join("");

      container.innerHTML =
        '<div class="rv-inner">' +
          '<h2 class="section-heading rv-heading">Recently Viewed</h2>' +
          '<div class="rv-grid">' + cardsHtml + '</div>' +
        '</div>';
      container.style.display = "block";
    }
  }

  /* ── Init ── */
  function init() {
    initSearch();
    initSidebar();
    initScrollToTop();
    initWishlist();
    initRecentlyViewed();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.GrandGestureSite = {
    getBasePath: getBasePath,
  };
})();
