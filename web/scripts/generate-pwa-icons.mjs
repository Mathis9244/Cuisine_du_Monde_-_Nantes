import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const svgPath = join(publicDir, "icon.svg");
const svg = readFileSync(svgPath);

const sizes = [192, 512];

mkdirSync(publicDir, { recursive: true });

for (const size of sizes) {
  const out = join(publicDir, `icon-${size}.png`);
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log(`Wrote ${out}`);
}

console.log("PWA icons generated.");
