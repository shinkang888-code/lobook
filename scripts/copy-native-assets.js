const fs = require("fs");
const path = require("path");

function copyIfExists(src, dest, label) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${label} → ${path.relative(process.cwd(), dest)}`);
    return true;
  }
  console.warn(`${label} not found at ${src}`);
  return false;
}

const root = path.join(__dirname, "..");

copyIfExists(
  path.join(root, "node_modules/@rhwp/core/rhwp_bg.wasm"),
  path.join(root, "public/rhwp_bg.wasm"),
  "rhwp_bg.wasm",
);

copyIfExists(
  path.join(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs"),
  path.join(root, "public/pdf.worker.min.mjs"),
  "pdf.worker.min.mjs",
);
