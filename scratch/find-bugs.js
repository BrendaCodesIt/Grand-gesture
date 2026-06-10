const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        if (file === 'node_modules' || file === '.git' || file === 'scratch' || file === 'images') return;
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.html')) results.push(file);
        }
    });
    return results;
}

const allHtmlFiles = walk(__dirname + '/..');
const availableHtmlFiles = new Set(allHtmlFiles.map(f => path.basename(f)));
const availableImages = new Set();
if (fs.existsSync(path.join(__dirname, '../images'))) {
    fs.readdirSync(path.join(__dirname, '../images')).forEach(f => availableImages.add(f));
}

const bugs = [];

for (const file of allHtmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relPath = path.relative(path.join(__dirname, '..'), file);
    
    // Check basic structure
    if (!content.includes('</body>')) bugs.push(`[${relPath}] Missing </body> tag`);
    if (!content.includes('</html>')) bugs.push(`[${relPath}] Missing </html> tag`);
    if (!content.includes('<head>')) bugs.push(`[${relPath}] Missing <head> tag`);
    
    const $ = cheerio.load(content);
    
    // Check multiple trust bars
    const trustBars = $('.trust-bar').length;
    if (trustBars > 1) bugs.push(`[${relPath}] Multiple trust bars found (${trustBars})`);
    if (trustBars === 0) bugs.push(`[${relPath}] Missing trust bar`);
    
    // Check broken internal links
    $('a[href]').each((i, el) => {
        let href = $(el).attr('href');
        if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
            // Strip query params or hashes
            href = href.split('?')[0].split('#')[0];
            if (href && href.endsWith('.html')) {
                const targetPath = path.join(path.dirname(file), href);
                if (!fs.existsSync(targetPath)) {
                    bugs.push(`[${relPath}] Broken link to: ${href}`);
                }
            }
        }
    });

    // Check broken images
    $('img[src]').each((i, el) => {
        let src = $(el).attr('src');
        if (src && !src.startsWith('http') && !src.startsWith('data:')) {
            const targetPath = path.join(path.dirname(file), src);
            if (!fs.existsSync(targetPath)) {
                bugs.push(`[${relPath}] Broken image source: ${src}`);
            }
        }
    });

    // Unclosed div tags roughly
    const divOpen = (content.match(/<div\b[^>]*>/gi) || []).length;
    const divClose = (content.match(/<\/div>/gi) || []).length;
    if (divOpen !== divClose) {
        bugs.push(`[${relPath}] Mismatched <div> tags (Open: ${divOpen}, Close: ${divClose})`);
    }

    // Check if black/white colors applied from yesterday's monochrome replacement caused issues
    // Check button styles
    $('.btn, button').each((i, el) => {
        const text = $(el).text().trim();
        // check for any weird artifacts like unclosed quotes in class
        const className = $(el).attr('class');
        if (className && className.includes('"')) {
            bugs.push(`[${relPath}] Malformed class name on button: ${className}`);
        }
    });
}

console.log("Bug Report:");
if (bugs.length === 0) {
    console.log("No bugs found!");
} else {
    bugs.forEach(b => console.log(b));
}
