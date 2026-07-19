import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const i18nPath = path.join(root, "src", "i18n.js");
const sourceDir = path.join(root, "src");
const localeCodes = ["en", "fr", "ar"];
const keyRegex = /t\(\s*(['\"])([^'\"]+?)\1\s*(?:,|\))/g;
const sourceExtensions = [".js", ".jsx", ".ts", ".tsx"];
const validKeyRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;

function humanizeKey(key) {
  if (!key) return key;
  const isUpper = key === key.toUpperCase();
  if (isUpper) return key;
  let text = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  text = text.replace(/\b([a-z])/g, (match) => match.toUpperCase());
  return text;
}

function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const resolved = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      files.push(...walkDir(resolved));
    } else if (sourceExtensions.includes(path.extname(entry.name))) {
      files.push(resolved);
    }
  }
  return files;
}

function parseLocaleBlock(text, locale) {
  const openMarker = `${locale}: {`;
  const startIndex = text.indexOf(openMarker);
  if (startIndex < 0) return null;
  let index = startIndex + openMarker.length;
  let depth = 1;
  let blockEnd = -1;
  while (index < text.length) {
    const char = text[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) {
      blockEnd = index;
      break;
    }
    index += 1;
  }
  if (blockEnd < 0) return null;
  return {
    start: startIndex + openMarker.length,
    end: blockEnd,
    content: text.slice(startIndex + openMarker.length, blockEnd),
  };
}

function parseLocaleEntries(block) {
  const lines = block.split(/\r?\n/);
  const entries = new Map();
  const entryRegex = /^\s*([a-zA-Z0-9_]+):\s*(["'])([\s\S]*?)\2,?\s*$/;
  for (const line of lines) {
    const match = line.match(entryRegex);
    if (match) {
      entries.set(match[1], match[3]);
    }
  }
  return entries;
}

function createInsertText(entries) {
  if (!entries.length) return "";
  return entries
    .map(([key, value]) => `    ${key}: ${JSON.stringify(value)},`)
    .join("\n") + "\n";
}

const sourceFiles = walkDir(sourceDir);
const keys = new Set();
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, "utf8");
  let match;
  while ((match = keyRegex.exec(content))) {
    if (validKeyRegex.test(match[2])) {
      keys.add(match[2]);
    }
  }
}

if (!keys.size) {
  console.log("No translation keys found in source files.");
  process.exit(0);
}

const i18nText = fs.readFileSync(i18nPath, "utf8");
let updatedText = i18nText;
let changes = 0;

const englishBlock = parseLocaleBlock(i18nText, "en");
const englishEntries = englishBlock ? parseLocaleEntries(englishBlock.content) : new Map();

for (const locale of localeCodes) {
  const block = parseLocaleBlock(updatedText, locale);
  if (!block) {
    console.warn(`Locale block not found: ${locale}`);
    continue;
  }
  const entries = parseLocaleEntries(block.content);
  const missing = [];
  for (const key of keys) {
    if (!entries.has(key)) {
      const value = englishEntries.get(key) || humanizeKey(key);
      missing.push([key, value]);
    }
  }
  if (!missing.length) continue;

  const insertIndex = block.end;
  const insertText = createInsertText(missing);
  updatedText = `${updatedText.slice(0, insertIndex)}${insertText}${updatedText.slice(insertIndex)}`;
  changes += missing.length;
  console.log(`Added ${missing.length} missing keys to locale ${locale}`);
}

if (changes) {
  fs.writeFileSync(i18nPath, updatedText, "utf8");
  console.log(`Synced ${changes} translation key(s) into ${i18nPath}`);
} else {
  console.log("All translation keys already exist in i18n.js.");
}
