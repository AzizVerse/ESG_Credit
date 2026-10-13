const POLICY_VERSION = "EQUORA_IFC_2007_WEB_2026-10_V1";
const SOURCE_URL = "https://www.ifc.org/en/what-we-do/sector-expertise/sustainability/ifc-exclusion-list-2007";
const SCOPES = ["STANDARD_FI", "MICROFINANCE", "TRADE_FINANCE"];
// These are qualified declarations, not keyword matches or legal determinations.
const RULES = [
  { id: "illegal", label: "Production or trade in activities/products confirmed illegal or internationally banned, including prohibited pharmaceuticals, pesticides, ozone-depleting substances, PCBs or unlawful CITES-regulated wildlife trade." },
  { id: "weapons", label: "Production or trade in weapons or munitions, with substantial involvement (not ancillary to primary operations)." },
  { id: "alcohol", label: "Production or trade in alcoholic beverages other than beer and wine, with substantial involvement." },
  { id: "tobacco", label: "Production or trade in tobacco, with substantial involvement." },
  { id: "gambling", label: "Gambling, casinos or equivalent enterprises, with substantial involvement." },
  { id: "asbestos", label: "Production or trade in unbonded asbestos fibres. The exception for purchase/use of bonded asbestos cement sheeting below 20% asbestos does not trigger this item." },
  { id: "driftnets", label: "Marine drift-net fishing using nets longer than 2.5 km." },
  { id: "forcedLabor", label: "Harmful or exploitative forced labour: involuntary work extracted under threat of force or penalty." },
  { id: "childLabor", label: "Harmful child labour: exploitative, hazardous, harmful to development or interfering with education." },
  { id: "primaryForest", scopes: ["STANDARD_FI"], label: "Commercial logging operations in primary tropical moist forests." },
  { id: "unsustainableWood", scopes: ["STANDARD_FI"], label: "Production or trade in wood or forestry products from forests not sustainably managed." },
  { id: "hazardousChemicals", scopes: ["MICROFINANCE"], label: "Significant-volume production, trade, storage or transport, or commercial-scale use of hazardous chemicals, including gasoline, kerosene and other petroleum products." },
  { id: "indigenousConsent", scopes: ["MICROFINANCE"], label: "Activities impinging on Indigenous Peoples' owned or adjudicated claimed lands without full documented consent." },
];
function applicableRules(scope) {
  if (!SCOPES.includes(scope)) throw new Error("Invalid financing scope");
  return RULES.filter(rule => !rule.scopes || rule.scopes.includes(scope));
}
function evaluate(scope, answers) {
  const rules = applicableRules(scope);
  const reasons = rules.filter(rule => answers[rule.id] === "YES").map(({ id, label }) => ({ id, label }));
  const incomplete = rules.some(rule => !["YES", "NO", "UNKNOWN"].includes(answers[rule.id]));
  const uncertain = rules.some(rule => answers[rule.id] === "UNKNOWN");
  const outcome = reasons.length ? "EXCLUDED" : incomplete ? "NOT_SCREENED" : uncertain ? "REVIEW_REQUIRED" : "NO_EXCLUSION_DECLARED";
  return { outcome, reasons: outcome === "REVIEW_REQUIRED" ? rules.filter(rule => answers[rule.id] === "UNKNOWN").map(({ id, label }) => ({ id, label: "Requires verification: " + label })) : reasons };
}
async function evaluateApplication(tx, applicationId, scope, answers) {
  const result = evaluate(scope, answers);
  if (["EXCLUDED", "NOT_SCREENED"].includes(result.outcome)) return result;
  const evidence = await tx.questionnaireAnswer.findMany({ where: { applicationId, questionCode: { in: ["NP2_HR_Q003", "NP2_HR_Q004"] } } });
  // Employment of children alone does not establish harmful child labour.
  for (const answer of evidence) {
    const id = answer.questionCode === "NP2_HR_Q004" ? "forcedLabor" : "childLabor";
    if (["YES", "OUI", "TRUE"].includes(answer.answerValue.toUpperCase()) && answers[id] === "NO") {
      result.outcome = "REVIEW_REQUIRED";
      result.reasons.push({ id, label: "Labour screening conflicts with an existing workforce answer; verification is required." });
    }
  }
  return result;
}
module.exports = { POLICY_VERSION, SOURCE_URL, SCOPES, RULES, applicableRules, evaluate, evaluateApplication };
