import { useEffect, useState } from "react";
import api from "../api/client";
import { t } from "../i18n/french";
import { exclusionQuestions } from "./exclusionQuestions";

export const screeningLabel = (outcome) => ({ EXCLUDED: "Exclue selon la politique IFC", REVIEW_REQUIRED: "Vérification de l’éligibilité requise", NO_EXCLUSION_DECLARED: "Aucune exclusion déclarée", NOT_SCREENED: "Non contrôlée" }[outcome] || "Non contrôlée");
const scopes = { STANDARD_FI: "Financement bancaire classique", MICROFINANCE: "Microfinance", TRADE_FINANCE: "Financement du commerce international" };

export default function ExclusionScreening({ application, admin = false, onSaved }) {
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [scope, setScope] = useState("STANDARD_FI");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const editable = application.status === "DRAFT" || (admin && ["SUBMITTED", "UNDER_REVIEW"].includes(application.status));
  useEffect(() => {
    let active = true;
    api.get(`/exclusions/applications/${application.id}`).then(response => {
      if (!active) return;
      setData(response.data.data);
      setAnswers(response.data.data.screening?.answers || {});
      setScope(response.data.data.screening?.scope || "STANDARD_FI");
    }).catch(e => { if (active) setError(e.response?.data?.message || "Impossible de charger le contrôle d’éligibilité."); });
    return () => { active = false; };
  }, [application.id, application.status]);
  async function save(nextScope = scope, scopeOnly = false) {
    setBusy(true); setError(""); setMessage("");
    try {
      await api.put(`/exclusions/applications/${application.id}`, { scope: nextScope, ...(scopeOnly ? {} : { answers }) });
      const response = await api.get(`/exclusions/applications/${application.id}`);
      setData(response.data.data); setAnswers(response.data.data.screening?.answers || {}); setScope(nextScope);
      setMessage("Contrôle enregistré. Une exclusion confirmée entraîne le refus automatique d’une demande soumise.");
      await onSaved?.();
    } catch (e) { setError(e.response?.data?.message || "Impossible d’enregistrer le contrôle."); }
    finally { setBusy(false); }
  }
  const completed = data?.rules.filter(rule => ["YES", "NO", "UNKNOWN"].includes(answers[rule.id])).length || 0;
  const dirty = data?.rules.some(rule => answers[rule.id] !== data.screening?.answers?.[rule.id]);
  return <section className="panel stack ifc-screening esg-exclusion-filter">
    <div className="section-header"><div><p className="eyebrow">Avant de soumettre votre demande</p><h3>Filtre d’exclusion ESG</h3></div><span className={`status-badge ${data?.screening?.outcome === "EXCLUDED" ? "ifc-excluded" : ""}`}>{!data?.screening || data.screening.outcome === "NOT_SCREENED" ? "À compléter" : screeningLabel(data.screening.outcome)}</span></div>
    <div className="exclusion-intro"><p>Vérifiez si votre entreprise ou votre projet exerce une activité exclue du financement.</p><p>Pour chaque question, choisissez <strong>Oui</strong>, <strong>Non</strong> ou <strong>Je ne sais pas</strong>. Lisez les précisions avant de répondre. Une exclusion confirmée entraîne le refus automatique de la demande soumise, indépendamment du score ESG.</p></div>
    {application.status === "REJECTED" && data?.screening?.outcome === "EXCLUDED" ? <p className="error-text" role="alert">Refus automatique : une activité exclue a été déclarée.</p> : null}
    {admin && editable ? <label className="field exclusion-scope"><span>Type de financement applicable</span><select disabled={busy || dirty} value={scope} onChange={e => save(e.target.value, true)}>{Object.entries(scopes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{dirty ? <small>Enregistrez vos réponses avant de changer le type de financement.</small> : null}</label> : <p className="exclusion-scope-note"><span>Type de financement</span><strong>{scopes[scope]}</strong></p>}
    {error ? <p className="error-text" role="alert">{t(error)}</p> : null}
    {data ? <>
      <div className="exclusion-completion"><div><strong>{completed} / {data.rules.length} réponses</strong><span>{dirty ? "Modifications non enregistrées" : completed < data.rules.length ? "Répondez à toutes les questions avant la soumission." : "Toutes les questions sont renseignées."}</span></div><progress aria-label="Avancement du filtre d’exclusion ESG" value={completed} max={Math.max(1, data.rules.length)} /></div>
      <details className="exclusion-declarations" open={!data.screening || editable}><summary>Questions d’éligibilité</summary><div className="exclusion-question-list">{data.rules.map((rule, index) => {
        const wording = exclusionQuestions[rule.id];
        return <fieldset className="exclusion-question" key={rule.id} disabled={!editable || busy}>
          <legend><span className="exclusion-question-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{wording?.title || t(rule.label)}</legend>
          {wording ? <p className="exclusion-question-hint" id={`exclusion-hint-${application.id}-${rule.id}`}>{wording.hint}</p> : null}
          <div className="assessment-choices exclusion-answer-options">{[["NO", "Non"], ["YES", "Oui"], ["UNKNOWN", "Je ne sais pas"]].map(([value, label]) => <label key={value} className="assessment-choice"><input type="radio" name={`exclusion-${application.id}-${rule.id}`} value={value} checked={answers[rule.id] === value} aria-describedby={wording ? `exclusion-hint-${application.id}-${rule.id}` : undefined} onChange={() => { setAnswers(current => ({ ...current, [rule.id]: value })); setMessage(""); }} /><span>{label}</span></label>)}</div>
          <details className="exclusion-rule-details"><summary>Consulter le critère complet</summary><p>{t(rule.label)}</p></details>
        </fieldset>;
      })}</div></details>
    </> : <p className="muted-text">Chargement du filtre...</p>}
    {data?.screening?.reasons?.length ? <ul>{data.screening.reasons.map(reason => <li key={reason.id}>{t(reason.label)}</li>)}</ul> : null}
    {editable ? <div className="exclusion-save-row"><div><strong>Vous pouvez enregistrer et reprendre plus tard.</strong><p>« Je ne sais pas » déclenche une vérification, pas un refus automatique.</p></div><button className="primary-button" type="button" disabled={busy || !data} onClick={() => save()}>{busy ? "Enregistrement..." : "Enregistrer mes réponses"}</button></div> : null}
    {message ? <p role="status">{message}</p> : null}
    {admin && data?.events?.length ? <details><summary>Historique du contrôle ({data.events.length})</summary><ul>{data.events.map(event => <li key={event.id}>{new Date(event.createdAt).toLocaleString("fr-FR")} - {({ AUTO_REFUSED: "Refus automatique", DECLARATIONS_SAVED: "Déclarations enregistrées", SUBMISSION_SCREENED: "Contrôle à la soumission", DEMO_DECLARATIONS_SEEDED: "Déclarations de démonstration" })[event.action] || "Événement du contrôle"} - {screeningLabel(event.snapshot.outcome)} - {scopes[event.snapshot.scope]} - {event.snapshot.policyVersion}</li>)}</ul></details> : null}
    <details className="exclusion-policy-note"><summary>Référentiel et informations réglementaires</summary><p>Ce filtre s’appuie sur la <a href={data?.sourceUrl || "https://www.ifc.org/exclusionlist"} target="_blank" rel="noreferrer">liste officielle des exclusions IFC</a>. Aucune dérogation automatique n’est accordée. Ce filtre déclaratif ne constitue ni une certification IFC ni une vérification juridique.</p><p className="muted-text">Version : {data?.policyVersion || "Chargement..."}</p></details>
  </section>;
}
