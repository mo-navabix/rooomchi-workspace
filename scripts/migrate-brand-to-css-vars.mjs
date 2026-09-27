/**
 * One-off: replace hardcoded Rooomchi teal hex / emerald Tailwind with org CSS variables.
 */
import fs from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");
const SKIP = new Set([
  path.normalize("src/constants/brand.ts"),
  path.normalize("src/utils/orgBrandTheme.ts"),
]);

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(tsx|ts|css)$/.test(name)) files.push(p);
  }
  return files;
}

function migrate(content) {
  let s = content;

  const hexMap = [
    ["#0F786E", "var(--brand-primary)"],
    ["#0f786e", "var(--brand-primary)"],
    ["#10B981", "var(--brand-primary-light)"],
    ["#10b981", "var(--brand-primary-light)"],
    ["#0D6B63", "var(--brand-primary-hover)"],
    ["#0d6b63", "var(--brand-primary-hover)"],
    ["#0F766E", "var(--brand-primary-hover)"],
    ["#0f766e", "var(--brand-primary-hover)"],
    ["#34D399", "var(--brand-primary-lighter)"],
    ["#34d399", "var(--brand-primary-lighter)"],
    ["#5EEAD4", "var(--brand-primary-on-dark)"],
    ["#5eead4", "var(--brand-primary-on-dark)"],
    ["#14B8A6", "var(--brand-primary-light)"],
    ["#14b8a6", "var(--brand-primary-light)"],
    ["#99F6E4", "var(--brand-primary-on-dark)"],
    ["#99f6e4", "var(--brand-primary-on-dark)"],
    ["#119384", "var(--brand-primary-hover-dark)"],
    ["#D1FAE5", "var(--brand-primary-ultra-light)"],
    ["#d1fae5", "var(--brand-primary-ultra-light)"],
  ];

  for (const [hex, varName] of hexMap) {
    const escaped = hex.replace("#", "\\#");
    s = s.replace(
      new RegExp(`\\[${escaped}\\]/(\\d+)`, "gi"),
      `[rgb(var(--brand-primary-rgb)/0.$1)]`,
    );
    s = s.replaceAll(`[${hex}]`, `[${varName}]`);
  }

  const emerald = [
    [/text-emerald-700/g, "text-brand"],
    [/text-emerald-600/g, "text-brand"],
    [/text-emerald-800/g, "text-brand"],
    [/dark:text-emerald-400/g, "dark:text-[var(--brand-primary-on-dark)]"],
    [/dark:text-emerald-300/g, "dark:text-[var(--brand-primary-on-dark)]"],
    [/dark:text-emerald-200/g, "dark:text-[var(--brand-primary-on-dark)]"],
    [/group-hover:text-emerald-600/g, "group-hover:text-brand"],
    [/hover:text-emerald-600/g, "hover:text-brand"],
    [/hover:text-emerald-700/g, "hover:text-brand"],
    [/bg-emerald-50/g, "bg-brand-soft"],
    [/bg-emerald-100/g, "bg-[rgb(var(--brand-primary-rgb)/0.12)]"],
    [/hover:bg-emerald-50/g, "hover:bg-brand-soft"],
    [/hover:bg-emerald-100/g, "hover:bg-[rgb(var(--brand-primary-rgb)/0.15)]"],
    [
      /dark:bg-emerald-950\/40/g,
      "dark:bg-[rgb(var(--brand-primary-rgb)/0.15)]",
    ],
    [
      /dark:bg-emerald-950\/60/g,
      "dark:bg-[rgb(var(--brand-primary-rgb)/0.2)]",
    ],
    [
      /dark:bg-emerald-950\/30/g,
      "dark:bg-[rgb(var(--brand-primary-rgb)/0.12)]",
    ],
    [
      /dark:hover:bg-emerald-950\/40/g,
      "dark:hover:bg-[rgb(var(--brand-primary-rgb)/0.15)]",
    ],
    [
      /dark:hover:bg-emerald-900\/60/g,
      "dark:hover:bg-[rgb(var(--brand-primary-rgb)/0.22)]",
    ],
    [/border-emerald-200/g, "border-brand-soft"],
    [/border-emerald-300/g, "border-brand-soft"],
    [
      /dark:border-emerald-800/g,
      "dark:border-[rgb(var(--brand-primary-rgb)/0.35)]",
    ],
    [
      /dark:border-emerald-700/g,
      "dark:border-[rgb(var(--brand-primary-rgb)/0.35)]",
    ],
    [/focus:ring-emerald-500/g, "focus:ring-[var(--brand-primary)]"],
    [/focus:ring-emerald-500\/20/g, "focus:ring-[rgb(var(--brand-primary-rgb)/0.2)]"],
    [/accent-emerald-600/g, "accent-[var(--brand-primary)]"],
    [/accent-\[var\(--brand-primary\)\]/g, "accent-[var(--brand-primary)]"],
    [/shadow-emerald-900\/20/g, "shadow-[rgb(var(--brand-primary-rgb)/0.2)]"],
    [/from-emerald-500/g, "from-[var(--brand-primary-light)]"],
    [/to-emerald-600/g, "to-[var(--brand-primary)]"],
    [/from-emerald-600/g, "from-[var(--brand-primary)]"],
    [/to-teal-600/g, "to-[var(--brand-primary-hover)]"],
  ];

  for (const [re, rep] of emerald) {
    s = s.replace(re, rep);
  }

  s = s.replace(
    /bg-\[var\(--brand-primary\)\] hover:bg-\[var\(--brand-primary-hover\)\]/g,
    "btn-brand",
  );

  return s;
}

const files = walk(SRC);
let changed = 0;
for (const file of files) {
  const rel = path.normalize(path.relative(process.cwd(), file));
  if (SKIP.has(rel)) continue;
  const before = fs.readFileSync(file, "utf8");
  const after = migrate(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed++;
    console.log("updated", rel);
  }
}
console.log(`Done. ${changed} files updated.`);
