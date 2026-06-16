import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");
const sourceDir = join(webRoot, "public");
const standaloneDir = join(webRoot, ".next", "standalone", "public");
const staticSourceDir = join(webRoot, ".next", "static");
const staticStandaloneDir = join(webRoot, ".next", "standalone", ".next", "static");

mkdirSync(standaloneDir, { recursive: true });
cpSync(sourceDir, standaloneDir, { recursive: true, force: true });
mkdirSync(staticStandaloneDir, { recursive: true });
cpSync(staticSourceDir, staticStandaloneDir, { recursive: true, force: true });

console.log(`Copied public assets to ${standaloneDir}`);
console.log(`Copied static assets to ${staticStandaloneDir}`);
