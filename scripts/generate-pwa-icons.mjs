import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '..', 'public', 'icons', 'icon-pwa.png');
const outputDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcon(size, padding) {
  const innerSize = size - padding;
  const outputPath = path.join(outputDir, `icon-${size}.png`);
  
  try {
    const buffer = await sharp(inputPath)
      .resize(innerSize, innerSize, {
        fit: 'contain',
        background: '#1A120D'
      })
      .extend({
        top: Math.floor(padding / 2),
        bottom: Math.ceil(padding / 2),
        left: Math.floor(padding / 2),
        right: Math.ceil(padding / 2),
        background: '#1A120D'
      })
      .png({ quality: 100 })
      .toBuffer();

    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Gerado icon-${size}.png com sucesso!`);
  } catch (error) {
    console.error(`❌ Erro ao gerar icon-${size}.png:`, error);
  }
}

async function run() {
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Imagem base não encontrada em: ${inputPath}`);
    process.exit(1);
  }
  
  console.log('Gerando ícones PWA com maior ocupação (80%)...');
  // Para 192x192, 10% de margem lateral (~19px) = 38px de padding total
  await generateIcon(192, 38);
  
  // Para 512x512, 10% de margem lateral (~51px) = 102px de padding total
  await generateIcon(512, 102);
  
  console.log('🎯 Concluído!');
}

run();
