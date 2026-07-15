const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svgPath = path.join(__dirname, 'public', 'icon.svg');
const outDir = path.join(__dirname, 'public');

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'badge.png', size: 96 },
];

async function generate() {
  const svgBuffer = fs.readFileSync(svgPath);
  
  for (const { name, size } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png({ quality: 100 })
      .toFile(path.join(outDir, name));
    console.log(`✓ ${name} (${size}x${size})`);
  }
  
  console.log('\nAll icons generated!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
