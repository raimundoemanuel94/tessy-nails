const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Determine paths
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const LOGO_DIR = path.join(PUBLIC_DIR, 'images', 'logo');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

// Create directories if they don't exist
if (!fs.existsSync(LOGO_DIR)) fs.mkdirSync(LOGO_DIR, { recursive: true });
if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });

// 1. Full Logo SVG
const logoFullSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="800" height="800">
    <defs>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&amp;family=Montserrat:wght@700&amp;display=swap');
            .text-tessy { font-family: 'Playfair Display', serif; font-size: 42px; font-weight: 700; fill: #2C2C2C; text-anchor: middle; }
            .text-nails { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; fill: #C89B7B; letter-spacing: 0.6em; text-anchor: middle; }
            .line { stroke: #E5E7EB; stroke-width: 1.5; }
        </style>
    </defs>
    <!-- Top Icon -->
    <g transform="translate(50, 10)">
        <path d="M20 75 C25 60 35 30 50 30 C65 30 75 60 80 75" stroke="#C89B7B" stroke-width="1" stroke-dasharray="2 2" opacity="0.4" fill="none"/>
        <path d="M50 22 C62 22 70 34 70 55 V82 C70 88 65 92 59 92 H41 C35 92 30 88 30 82 V55 C30 34 38 22 50 22Z" fill="white" stroke="#6F4E37" stroke-width="2.5"/>
        <path d="M40 50 C40 42 44 34 50 34" stroke="#C89B7B" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <g>
            <path d="M75 15 L75 27 M69 21 L81 21" stroke="#C89B7B" stroke-width="2" fill="none"/>
            <circle cx="75" cy="21" r="1.5" fill="#C89B7B"/>
        </g>
    </g>
    <!-- Bottom Text -->
    <g transform="translate(100, 150)">
        <text class="text-tessy" x="0" y="0">TESSY</text>
        <g transform="translate(0, 25)">
            <line x1="-70" y1="-3" x2="-45" y2="-3" class="line"/>
            <text class="text-nails" x="5" y="0">NAILS</text>
            <line x1="45" y1="-3" x2="70" y2="-3" class="line"/>
        </g>
    </g>
</svg>`;

// 2. Compact Logo SVG
const logoCompactSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="600" height="240">
    <defs>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&amp;display=swap');
            .text-tessy { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 600; fill: #2C2C2C; }
            .text-nails { font-family: 'Playfair Display', serif; font-style: italic; font-size: 28px; font-weight: 400; fill: #A8A29E; }
        </style>
    </defs>
    <g transform="translate(10, 15) scale(0.5)">
        <path d="M50 22 C62 22 70 34 70 55 V82 C70 88 65 92 59 92 H41 C35 92 30 88 30 82 V55 C30 34 38 22 50 22Z" fill="#6F4E37"/>
        <path d="M42 45 C42 40 45 35 50 35" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.6" fill="none"/>
        <path d="M80 20 L80 30 M75 25 L85 25" stroke="#C89B7B" stroke-width="3" fill="none"/>
    </g>
    <text x="70" y="48">
        <tspan class="text-tessy">Tessy </tspan>
        <tspan class="text-nails">Nails</tspan>
    </text>
</svg>`;

// 3. Icon SVG (Maskable for PWA)
const logoIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="1024" height="1024">
    <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6F4E37"/>
            <stop offset="100%" stop-color="#4A3425"/>
        </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#bg)"/>
    <g transform="translate(22.5, 22.5) scale(0.55)">
        <path d="M50 22 C62 22 70 34 70 55 V82 C70 88 65 92 59 92 H41 C35 92 30 88 30 82 V55 C30 34 38 22 50 22Z" fill="white" />
        <path d="M42 45 C42 40 45 35 50 35" stroke="#C89B7B" stroke-width="4" fill="none" stroke-linecap="round"/>
        <circle cx="50" cy="75" r="3" fill="#C89B7B" opacity="0.8"/>
    </g>
</svg>`;

const logoFullPath = path.join(LOGO_DIR, 'logo-full.svg');
const logoCompactPath = path.join(LOGO_DIR, 'logo-compact.svg');
const logoIconPath = path.join(LOGO_DIR, 'logo-icon.svg');

fs.writeFileSync(logoFullPath, logoFullSVG);
fs.writeFileSync(logoCompactPath, logoCompactSVG);
fs.writeFileSync(logoIconPath, logoIconSVG);

console.log("SVGs written successfully.");

// Now attempt to run Sharp to convert to PNG
try {
  let sharpCode = `
    const sharp = require('sharp');
    const path = require('path');
    
    async function convert() {
      const publicDir = '${PUBLIC_DIR.replace(/\\/g, '\\\\')}';
      const logoDir = path.join(publicDir, 'images', 'logo');
      const iconsDir = path.join(publicDir, 'icons');
      
      console.log('Converting logo-full.svg -> logo-full.png...');
      await sharp(path.join(logoDir, 'logo-full.svg')).png().toFile(path.join(logoDir, 'logo-full.png'));
      
      console.log('Converting logo-compact.svg -> logo-compact.png...');
      await sharp(path.join(logoDir, 'logo-compact.svg')).png().toFile(path.join(logoDir, 'logo-compact.png'));
      
      console.log('Converting logo-icon.svg -> logo-icon.png...');
      await sharp(path.join(logoDir, 'logo-icon.svg')).resize(512, 512).png().toFile(path.join(logoDir, 'logo-icon.png'));
      
      // PWA Icons
      console.log('Generating PWA icons...');
      await sharp(path.join(logoDir, 'logo-icon.svg')).resize(192, 192).png().toFile(path.join(iconsDir, 'icon-192.png'));
      await sharp(path.join(logoDir, 'logo-icon.svg')).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-512.png'));
      
      console.log('PNG generation complete!');
    }
    convert().catch(e => { console.error("Sharp failed", e); process.exit(1); });
  `;
  
  fs.writeFileSync(path.join(__dirname, 'sharp-converter.js'), sharpCode);
  execSync('node sharp-converter.js', { stdio: 'inherit' });
} catch (e) {
  console.log("Sharp conversion failed. Next.js might not have sharp installed globally. Falling back to downloading generic versions if needed, or instructing user.");
}
