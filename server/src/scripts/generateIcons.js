import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../../../public');

// 1. Generate High-Fidelity Vector App Icon SVG
const appIconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="50%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>

    <!-- Ambient Shadow Filter -->
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#1e1b4b" flood-opacity="0.6" />
    </filter>

    <linearGradient id="capGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#e0e7ff" />
    </linearGradient>
  </defs>

  <!-- Squircle App Background -->
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)" />

  <!-- Inner Subtle Border -->
  <rect x="8" y="8" width="496" height="496" rx="120" fill="none" stroke="#ffffff" stroke-width="4" stroke-opacity="0.25" />

  <!-- Graduation Cap Icon Group -->
  <g filter="url(#dropShadow)" transform="translate(48, 64) scale(0.8125)">
    <!-- Cap Diamond / Rhombus Board -->
    <polygon points="256,60 472,170 256,280 40,170" fill="url(#capGlow)" />
    
    <!-- Under-Cap Bevel Shadow -->
    <polygon points="256,280 472,170 450,186 256,290 62,186 40,170" fill="#c7d2fe" />

    <!-- Skull Cap Base Underneath -->
    <path d="M 120,220 L 120,330 C 120,400 392,400 392,330 L 392,220 C 350,250 290,270 256,270 C 222,270 162,250 120,220 Z" fill="#ffffff" fill-opacity="0.95" />

    <!-- Cap Band Highlight Line -->
    <path d="M 120,310 C 170,360 342,360 392,310" fill="none" stroke="#6366f1" stroke-width="8" stroke-linecap="round" />

    <!-- Tassel String and Pendant -->
    <!-- Tassel anchor button on top -->
    <circle cx="256" cy="170" r="14" fill="#4338ca" />
    
    <!-- Tassel ribbon draped to the side -->
    <path d="M 256,170 C 370,180 440,240 440,320" fill="none" stroke="#fcd34d" stroke-width="10" stroke-linecap="round" />

    <!-- Tassel fringe bundle -->
    <rect x="428" y="320" width="24" height="60" rx="8" fill="#f59e0b" />
    <circle cx="440" cy="320" r="14" fill="#fbbf24" />

    <!-- Student Star Accent -->
    <polygon points="256,380 266,406 294,406 272,422 280,448 256,432 232,448 240,422 218,406 246,406" fill="#fbbf24" />
  </g>
</svg>
`;

fs.writeFileSync(path.join(publicDir, 'app-icon.svg'), appIconSvg);
fs.writeFileSync(path.join(publicDir, 'app-icon-maskable.svg'), appIconSvg);

// 2. Pure Node PNG Generator
function createPng(width, height, drawFn) {
  const bytesPerPixel = 4;
  const scanlineLength = width * bytesPerPixel + 1;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([len, typeAndData, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// Icon Pixel Generator (Smooth Gradient + Academic Cap Shape)
function drawAppIcon(isMaskable) {
  return (x, y, w, h) => {
    const nx = x / w;
    const ny = y / h;

    // Corner Radius Check for non-maskable (squircle)
    if (!isMaskable) {
      const radius = w * 0.22;
      const rx = x < radius ? radius - x : x > w - radius ? x - (w - radius) : 0;
      const ry = y < radius ? radius - y : y > h - radius ? y - (h - radius) : 0;
      if (rx * rx + ry * ry > radius * radius) {
        return [0, 0, 0, 0]; // Transparent outside squircle
      }
    }

    // Gradient Background (#4f46e5 to #06b6d4)
    const t = (nx + ny) / 2;
    let r = Math.round(79 * (1 - t) + 6 * t);
    let g = Math.round(70 * (1 - t) + 182 * t);
    let b = Math.round(229 * (1 - t) + 212 * t);
    let a = 255;

    // Center Coordinates (0,0 at center, -1 to 1)
    const cx = (x - w / 2) / (w * 0.42);
    const cy = (y - h / 2) / (h * 0.42);

    // 1. Cap Rhombus (Diamond on top): |cx| + |cy + 0.2| < 0.65
    const diamondY = cy + 0.18;
    const inDiamond = Math.abs(cx * 1.3) + Math.abs(diamondY * 2.2) <= 0.85;

    // 2. Skull Cap (curved bottom beneath diamond)
    const skullY = cy - 0.15;
    const inSkull = Math.abs(cx) <= 0.5 && skullY >= 0 && skullY <= 0.42 && (cx * cx + (skullY - 0.1) * (skullY - 0.1) <= 0.38);

    // 3. Tassel
    const inTasselLine = Math.abs(cx - 0.48) < 0.04 && cy >= -0.05 && cy <= 0.38;
    const inTasselTip = Math.abs(cx - 0.48) <= 0.08 && cy >= 0.35 && cy <= 0.52;

    if (inDiamond || inSkull) {
      // White / bright silver cap fill with subtle 3D shading
      const shade = Math.min(255, Math.max(220, Math.round(255 - cy * 40 - cx * 20)));
      return [shade, shade, 255, 255];
    }

    if (inTasselLine || inTasselTip) {
      // Warm amber tassel (#f59e0b)
      return [245, 158, 11, 255];
    }

    // Inner subtle border highlight
    if (x === 4 || x === w - 5 || y === 4 || y === h - 5) {
      return [255, 255, 255, 80];
    }

    return [r, g, b, a];
  };
}

console.log('Generating PWA Icons for StudyMate...');

// Generate 192x192 & 512x512 PNGs
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createPng(192, 192, drawAppIcon(false)));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createPng(512, 512, drawAppIcon(false)));
fs.writeFileSync(path.join(publicDir, 'icon-maskable-192.png'), createPng(192, 192, drawAppIcon(true)));
fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.png'), createPng(512, 512, drawAppIcon(true)));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, drawAppIcon(false)));

console.log('✅ All icons (192, 512, maskable, apple-touch-icon, svg) generated successfully in public/ !');
