import { useEffect, useState } from "react";
import api from "../api/client";
import { t } from "../i18n/french";

const pillars = [["environment", "Environnement"], ["social", "Social"], ["governance", "Gouvernance"]];
const toPercent = (value) => Number((value * 100).toFixed(4));
const toDraft = (sectors) => sectors.map((row) => ({ sector: row.sector, ...Object.fromEntries(pillars.map(([key]) => [key, String(toPercent(row[key]))])) }));

function SectorWeightSettings({ onSaved, onEditingChange }) {
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSettings() {
    const response = await api.get("/scoring/admin/sector-settings");
    setSettings(response.data.data);
    setDraft(toDraft(response.data.data.sectors));
  }
  useEffect(() => { loadSettings().catch((requestError) => setError(requestError.response?.data?.message || "Impossible de charger les pondérations sectorielles.")); }, []);
  useEffect(() => { onEditingChange?.(editing); }, [editing, onEditingChange]);

  const validRow = (row) => pillars.every(([key]) => row[key] !== "" && Number.isFinite(Number(row[key])) && Number(row[key]) >= 0 && Number(row[key]) <= 100)
    && Math.abs(pillars.reduce((sum, [key]) => sum + Number(row[key]), 0) - 100) < 0.0001;
  const hasChanges = settings && JSON.stringify(draft) !== JSON.stringify(toDraft(settings.sectors));
  const valid = draft.length > 0 && draft.every(validRow);

  async function save(event) {
    event.preventDefault();
    if (!valid || !hasChanges) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await api.put("/scoring/admin/sector-settings", {
        expectedVersion: settings.version,
        sectors: draft.map((row) => ({ sector: row.sector, ...Object.fromEntries(pillars.map(([key]) => [key, Number(row[key]) / 100])) })),
      });
      setSettings(response.data.data);
      setDraft(toDraft(response.data.data.sectors));
      setEditing(false);
      setMessage("Pondérations enregistrées. Les bilans existants restent inchangés jusqu’à confirmation du recalcul.");
      onSaved?.();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible d’enregistrer les pondérations sectorielles.");
    } finally { setSaving(false); }
  }

  return (
    <section className="panel stack sector-settings-panel">
      <div className="section-header">
        <div><p className="eyebrow">Paramétrage du scoring</p><h3>Pondérations sectorielles</h3><p className="muted-text">Secteurs prédéfinis et contribution au score ESG global. Chaque ligne doit totaliser 100 %.</p></div>
        {settings && !editing ? <button type="button" className="ghost-button" onClick={() => { setEditing(true); setError(""); setMessage(""); }}>Modifier les pondérations</button> : null}
      </div>
      {settings ? <>
        <p className="muted-text sector-settings-version">Version {settings.revision}{settings.updatedAt ? ` · Mis à jour le ${new Date(settings.updatedAt).toLocaleString("fr-FR")}` : " · Paramètres par défaut"}</p>
        <form className="stack" onSubmit={save}>
          <div className="sector-weight-grid">
            {draft.map((row, index) => (
              <article key={row.sector} className="sector-weight-card">
                <div className="metric-row"><h4>{t(row.sector)}</h4>{row.sector === "Autre" ? <span className="esg-badge esg-pillar-badge">Par défaut</span> : null}</div>
                <div className="sector-weight-pillars">
                  {pillars.map(([key, label]) => <label className="field" key={key}><span>{label}</span>{editing ? <div className="weight-input"><input type="number" min="0" max="100" step="0.01" required disabled={saving} aria-label={`Pondération ${t(row.sector)} — ${label}`} value={row[key]} onChange={(event) => { const value = event.target.value; setDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)); }} /><span>%</span></div> : <strong>{row[key]}<small>%</small></strong>}</label>)}
                </div>
                <div className="sector-weight-bar" aria-hidden="true">{pillars.map(([key]) => <span key={key} className={`weight-${key}`} style={{ flexGrow: Math.max(0, Number(row[key]) || 0) }} />)}</div>
                {editing && !validRow(row) ? <p className="error-text">Saisissez des pondérations valides totalisant 100 %.</p> : null}
              </article>
            ))}
          </div>
          {editing ? <><p className="muted-text">Enregistrez ou annulez vos modifications avant de calculer les bilans.</p><div className="action-row"><button className="primary-button" type="submit" disabled={saving || !valid || !hasChanges}>{saving ? "Enregistrement..." : "Enregistrer le paramétrage"}</button><button className="ghost-button" type="button" disabled={saving} onClick={() => { setDraft(toDraft(settings.sectors)); setEditing(false); setError(""); }}>Annuler</button><button className="ghost-button" type="button" disabled={saving} onClick={() => { setError(""); loadSettings().catch((requestError) => setError(requestError.response?.data?.message || "Impossible de recharger les paramètres.")); }}>Recharger les paramètres enregistrés</button></div></> : null}
        </form>
        {settings.history?.length ? <details className="sector-weight-history"><summary>Historique du paramétrage</summary>{settings.history.slice().reverse().slice(0, 5).map((entry) => <div key={entry.revision} className="stack-tight"><strong>Version {entry.revision} · {new Date(entry.updatedAt).toLocaleString("fr-FR")}</strong>{entry.changes.map((change) => <p key={change.sector}>{t(change.sector)}: E {toPercent(change.previous.environment)}% / S {toPercent(change.previous.social)}% / G {toPercent(change.previous.governance)}% → E {toPercent(change.current.environment)}% / S {toPercent(change.current.social)}% / G {toPercent(change.current.governance)}%</p>)}</div>)}</details> : null}
      </> : !error ? <p className="muted-text">Chargement des pondérations sectorielles...</p> : null}
      {message ? <p className="success-text" role="status">{message}</p> : null}
      {error ? <p className="error-text" role="alert">{t(error)}</p> : null}
    </section>
  );
}

export default SectorWeightSettings;
