import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = 'C:/Users/User/.gemini/antigravity/brain/daeb962b-ba52-4b65-92a1-c9578f6159c8/media__1774199527363.png';
const logoDir = path.join(__dirname, '..', 'public', 'brand', 'logo');
const iconDir = path.join(__dirname, '..', 'public', 'brand', 'icons');

[logoDir, iconDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function extractAsset(name, rect, outputDir) {
  const outputPath = path.join(outputDir, name);
  try {
    await sharp(inputPath)
      .extract(rect)
      .png()
      .toFile(outputPath);
    console.log(`✅ Extraído: ${name}`);
  } catch (err) {
    console.error(`❌ Erro ao extrair ${name}:`, err);
  }
}

async function generatePwaIcon(size, padding) {
  const innerSize = size - padding;
  const outputPath = path.join(iconDir, `icon-${size}.png`);
  
  try {
    // Usaremos o ícone grande branco como base para os redimensionamentos
    const baseIcon = await sharp(inputPath)
      .extract({ x: 612, y: 94, width: 300, height: 300 })
      .toBuffer();

    await sharp(baseIcon)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .extend({
        top: Math.floor(padding / 2),
        bottom: Math.ceil(padding / 2),
        left: Math.floor(padding / 2),
        right: Math.ceil(padding / 2),
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Gerado PWA Icon: icon-${size}.png`);
  } catch (err) {
    console.error(`❌ Erro ao gerar PWA Icon ${size}:`, err);
  }
}

async function run() {
  console.log('--- Iniciando Extração de Branding ---');

  // Vertical Logo
  await extractAsset('principal.png', { left: 168, top: 94, width: 382, height: 435 }, logoDir);
  
  // Horizontal Logo
  await extractAsset('horizontal.png', { left: 62, top: 531, width: 474, height: 125 }, logoDir);
  
  // Base App Icons
  await extractAsset('icon-app.png', { left: 612, top: 94, width: 300, height: 300 }, iconDir);
  await extractAsset('icon-app-dark.png', { left: 778, top: 531, width: 136, height: 136 }, iconDir);

  // PWA Icons & Favicon
  // Para 192x192, 10% margem lateral (~19px) = 38px total padding
  await generatePwaIcon(192, 38);
  // Para 512x512, 10% margem lateral (~51px) = 102px total padding
  await generatePwaIcon(512, 102);
  
  // Favicon (32x32)
  await extractAsset('favicon.png', { left: 612, top: 94, width: 300, height: 300 }, iconDir);
  await sharp(path.join(iconDir, 'favicon.png'))
    .resize(32, 32)
    .toFile(path.join(iconDir, 'favicon-32.png'));
    
  console.log('--- Extração Concluída ---');
}

run();
