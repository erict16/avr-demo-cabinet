// Writes the A4 drawing sheets (drawings/sheet-N.svg, drawings/sheets.html) and prints them to
// drawings/avr-demo-cabinet-rev-B.pdf with headless Edge or Chrome.
// node pdf.mjs
import { mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { sheets, REV } from "./drawing.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "drawings");
mkdirSync(OUT, { recursive: true });

export const PDF_NAME = `avr-demo-cabinet-rev-${REV}.pdf`;
const list = sheets();
list.forEach((s, i) => writeFileSync(join(OUT, `sheet-${i + 1}.svg`), `<?xml version="1.0" encoding="UTF-8"?>\n${s.svg}`));

const html = `<!doctype html><html><head><meta charset="utf-8"><title>AVR demo cabinet, drawings rev ${REV}</title>
<style>@page{size:A4 landscape;margin:0}html,body{margin:0;padding:0}.p{width:297mm;height:210mm;overflow:hidden;break-after:page}.p:last-child{break-after:auto}.p svg{display:block;width:297mm;height:210mm}</style>
</head><body>${list.map((s) => `<div class="p">${s.svg}</div>`).join("")}</body></html>`;
const htmlPath = join(OUT, "sheets.html");
writeFileSync(htmlPath, html);

const browsers = [
  process.env.BROWSER,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const browser = browsers.find((b) => existsSync(b));
const pdfPath = join(OUT, PDF_NAME);
if (!browser) {
  console.warn("no Edge or Chrome found: wrote the SVG sheets, skipped the PDF");
} else {
  execFileSync(browser, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--no-first-run", `--user-data-dir=${join(OUT, ".chrome")}`, `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href], { stdio: "ignore" });
  console.log("wrote", PDF_NAME, (statSync(pdfPath).size / 1024).toFixed(0) + " KB,", list.length, "A4 sheets");
}
