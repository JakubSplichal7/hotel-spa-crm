/**
 * One-off: generate desktop/mobile WebP variants from resort-N.jpg backgrounds.
 * Usage: node scripts/generate-resort-webps.mjs
 */
import sharp from "sharp";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DIR = path.join(ROOT, "public", "backgrounds");
const QUALITY = 78;

async function processResort(n) {
  const input = path.join(DIR, `resort-${n}.jpg`);
  const desktopOut = path.join(DIR, `resort-${n}-desktop.webp`);
  const mobileOut = path.join(DIR, `resort-${n}-mobile.webp`);

  const desktop = await sharp(input)
    .resize(2400, 1600, { fit: "cover", position: "centre" })
    .webp({ quality: QUALITY })
    .toFile(desktopOut);

  const mobile = await sharp(input)
    .resize(1080, 1920, { fit: "cover", position: "centre" })
    .webp({ quality: QUALITY })
    .toFile(mobileOut);

  console.log(
    `resort-${n}: desktop ${desktop.width}x${desktop.height} (${(desktop.size / 1024).toFixed(0)} KB), mobile ${mobile.width}x${mobile.height} (${(mobile.size / 1024).toFixed(0)} KB)`
  );
}

await mkdir(DIR, { recursive: true });
const files = await readdir(DIR);
const nums = files
  .map((f) => /^resort-(\d+)\.jpg$/i.exec(f)?.[1])
  .filter(Boolean)
  .map(Number)
  .sort((a, b) => a - b);

if (nums.length === 0) {
  console.error("No resort-N.jpg files found in", DIR);
  process.exit(1);
}

for (const n of nums) {
  await processResort(n);
}
console.log("Done.");
