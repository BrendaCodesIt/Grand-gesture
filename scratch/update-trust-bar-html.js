const fs = require('fs');
const path = require('path');

const dirs = ['.', './categories', './brands', './products'];

// HTML for the new Trust Bar layout
const trustBarHtml = `
  <!-- Trust Bar -->
  <section class="trust-bar-container">
    <div class="trust-bar-box">
      <!-- Genuine Products -->
      <div class="trust-box-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 22h20L12 2 2 22z"></path>
        </svg>
        <div class="trust-box-text">
          <div class="trust-box-title">Genuine<br>Products</div>
          <div class="trust-box-desc">100% authentic<br>brands.</div>
        </div>
      </div>
      
      <!-- Secure Payments -->
      <div class="trust-box-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <div class="trust-box-text">
          <div class="trust-box-title">Secure<br>Payments</div>
          <div class="trust-box-desc">Safe and reliable<br>checkout.</div>
        </div>
      </div>
      
      <!-- Fast Delivery -->
      <div class="trust-box-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" opacity="0"></path>
          <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21.5 4s-2 .5-3.5 2L14.5 9.5 6.3 7.7c-1.1-.3-2.1.2-2.5 1.1l-1.6 3.6 5.8 1.5L9.5 18l-3.2-.8L5 20l4.5.5L13 25l1.8-1.5-.8-3.2 4.1 1.5 1.5 5.8 3.6-1.6c.9-.4 1.4-1.4 1.1-2.5l-1.8-8.2z"></path>
        </svg>
        <div class="trust-box-text trust-box-text-row">
          <div class="trust-box-title">Fast Delivery</div>
          <div class="trust-box-desc">Countrywide fast shipping.</div>
        </div>
      </div>
    </div>
  </section>
`;

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    let html = fs.readFileSync(filePath, 'utf8');
    
    // Replace old trust bar with new one
    const startIdx = html.indexOf('<!-- Trust Bar -->');
    const endIdx = html.indexOf('</section>', startIdx);
    
    if (startIdx !== -1 && endIdx !== -1) {
      const oldBar = html.substring(startIdx, endIdx + 10);
      html = html.replace(oldBar, trustBarHtml.trim());
      fs.writeFileSync(filePath, html, 'utf8');
      console.log('Updated Trust Bar in ' + file);
    }
  });
});
