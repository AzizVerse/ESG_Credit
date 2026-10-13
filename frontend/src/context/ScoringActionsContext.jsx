import { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../api/client";
import { t } from "../i18n/french";

const ScoringActionsContext = createContext(null);

export function ScoringActionsProvider({ children }) {
  const [confirmation, setConfirmation] = useState(null);
  const dialogRef = useRef(null);
  const resolver = useRef(null);

  function finish(confirmed) {
    resolver.current?.(confirmed);
    resolver.current = null;
    setConfirmation(null);
  }
  useEffect(() => {
    if (confirmation) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [confirmation]);
  useEffect(() => () => resolver.current?.(false), []);

  async function calculate({ mode, applicationId }) {
    const response = await api.get("/scoring/admin/calculation-check", { params: { mode, applicationId } });
    const check = response.data.data;
    if (check.requiresConfirmation) {
      if (resolver.current) throw new Error("Un autre calcul est en attente de confirmation.");
      const accepted = await new Promise((resolve) => { resolver.current = resolve; setConfirmation(check); });
      if (!accepted) return null;
    }
    const endpoint = mode === "single" ? `/scoring/applications/${applicationId}/calculate`
      : mode === "missing" ? "/scoring/admin/calculate-missing" : "/scoring/admin/recalculate-all";
    return api.post(endpoint, {
      expectedConfigurationVersion: check.configurationVersion,
      confirmSettingsChange: check.requiresConfirmation,
    });
  }

  return <ScoringActionsContext.Provider value={calculate}>
    {children}
    <dialog ref={dialogRef} className="scoring-confirmation" aria-labelledby="scoring-confirmation-title" aria-describedby="scoring-confirmation-description" onCancel={(event) => { event.preventDefault(); finish(false); }}>
      {confirmation ? <div className="stack">
        <p className="eyebrow">Paramétrage modifié · Version {confirmation.configurationRevision}</p>
        <h2 id="scoring-confirmation-title">Recalculer avec les nouvelles pondérations ?</h2>
        <p id="scoring-confirmation-description">Le paramétrage diffère de celui utilisé pour {confirmation.affectedCount} bilan(s) existant(s). Le recalcul remplacera leurs scores et niveaux de risque avec les pondérations actuelles.</p>
        <p className="muted-text">Secteurs : {confirmation.changedSectors.map(t).join(", ")}</p>
        <div className="action-row"><button className="ghost-button" type="button" autoFocus onClick={() => finish(false)}>Annuler</button><button className="primary-button" type="button" onClick={() => finish(true)}>Confirmer le recalcul</button></div>
      </div> : null}
    </dialog>
  </ScoringActionsContext.Provider>;
}

export function useScoringCalculation() {
  const calculate = useContext(ScoringActionsContext);
  if (!calculate) throw new Error("ScoringActionsProvider is required.");
  return calculate;
}
