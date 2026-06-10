/* ═══════════════════════════════════════════════════════════
   Grand Gesture — Product Reviews & Ratings
   Star rating system with localStorage persistence
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const STORAGE_KEY = "grandGestureReviews";

  function getAllReviews() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  }

  function getProductReviews(productName) {
    const all = getAllReviews();
    return all[productName] || [];
  }

  function saveReview(productName, review) {
    const all = getAllReviews();
    if (!all[productName]) all[productName] = [];
    all[productName].unshift(review);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  function renderStars(rating, size) {
    const sz = size || 18;
    let html = "";
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        html += `<svg class="star filled" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="#f5a623" stroke="#f5a623"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
      } else {
        html += `<svg class="star empty" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
      }
    }
    return html;
  }

  function renderInteractiveStars() {
    let html = '<div class="review-star-input" id="review-star-input">';
    for (let i = 1; i <= 5; i++) {
      html += `<button type="button" class="star-btn" data-rating="${i}" aria-label="${i} star${i > 1 ? 's' : ''}">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      </button>`;
    }
    html += '</div>';
    return html;
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + "m ago";
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    const days = Math.floor(hrs / 24);
    if (days < 30) return days + "d ago";
    return new Date(dateStr).toLocaleDateString();
  }

  function init() {
    // Only run on product detail pages
    const tabsNav = document.querySelector(".pdp-tabs-nav");
    const tabsContent = document.querySelector(".pdp-tabs-content");
    if (!tabsNav || !tabsContent) return;

    // Get product name from the add-to-cart button
    const addBtn = document.querySelector(".pdp-add-btn");
    if (!addBtn) return;
    const productName = addBtn.getAttribute("data-name") || "Unknown Product";

    // Add Reviews tab button
    const reviewTabBtn = document.createElement("button");
    reviewTabBtn.className = "pdp-tab-btn";
    reviewTabBtn.setAttribute("data-tab", "reviews");
    reviewTabBtn.textContent = "Reviews";
    tabsNav.appendChild(reviewTabBtn);

    // Add Reviews tab panel
    const reviewPanel = document.createElement("div");
    reviewPanel.className = "pdp-tab-panel";
    reviewPanel.id = "tab-reviews";
    tabsContent.appendChild(reviewPanel);

    function renderReviewPanel() {
      const reviews = getProductReviews(productName);
      const avgRating =
        reviews.length > 0
          ? (
              reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
            ).toFixed(1)
          : 0;

      // Star breakdown
      const breakdown = [5, 4, 3, 2, 1].map((star) => {
        const count = reviews.filter((r) => r.rating === star).length;
        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
        return { star, count, pct };
      });

      reviewPanel.innerHTML = `
        <div class="reviews-container">
          <div class="reviews-summary">
            <div class="reviews-avg">
              <span class="reviews-avg-number">${avgRating}</span>
              <div class="reviews-avg-stars">${renderStars(Math.round(avgRating), 22)}</div>
              <span class="reviews-avg-count">${reviews.length} review${reviews.length !== 1 ? "s" : ""}</span>
            </div>
            <div class="reviews-breakdown">
              ${breakdown
                .map(
                  (b) => `
                <div class="reviews-bar-row">
                  <span class="reviews-bar-label">${b.star}★</span>
                  <div class="reviews-bar-track">
                    <div class="reviews-bar-fill" style="width:${b.pct}%"></div>
                  </div>
                  <span class="reviews-bar-count">${b.count}</span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>

          <div class="review-form-section">
            <h3 class="review-form-title">Write a Review</h3>
            <form class="review-form" id="review-form">
              <div class="review-form-group">
                <label for="review-name">Your Name</label>
                <input type="text" id="review-name" class="review-input" placeholder="John D." required>
              </div>
              <div class="review-form-group">
                <label>Your Rating</label>
                ${renderInteractiveStars()}
                <input type="hidden" id="review-rating" value="0">
              </div>
              <div class="review-form-group">
                <label for="review-comment">Your Review</label>
                <textarea id="review-comment" class="review-input review-textarea" placeholder="Share your experience with this product..." required></textarea>
              </div>
              <button type="submit" class="review-submit-btn">Submit Review</button>
            </form>
          </div>

          <div class="reviews-list" id="reviews-list">
            ${
              reviews.length === 0
                ? '<p class="reviews-empty">No reviews yet. Be the first to review this product!</p>'
                : reviews
                    .map(
                      (r) => `
                  <div class="review-card">
                    <div class="review-card-header">
                      <div class="review-avatar">${r.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <strong class="review-author">${r.name}</strong>
                        <span class="review-date">${timeAgo(r.date)}</span>
                      </div>
                      <div class="review-card-stars">${renderStars(r.rating, 14)}</div>
                    </div>
                    <p class="review-text">${r.comment}</p>
                  </div>
                `
                    )
                    .join("")
            }
          </div>
        </div>
      `;

      // Bind interactive stars
      let selectedRating = 0;
      const starBtns = reviewPanel.querySelectorAll(".star-btn");
      const ratingInput = reviewPanel.querySelector("#review-rating");

      starBtns.forEach((btn) => {
        btn.addEventListener("mouseenter", () => {
          const r = Number(btn.dataset.rating);
          starBtns.forEach((b, i) => {
            const svg = b.querySelector("svg");
            if (i < r) {
              svg.setAttribute("fill", "#f5a623");
              svg.setAttribute("stroke", "#f5a623");
            } else {
              svg.setAttribute("fill", "none");
              svg.setAttribute("stroke", "#ccc");
            }
          });
        });

        btn.addEventListener("click", () => {
          selectedRating = Number(btn.dataset.rating);
          ratingInput.value = selectedRating;
          starBtns.forEach((b, i) => {
            const svg = b.querySelector("svg");
            if (i < selectedRating) {
              svg.setAttribute("fill", "#f5a623");
              svg.setAttribute("stroke", "#f5a623");
            } else {
              svg.setAttribute("fill", "none");
              svg.setAttribute("stroke", "#ccc");
            }
          });
        });
      });

      const starInput = reviewPanel.querySelector(".review-star-input");
      if (starInput) {
        starInput.addEventListener("mouseleave", () => {
          starBtns.forEach((b, i) => {
            const svg = b.querySelector("svg");
            if (i < selectedRating) {
              svg.setAttribute("fill", "#f5a623");
              svg.setAttribute("stroke", "#f5a623");
            } else {
              svg.setAttribute("fill", "none");
              svg.setAttribute("stroke", "#ccc");
            }
          });
        });
      }

      // Bind form
      const form = reviewPanel.querySelector("#review-form");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = reviewPanel.querySelector("#review-name").value.trim();
        const comment = reviewPanel.querySelector("#review-comment").value.trim();
        const rating = Number(ratingInput.value);

        if (!name || !comment) return;
        if (rating === 0) {
          alert("Please select a star rating!");
          return;
        }

        saveReview(productName, {
          name,
          rating,
          comment,
          date: new Date().toISOString(),
        });

        renderReviewPanel();
      });
    }

    // Tab switching — hook into existing tab system
    reviewTabBtn.addEventListener("click", () => {
      tabsNav.querySelectorAll(".pdp-tab-btn").forEach((b) => b.classList.remove("active"));
      tabsContent.querySelectorAll(".pdp-tab-panel").forEach((p) => (p.style.display = "none"));
      reviewTabBtn.classList.add("active");
      reviewPanel.style.display = "block";
      renderReviewPanel();
    });

    // Also update the review count badge on the tab button
    const reviews = getProductReviews(productName);
    if (reviews.length > 0) {
      reviewTabBtn.textContent = `Reviews (${reviews.length})`;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
