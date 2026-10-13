import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { screeningLabel } from "./ExclusionScreening";
import { t } from "../i18n/french";

const scopeLabels = {
  STANDARD_FI: "Financement bancaire classique",
  MICROFINANCE: "Microfinance",
  TRADE_FINANCE: "Financement du commerce international",
};

export default function ExclusionOverview({ full = false }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("EXCLUDED");

  useEffect(() => {
    let active = true;
    api.get("/exclusions/admin/summary")
      .then(response => { if (active) setData(response.data.data); })
      .catch(() => { if (active) setError("Impossible de charger les statistiques d’exclusion."); });
    return () => { active = false; };
  }, []);

  const applications = data?.applications.filter(row =>
    (row.screening?.outcome || "NOT_SCREENED") === filter
  ) || [];

  return (
    <section className="panel stack ifc-overview">
      <div className="section-header">
        <div><p className="eyebrow">Contrôle d’éligibilité</p><h3>Exclusions IFC</h3></div>
        {!full ? <Link className="ghost-button" to="/admin/exclusions">Voir les demandes exclues</Link> : null}
      </div>
      {error ? <p className="error-text" role="alert">{error}</p> : null}
      {!data && !error ? <p>Chargement des statistiques d’éligibilité...</p> : null}
      {data ? (
        <>
          <div className="ifc-summary-strip">
            <div className="ifc-summary-excluded">
              <span className="ifc-summary-number">{data.byOutcome.EXCLUDED}</span>
              <div><strong>Exclue selon la politique IFC</strong><p>Activités exclues du financement selon la politique IFC.</p></div>
            </div>
            <div className="ifc-summary-pending"><span>Non contrôlée</span><strong>{data.byOutcome.NOT_SCREENED}</strong></div>
          </div>
          {full ? (
            <>
              <div className="ifc-list-toolbar">
                <label className="field"><span>Résultat du contrôle</span>
                  <select value={filter} onChange={event => setFilter(event.target.value)}>
                    {Object.keys(data.byOutcome).map(key => <option key={key} value={key}>{screeningLabel(key)}</option>)}
                  </select>
                </label>
                <span className="muted-text">{applications.length} demande{applications.length === 1 ? "" : "s"}</span>
              </div>
              <div className="ifc-case-list">
                {applications.map(row => (
                  <article className={`ifc-case ${row.screening?.outcome === "EXCLUDED" ? "ifc-case-excluded" : ""}`} key={row.id}>
                    <header className="ifc-case-header">
                      <div><h4>{row.projectName}</h4><p>{row.companyName}</p></div>
                      <span className={`status-badge ${row.screening?.outcome === "EXCLUDED" ? "ifc-excluded" : ""}`}>{screeningLabel(row.screening?.outcome)}</span>
                    </header>
                    {row.screening?.reasons?.length ? (
                      <div className="ifc-case-reason">
                        <p className="eyebrow">{row.screening.outcome === "EXCLUDED" ? "Motif d’exclusion" : "Constats du contrôle"}</p>
                        <ul>{row.screening.reasons.map(reason => <li key={reason.id}>{t(reason.label)}</li>)}</ul>
                      </div>
                    ) : <p className="muted-text">{row.screening ? "Aucune exclusion enregistrée pour ce résultat de contrôle." : "Le contrôle d’éligibilité n’a pas été effectué."}</p>}
                    <footer className="ifc-case-footer">
                      <div className="ifc-case-meta">
                        {row.screening ? <>
                          <span>{scopeLabels[row.screening.scope] || row.screening.scope}</span>
                          <time dateTime={row.screening.screenedAt}>{new Date(row.screening.screenedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</time>
                          <details><summary>Détails de la politique</summary><p>{row.screening.policyVersion}</p></details>
                        </> : <span>Demande existante : l’éligibilité n’est pas établie.</span>}
                      </div>
                      <Link className="ghost-button" to={`/admin/applications/${row.id}`}>Examiner<span aria-hidden="true"> &gt;</span></Link>
                    </footer>
                  </article>
                ))}
                {!applications.length ? <p className="muted-text">Aucune demande dans ce groupe.</p> : null}
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
