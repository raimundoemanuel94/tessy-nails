
    const sharp = require('sharp');
    const path = require('path');
    
    async function convert() {
      const publicDir = 'C:\\laragon\\www\\Tessy Nails\\public';
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
  