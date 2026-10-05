// Generates PWA icons from the DisasterGuard shield logo (SVG → PNG via sharp)
import sharp from "sharp";
import fs from "fs";
import path from "path";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1a30"/>
      <stop offset="1" stop-color="#060b16"/>
    </linearGradient>
    <linearGradient id="shield" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#22d3ee"/>
      <stop offset="1" stop-color="#0284c7"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <path d="M256 84 L396 132 V268 C396 356 336 412 256 440 C176 412 116 356 116 268 V132 Z" fill="url(#shield)"/>
  <path d="M256 120 L364 158 V266 C364 336 318 380 256 404 C194 380 148 336 148 266 V158 Z" fill="#07101f"/>
  <path d="M256 156 L332 182 V262 C332 316 298 350 256 368 C214 350 180 316 180 262 V182 Z" fill="url(#shield)" opacity="0.25"/>
  <circle cx="256" cy="242" r="22" fill="#ffffff"/>
  <circle cx="256" cy="242" r="52" fill="none" stroke="#ffffff" stroke-width="10" opacity="0.85"/>
  <circle cx="256" cy="242" r="82" fill="none" stroke="#22d3ee" stroke-width="6" opacity="0.5" stroke-dasharray="30 16"/>
  <path d="M256 242 L320 196" stroke="#f97316" stroke-width="10" stroke-linecap="round"/>
  <circle cx="320" cy="196" r="14" fill="#f97316"/>
</svg>`;

const outDir = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

await sharp(Buffer.from(svg)).resize(512, 512).png().toFile(path.join(outDir, "icon-512.png"));
await sharp(Buffer.from(svg)).resize(192, 192).png().toFile(path.join(outDir, "icon-192.png"));

// maskable: add extra padding (safe zone 80%)
const maskableSvg = svg.replace('viewBox="0 0 512 512"', 'viewBox="-64 -64 640 640"');
await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toFile(path.join(outDir, "icon-maskable-512.png"));

// favicon
await sharp(Buffer.from(svg)).resize(64, 64).png().toFile(path.join(outDir, "icon-64.png"));
console.log("✅ icons generated in", outDir);
