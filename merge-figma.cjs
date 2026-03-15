const fs = require("fs");
const path = require("path");

const OUTPUT_FILE = "figma-merged.txt";

const IGNORE_DIRS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".vite"
];

const IGNORE_FILES = [
  OUTPUT_FILE,
  "package-lock.json"
];

const ALLOWED_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".css",
  ".md"
];

function shouldIgnore(fullPath) {
  const parts = fullPath.split(path.sep);

  if (parts.some(part => IGNORE_DIRS.includes(part))) {
    return true;
  }

  if (IGNORE_FILES.includes(path.basename(fullPath))) {
    return true;
  }

  return false;
}

function shouldIncludeFile(fileName) {
  return ALLOWED_EXTENSIONS.some(ext =>
    fileName.endsWith(ext)
  );
}

function readDirRecursive(dir) {
  let output = "";

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (shouldIgnore(fullPath)) continue;

    if (entry.isDirectory()) {
      output += readDirRecursive(fullPath);
    } else if (shouldIncludeFile(entry.name)) {

      output += `\n\n// ===== FILE: ${fullPath} =====\n\n`;

      output += fs.readFileSync(fullPath, "utf8");
    }
  }

  return output;
}

const mergedCode = readDirRecursive(".");

fs.writeFileSync(OUTPUT_FILE, mergedCode);

console.log("Figma repo merged into figma-merged.txt");