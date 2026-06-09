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

    searchBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        searchOverlay.classList.add("active");
        searchInput.value = "";
        searchResults.innerHTML = "";
        setTimeout(() => searchInput.focus(), 100);
      });
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
    });

    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      searchResults.innerHTML = "";
      if (!query || !window.PRODUCTS_DATA) return;

      const matches = window.PRODUCTS_DATA.filter((p) =>
        p.name.toLowerCase().includes(query)
      );

      if (matches.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results">No products found</div>';
        return;
      }

      matches.slice(0, 10).forEach((product) => {
        const item = document.createElement("a");
        item.href = pathPrefix + product.url;
        item.className = "search-result-item";
        const priceText = product.price > 0
          ? `KSh ${product.price.toLocaleString("en-US")}`
          : "Contact for price";

        item.innerHTML = `
          <img src="${pathPrefix + product.image}" class="search-result-img" alt="${product.name}" onerror="this.style.display='none'">
          <div class="search-result-info">
            <p class="search-result-name">${product.name}</p>
            <p class="search-result-price">${priceText}</p>
          </div>
        `;
        searchResults.appendChild(item);
      });
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

  /* ── Init ── */
  function init() {
    initSearch();
    initSidebar();
    initScrollToTop();
    initWishlist();
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
