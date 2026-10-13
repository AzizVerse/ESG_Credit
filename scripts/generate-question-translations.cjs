const fs = require("node:fs");
const parser = require("@babel/parser");

function visit(node, callback, parent = null) {
  if (!node || typeof node !== "object") return;
  callback(node, parent);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((child) => visit(child, callback, node));
    else if (value && typeof value === "object") visit(value, callback, node);
  }
}

function parse(source) {
  return parser.parse(source, { sourceType: "unambiguous", plugins: ["jsx"] });
}

function readMap(path, name) {
  const map = {};
  visit(parse(fs.readFileSync(path, "utf8")), (node) => {
    if (node.type !== "VariableDeclarator" || node.id.name !== name) return;
    for (const property of node.init.properties) {
      map[property.key.name || property.key.value] = property.value.value;
    }
  });
  return map;
}

// Extract canonical French labels without executing the database seed.
const questions = readMap("frontend/src/i18n/questionLabels.js", "questionLabels");
const questionText = {};
const foundCodes = new Set();
visit(parse(fs.readFileSync("prisma/seed.js", "utf8")), (node) => {
  if (node.type !== "ObjectExpression") return;
  const props = Object.fromEntries(node.properties.filter((p) => p.type === "ObjectProperty").map((p) => [p.key.name || p.key.value, p.value]));
  const code = props.code?.value;
  if (code && props.label?.type === "StringLiteral" && questions[code]) {
    questionText[props.label.value] = questions[code];
    foundCodes.add(code);
  }
  for (const [key, value] of Object.entries(props)) {
    if (questions[key] && value.type === "StringLiteral") {
      questionText[value.value] = questions[key];
      foundCodes.add(key);
    }
  }
});
const missing = Object.keys(questions).filter((code) => !foundCodes.has(code));
if (missing.length) throw new Error(`Question labels not found: ${missing.join(", ")}`);
fs.writeFileSync("frontend/src/i18n/questionText.json", JSON.stringify(questionText, null, 2) + "\n");

console.log(`Mapped ${foundCodes.size} questionnaire labels without executing the database seed.`);
