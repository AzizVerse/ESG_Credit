import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/client";
import Layout from "../components/Layout";

const initialForm = {
  legalName: "",
  address: "",
  zoneType: "URBAN",
  isIndustrialZone: "",
  contactName: "",
  contactPosition: "",
  creationDate: "",
  totalSurface: "",
  coveredSurface: "",
  projectNature: "MODERNIZATION",
  activitySector: "",
  projectDescription: "",
  financingAmount: "",
};

function NewApplicationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function getEnterpriseErrorMessage(requestError) {
    const message =
      requestError.response?.data?.message || requestError.message || "";
    return message === "Access denied"
      ? "Vous n’êtes pas autorisé à accéder à cette ressource."
      : message || "Création de la demande impossible.";
  }

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function uploadProjectProfileFiles(applicationId) {
    if (!files.length) {
      return;
    }

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", "PROJECT_PROFILE");
      await api.post(`/applications/my/${applicationId}/attachments`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/applications", {
        ...form,
        isIndustrialZone:
          form.isIndustrialZone === "true"
            ? true
            : form.isIndustrialZone === "false"
              ? false
              : null,
        totalSurface: form.totalSurface === "" ? "" : Number(form.totalSurface),
        coveredSurface: form.coveredSurface === "" ? "" : Number(form.coveredSurface),
        financingAmount: Number(form.financingAmount),
      });

      const applicationId = response.data.data.id;
      await uploadProjectProfileFiles(applicationId);

      navigate(`/enterprise/applications/${applicationId}`, { replace: true });
    } catch (requestError) {
      setError(getEnterpriseErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout
      title="Créer une demande"
      subtitle="Renseignez les informations de base du projet avant de compléter l’évaluation SGES."
    >
      <section className="panel form-panel stack">
        <div>
          <h3>Signalétique du projet</h3>
          <p className="muted-text">
            Renseignez la signalétique du projet.
          </p>
        </div>

        <form className="stack" onSubmit={handleSubmit}>
          <section className="form-section-card stack">
            <h4>1. Identification du projet</h4>
            <label className="field">
              <span>I.1 - Nom ou raison sociale du projet</span>
              <input name="legalName" value={form.legalName} onChange={handleChange} required />
            </label>
            <label className="field">
              <span>I.7 - Secteur d’activité</span>
              <input
                name="activitySector"
                value={form.activitySector}
                onChange={handleChange}
                required
              />
            </label>
            <label className="field">
              <span>Descriptif du projet</span>
              <textarea
                rows="4"
                name="projectDescription"
                value={form.projectDescription}
                onChange={handleChange}
              />
            </label>
          </section>

          <section className="form-section-card stack">
            <h4>2. Localisation</h4>
            <label className="field">
              <span>I.2 - Adresse</span>
              <input name="address" value={form.address} onChange={handleChange} required />
            </label>

            <fieldset className="field">
              <legend>Description de la zone d’implantation du projet</legend>
              <div className="choice-grid">
                <label className="choice-card">
                  <input
                    type="radio"
                    name="zoneType"
                    value="URBAN"
                    checked={form.zoneType === "URBAN"}
                    onChange={handleChange}
                  />
                  <span>Zone urbaine</span>
                </label>
                <label className="choice-card">
                  <input
                    type="radio"
                    name="zoneType"
                    value="PERI_URBAN"
                    checked={form.zoneType === "PERI_URBAN"}
                    onChange={handleChange}
                  />
                  <span>Zone péri-urbaine</span>
                </label>
                <label className="choice-card">
                  <input
                    type="radio"
                    name="zoneType"
                    value="RURAL"
                    checked={form.zoneType === "RURAL"}
                    onChange={handleChange}
                  />
                  <span>Zone rurale</span>
                </label>
              </div>
            </fieldset>

            <fieldset className="field">
              <legend>Est-ce que le projet est situé dans une zone industrielle ?</legend>
              <div className="choice-grid choice-grid-two">
                <label className="choice-card">
                  <input
                    type="radio"
                    name="isIndustrialZone"
                    value="true"
                    checked={form.isIndustrialZone === "true"}
                    onChange={handleChange}
                    required
                  />
                  <span>Oui</span>
                </label>
                <label className="choice-card">
                  <input
                    type="radio"
                    name="isIndustrialZone"
                    value="false"
                    checked={form.isIndustrialZone === "false"}
                    onChange={handleChange}
                  />
                  <span>Non</span>
                </label>
              </div>
            </fieldset>
          </section>

          <section className="form-section-card stack">
            <h4>3. Responsable / interlocuteur</h4>
            <label className="field">
              <span>I.3 - Nom du responsable/interlocuteur</span>
              <input name="contactName" value={form.contactName} onChange={handleChange} />
            </label>
            <label className="field">
              <span>Position du responsable/interlocuteur</span>
              <input name="contactPosition" value={form.contactPosition} onChange={handleChange} />
            </label>
          </section>

          <section className="form-section-card stack">
            <h4>4. Caractéristiques du projet</h4>
            <label className="field">
              <span>I.4 - Date de création</span>
              <input
                type="date"
                name="creationDate"
                value={form.creationDate}
                onChange={handleChange}
              />
            </label>
            <label className="field">
              <span>I.5 - Superficie totale en m²</span>
              <input
                type="number"
                name="totalSurface"
                value={form.totalSurface}
                onChange={handleChange}
                min="0"
              />
            </label>
            <label className="field">
              <span>Superficie couverte en m²</span>
              <input
                type="number"
                name="coveredSurface"
                value={form.coveredSurface}
                onChange={handleChange}
                min="0"
              />
            </label>

            <fieldset className="field">
              <legend>I.6 - Type de projet</legend>
              <div className="choice-grid">
                <label className="choice-card">
                  <input
                    type="radio"
                    name="projectNature"
                    value="MODERNIZATION"
                    checked={form.projectNature === "MODERNIZATION"}
                    onChange={handleChange}
                  />
                  <span>Modernisation / mise à niveau</span>
                </label>
                <label className="choice-card">
                  <input
                    type="radio"
                    name="projectNature"
                    value="EXTENSION"
                    checked={form.projectNature === "EXTENSION"}
                    onChange={handleChange}
                  />
                  <span>Extension</span>
                </label>
                <label className="choice-card">
                  <input
                    type="radio"
                    name="projectNature"
                    value="NEW_PROJECT"
                    checked={form.projectNature === "NEW_PROJECT"}
                    onChange={handleChange}
                  />
                  <span>Nouveau projet</span>
                </label>
              </div>
            </fieldset>
          </section>

          <section className="form-section-card stack">
            <h4>5. Financement</h4>
            <label className="field">
              <span>Montant du financement</span>
              <input
                type="number"
                name="financingAmount"
                value={form.financingAmount}
                onChange={handleChange}
                required
                min="0"
              />
            </label>
          </section>

          <section className="form-section-card stack">
            <h4>6. Pièces justificatives</h4>
            <p className="muted-text">
              Si possible, ajoutez les éléments justificatifs liés à la signalétique du projet.
            </p>
            <label className="field">
              <span>Pièces justificatives</span>
              <input
                type="file"
                multiple
                onChange={(event) => setFiles(Array.from(event.target.files || []))}
              />
            </label>
          </section>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Création en cours..." : "Créer la demande"}
          </button>
        </form>
      </section>
    </Layout>
  );
}

export default NewApplicationPage;
