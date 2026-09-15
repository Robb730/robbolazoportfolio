import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const svgPath = path.resolve("public/new-logo.svg");
const svg = readFileSync(svgPath);

const icons = [
  { file: "public/apple-touch-icon.png", size: 180, padding: 0.12 },
  { file: "public/apple-touch-icon-152x152.png", size: 152, padding: 0.12 },
  { file: "public/apple-touch-icon-167x167.png", size: 167, padding: 0.12 },
  { file: "public/apple-touch-icon-120x120.png", size: 120, padding: 0.12 },
  { file: "public/favicon-32x32.png", size: 32, padding: 0.12 },
  { file: "public/favicon-16x16.png", size: 16, padding: 0.12 },
  { file: "public/icon-192.png", size: 192, padding: 0.12 },
  { file: "public/icon-512.png", size: 512, padding: 0.12 },
  { file: "public/icon-512-maskable.png", size: 512, padding: 0.22 }, // maskable needs more safe area
];

for (const { file, size, padding } of icons) {
  const inner = Math.round(size * (1 - padding * 2));
  // Render SVG to PNG of inner size, contain
  const svgPng = await sharp(svg)
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // Create white square and composite
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: svgPng, gravity: "centre" }])
    .png()
    .toFile(file);

  console.log(`✓ ${file} ${size}x${size} (inner ${inner})`);
}

// also generate favicon.ico fallback by copying 32png -> favicon.ico is not ico but png works; we generate ico via sharp? just ensure file exists
// Verify files
for (const { file } of icons) {
  const stat = existsSync(file) ? "exists" : "MISSING";
  console.log(file, stat);
}
