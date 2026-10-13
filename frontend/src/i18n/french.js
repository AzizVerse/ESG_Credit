import questionText from "./questionText.json";
import assessmentText from "./assessmentText";
import { translations } from "./english";
import ui from "./french-ui.json";

const normalize = text => text.replace(/\s+/g, " ").trim();
const dictionary = {};
// Recover the original French labels without translating API identifiers or stored data.
for (const [french, english] of Object.entries({ ...questionText, ...assessmentText, ...translations })) {
  if (!/^[A-Z0-9_]+$/.test(french)) dictionary[normalize(english)] = french;
}
Object.assign(dictionary, ui);
const enums = { YES: "Oui", NO: "Non", NA: "N/A", PLANNED: "Prévu", DRAFT: "Brouillon", SUBMITTED: "Soumise", UNDER_REVIEW: "En revue", APPROVED: "Approuvée", REJECTED: "Rejetée", IN_PROGRESS: "En cours", UNDER_APPROVAL: "En cours d’approbation", APPROVED_WITHOUT_RESERVES: "Approuvée sans réserves", APPROVED_WITH_RESERVES: "Approuvée avec réserves", MODERNIZATION: "Modernisation", EXTENSION: "Extension", NEW_PROJECT: "Nouveau projet" };

export function t(text) {
  if (typeof text !== "string") return text;
  const key = normalize(text);
  if (enums[key]) return enums[key];
  if (key === "A_DETERMINER") return "À déterminer";
  if (dictionary[key]) return dictionary[key];
  if (key.startsWith("Requires verification: ")) return "Vérification requise : " + t(key.slice(23));
  if (key.startsWith("IFC eligibility screening prevents ESG calculation")) return "Le contrôle d’éligibilité IFC bloque le calcul du bilan ESG.";
  let match = key.match(/^Missing or duplicate sector: (.+)\.$/);
  if (match) return `Secteur manquant ou en double : ${t(match[1])}.`;
  match = key.match(/^Each weight for (.+) must be between 0% and 100%\.$/);
  if (match) return `Chaque pondération du secteur ${t(match[1])} doit être comprise entre 0 % et 100 %.`;
  match = key.match(/^Weights for (.+) must total 100%\.$/);
  if (match) return `Les pondérations du secteur ${t(match[1])} doivent totaliser 100 %.`;
  const standard = key.match(/^Performance Standard (\d+)(.*)$/);
  if (standard) return `Norme de performance ${standard[1]}${standard[2] ? ` — ${t(standard[2].replace(/^\s*—\s*/, ""))}` : ""}`;
  const block = key.match(/^Block (\d+)(?: — (.+))?$/);
  if (block) return `Bloc ${block[1]}${block[2] ? ` — ${t(block[2])}` : ""}`;
  if (key.includes(". ")) return key.split(/(?<=\.)\s+/).map(sentence => dictionary[sentence] || sentence).join(" ");
  return text;
}
