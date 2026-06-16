import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");
const sourceDir = join(webRoot, "public");
const standaloneDir = join(webRoot, ".next", "standalone", "public");

mkdirSync(standaloneDir, { recursive: true });
cpSync(sourceDir, standaloneDir, { recursive: true, force: true });

console.log(`Copied public assets to ${standaloneDir}`);
