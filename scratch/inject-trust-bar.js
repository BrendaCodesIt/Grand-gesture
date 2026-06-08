const fs = require('fs');
const path = require('path');

const dirs = ['.', './categories', './brands', './products'];

const trustBarHtml = `
  <!-- Trust Bar -->
  <section class="trust-bar">
    <div class="trust-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="3" width="15" height="13"></rect>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
        <circle cx="5.5" cy="18.5" r="2.5"></circle>
        <circle cx="18.5" cy="18.5" r="2.5"></circle>
      </svg>
      <div>
        <h4>Fast Delivery</h4>
        <p>Nationwide Shipping</p>
      </div>
    </div>
    <div class="trust-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <path d="M9 12l2 2 4-4"></path>
      </svg>
      <div>
        <h4>Secure Checkout</h4>
        <p>100% Protected</p>
      </div>
    </div>
    <div class="trust-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8" r="7"></circle>
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
      </svg>
      <div>
        <h4>100% Genuine</h4>
        <p>Certified Products</p>
      </div>
    </div>
    <div class="trust-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 2v6h-6"></path>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
        <path d="M3 3v5h5"></path>
      </svg>
      <div>
        <h4>Easy Returns</h4>
        <p>Hassle-Free Policy</p>
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
    
    // Only inject if it hasn't been injected yet
    if (!html.includes('<section class="trust-bar">')) {
      // Find the footer tag and insert right before it
      html = html.replace('<footer class="main-footer">', trustBarHtml + '\n      <footer class="main-footer">');
      
      fs.writeFileSync(filePath, html, 'utf8');
      console.log('Injected Trust Bar into ' + file);
    }
  });
});
