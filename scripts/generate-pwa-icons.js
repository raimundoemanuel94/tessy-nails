const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateIcons() {
  const masterIcon = "C:\\Users\\User\\.gemini\\antigravity\\brain\\0df26d1e-6ac0-4778-9f5f-02d4d34d8ae4\\luxury_pwa_icon_master_1774229466728.png";
  const outputDir = "c:\\laragon\\www\\Tessy Nails\\public\\brand\\icons";

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon-32.png', size: 32 },
    { name: 'favicon.png', size: 48 },
  ];

  console.log('--- Starting Icon Generation ---');

  for (const { name, size } of sizes) {
    console.log(`Generating ${name} (${size}x${size})...`);
    await sharp(masterIcon)
      .resize(size, size)
      .toFile(path.join(outputDir, name));
  }

  // Also as icon-app.png
  await sharp(masterIcon).resize(512, 512).toFile(path.join(outputDir, 'icon-app.png'));

  console.log('--- All icons generated successfully! ---');
}

generateIcons().catch(console.error);
