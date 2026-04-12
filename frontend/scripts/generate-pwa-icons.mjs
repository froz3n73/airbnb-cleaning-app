import sharp from "sharp";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#5a9a3e"/>
  <path fill="#fff" d="M256 120 120 256v196h88V328h96v124h88V256L256 120z"/>
</svg>`;

for (const size of [192, 512]) {
  const out = join(publicDir, `pwa-${size}x${size}.png`);
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
  console.log("Wrote", out);
}

const appleOut = join(publicDir, "apple-touch-icon.png");
await sharp(Buffer.from(svg)).resize(180, 180).png().toFile(appleOut);
console.log("Wrote", appleOut);

writeFileSync(
  join(publicDir, "favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#5a9a3e"/>
  <path fill="#fff" d="M16 8 8 16v10h5v-6h6v6h5V16l-8-8z"/>
</svg>`
);
console.log("Wrote favicon.svg");
