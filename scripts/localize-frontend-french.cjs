// Source-aware display migration: preserve routes, classes, form field names and API values.
const fs = require("node:fs");
const path = require("node:path");
const parser = require("@babel/parser");
const { spawnSync } = require("node:child_process");
const dictionary = {};
const walk = (node, visit, parent = null) => {
  if (!node || typeof node !== "object") return;
  visit(node, parent);
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "extra", "comments", "tokens"].includes(key)) continue;
    if (Array.isArray(value)) value.forEach(child => walk(child, visit, node));
    else if (value && typeof value === "object") walk(value, visit, node);
  }
};
const parse = text => parser.parse(text, { sourceType: "module", plugins: ["jsx"] });
Object.entries(JSON.parse(fs.readFileSync("frontend/src/i18n/questionText.json", "utf8"))).forEach(([fr, en]) => { dictionary[en] = fr; });
for (const filename of ["assessmentText.js", "english.js"]) walk(parse(fs.readFileSync("frontend/src/i18n/" + filename, "utf8")), node => {
  if (node.type === "ObjectProperty" && node.key.type === "StringLiteral" && node.value.type === "StringLiteral" && !/^[A-Z0-9_]+$/.test(node.key.value)) dictionary[node.value.value] = node.key.value;
});
Object.assign(dictionary, require("../frontend/src/i18n/french-ui.json"));
const protectedValues = new Set(["Technology", "Heavy industry", "Textile", "Food processing", "Building / construction", "Transport", "Other", "Low", "Moderate", "High", "Substantial"]);
const root = path.resolve("frontend/src");
const files = ["pages", "components", "context"].flatMap(folder => fs.readdirSync(path.join(root, folder)).filter(name => name.endsWith(".jsx")).map(name => path.join(root, folder, name)));
let changed = 0;
for (const file of files) {
  const old = fs.readFileSync(file, "utf8");
  const edits = [];
  walk(parse(old), (node, parent) => {
    if (node.type === "StringLiteral") {
      if (node.value.includes("/i18n/english")) { edits.push({ start: node.start, end: node.end, value: JSON.stringify(node.value.replace("/i18n/english", "/i18n/french")) }); return; }
      if (parent?.key === node || (parent?.type === "JSXAttribute" && !["placeholder", "title", "aria-label", "alt"].includes(parent.name.name))) return;
      if (protectedValues.has(node.value) || /^[A-Z0-9_]+$/.test(node.value)) return;
      const value = dictionary[node.value];
      if (value && value !== node.value) edits.push({ start: node.start, end: node.end, value: JSON.stringify(value) });
    } else if (node.type === "JSXText") {
      const key = node.value.replace(/\s+/g, " ").trim();
      if (dictionary[key] && dictionary[key] !== key) edits.push({ start: node.start, end: node.end, value: node.value.replace(/\S[\s\S]*\S|\S/, dictionary[key]) });
    }
  });
  let next = old;
  for (const edit of edits.sort((a, b) => b.start - a.start)) next = next.slice(0, edit.start) + edit.value + next.slice(edit.end);
  next = next.replaceAll('"en-GB"', '"fr-FR"').replaceAll('"en-US"', '"fr-FR"');
  if (file.endsWith("CollectionControls.jsx")) next = next.replace(', "en",', ', "fr",');
  if (next === old) continue;
  const before = old.replaceAll("\r\n", "\n").split("\n"), after = next.replaceAll("\r\n", "\n").split("\n");
  if (before.length !== after.length) throw new Error("Unexpected line-count change: " + file);
  let patch = "*** Begin Patch\n*** Update File: " + file.replaceAll("\\", "/") + "\n";
  for (let i = 0; i < before.length; i++) if (before[i] !== after[i]) patch += "@@\n-" + before[i] + "\n+" + after[i] + "\n";
  patch += "*** End Patch";
  const result = spawnSync(process.argv[2], ["--codex-run-as-apply-patch", patch], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stdout + result.stderr);
  changed++; console.log(path.relative(process.cwd(), file));
}
console.log("Translated display strings in", changed, "files; API values preserved.");
