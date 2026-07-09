import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client";
import Layout from "../components/Layout";

const SUPPORTED_SECTORS = [
  "Services bancaires / FI",
  "Industrie lourde",
  "Textile",
  "Agroalimentaire",
  "BTP / construction",
  "Transport",
  "Autre",
];

function getStatusLabel(status) {
  const labels = {
    DRAFT: "Brouillon",
    SUBMITTED: "Soumise",
    UNDER_REVIEW: "En revue",
    APPROVED: "Approuvée",
    REJECTED: "Rejetée",
  };

  return labels[status] || status || "-";
}

function formatScore(value) {
  return typeof value === "number" ? value.toFixed(2) : "-";
}

function formatAmount(value) {
  return typeof value === "number"
    ? new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)
    : "-";
}

function normalizeRiskClass(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

function normalizeCategoryClass(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace("+", "plus")
    .replace(/[^a-z]/g, "");
}

function AdminApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [calculatingId, setCalculatingId] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    category: "",
    riskLevel: "",
    sector: "",
  });

  async function loadApplications() {
    const response = await api.get("/applications");
    setApplications(response.data.data || []);
  }

  useEffect(() => {
    async function load() {
      try {
        await loadApplications();
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Chargement des demandes ESG impossible."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          applications
            .map((application) => application.esgAssessmentResult?.categoryAuto || application.categoryAuto)
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, "fr")),
    [applications]
  );

  const riskOptions = useMemo(
    () =>
      Array.from(
        new Set(
          applications
            .map((application) => application.esgAssessmentResult?.riskLevel)
            .filter(Boolean)
        )
      ),
    [applications]
  );

  const sectorOptions = SUPPORTED_SECTORS;

  const filteredApplications = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return applications.filter((application) => {
      const companyName = application.company?.name || "";
      const projectName = application.projectName || "";
      const category = application.esgAssessmentResult?.categoryAuto || application.categoryAuto || "";
      const riskLevel = application.esgAssessmentResult?.riskLevel || "";
      const sector = application.esgAssessmentResult?.sectorWeights?.sector || "";
      const haystack = `${companyName} ${projectName}`.toLowerCase();

      return (
        (!filters.status || application.status === filters.status) &&
        (!filters.category || category === filters.category) &&
        (!filters.riskLevel || riskLevel === filters.riskLevel) &&
        (!filters.sector || sector === filters.sector) &&
        (!search || haystack.includes(search))
      );
    });
  }, [applications, filters]);

  function handleFilterChange(event) {
    setFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleCalculate(applicationId) {
    try {
      setCalculatingId(applicationId);
      setActionMessage("");
      await api.post(`/scoring/applications/${applicationId}/calculate`);
      await loadApplications();
      setActionMessage("Bilan ESG calculé avec succès.");
    } catch (requestError) {
      setActionMessage(
        requestError.response?.data?.message || "Calcul du bilan ESG impossible."
      );
    } finally {
      setCalculatingId("");
    }
  }

  return (
    <Layout
      title="Demandes ESG"
      subtitle="Vue opérationnelle des dossiers, des résultats ESG calculés et des actions d’examen."
      actions={
        <Link to="/admin" className="ghost-button">
          Retour au tableau de bord
        </Link>
      }
    >
      <section className="panel stack">
        <div className="section-header">
          <div>
            <h3>Liste des demandes</h3>
            <p className="muted-text">
              Filtrez par statut, catégorie, risque, secteur ou recherche libre.
            </p>
          </div>
        </div>

        <div className="filters-grid filters-grid-wide">
          <label className="field">
            <span>Recherche</span>
            <input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Projet ou entreprise"
            />
          </label>

          <label className="field">
            <span>Statut</span>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">Tous</option>
              <option value="DRAFT">Brouillon</option>
              <option value="SUBMITTED">Soumise</option>
              <option value="UNDER_REVIEW">En revue</option>
              <option value="APPROVED">Approuvée</option>
              <option value="REJECTED">Rejetée</option>
            </select>
          </label>

          <label className="field">
            <span>Catégorie SGES</span>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">Toutes</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Niveau de risque</span>
            <select name="riskLevel" value={filters.riskLevel} onChange={handleFilterChange}>
              <option value="">Tous</option>
              {riskOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Secteur</span>
            <select name="sector" value={filters.sector} onChange={handleFilterChange}>
              <option value="">Tous</option>
              {sectorOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        {actionMessage ? <p className="muted-text">{actionMessage}</p> : null}
        {loading ? <p className="muted-text">Chargement des demandes...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {!loading ? (
          <div className="applications-card-list applications-card-list-visible">
            {filteredApplications.map((application) => {
              const result = application.esgAssessmentResult;
              const sector = result?.sectorWeights?.sector || "-";
              const category = result?.categoryAuto || application.categoryAuto || "-";

              return (
                <article key={`card-${application.id}`} className="panel admin-list-card application-card">
                  <div className="admin-list-main">
                    <div className="stack-tight">
                      <h3 className="application-card-title cell-clamp-2" title={application.projectName}>
                        {application.projectName}
                      </h3>
                      <p className="muted-text cell-clamp-2" title={application.company?.name || "-"}>
                        {application.company?.name || "-"}
                      </p>
                    </div>
                    <div className="action-row">
                      <span className={`status-badge status-${application.status?.toLowerCase()}`}>
                        {getStatusLabel(application.status)}
                      </span>
                    </div>
                  </div>

                  <div className="admin-list-meta">
                    <div className="metric-row">
                      <span className="muted-text">Catégorie SGES</span>
                      <span className={`esg-badge category-badge esg-category-${normalizeCategoryClass(category)}`}>
                        {category}
                      </span>
                    </div>
                    <div className="metric-row">
                      <span className="muted-text">Risque</span>
                      {result?.riskLevel ? (
                        <span className={`esg-badge risk-badge esg-risk-${normalizeRiskClass(result.riskLevel)}`}>
                          {result.riskLevel}
                        </span>
                      ) : (
                        <span className="status-badge status-draft">Bilan non calculé</span>
                      )}
                    </div>
                    <div className="metric-row">
                      <span className="muted-text">Score global</span>
                      <span className="score-pill">{formatScore(result?.globalScore)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="muted-text">Type de projet</span>
                      <strong className="cell-clamp-2" title={application.projectType || "-"}>
                        {application.projectType || "-"}
                      </strong>
                    </div>
                    <div className="metric-row">
                      <span className="muted-text">Montant</span>
                      <strong>{formatAmount(application.financingAmount)}</strong>
                    </div>
                    <div className="metric-row">
                      <span className="muted-text">Date</span>
                      <strong>{new Date(application.createdAt).toLocaleDateString("fr-FR")}</strong>
                    </div>
                    <div className="metric-row">
                      <span className="muted-text">Secteur</span>
                      <strong className="cell-clamp-2" title={sector}>{sector}</strong>
                    </div>
                  </div>

                  <div className="admin-list-side">
                    <div className="action-row">
                      <Link to={`/admin/applications/${application.id}`} className="ghost-button">
                        Examiner
                      </Link>
                      {!result ? (
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={calculatingId === application.id}
                          onClick={() => handleCalculate(application.id)}
                        >
                          {calculatingId === application.id ? "Calcul..." : "Calculer"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
            {!filteredApplications.length ? (
              <article className="panel">
                <p className="empty-cell">Aucune demande ne correspond aux filtres.</p>
              </article>
            ) : null}
          </div>
        ) : null}
      </section>
    </Layout>
  );
}

export default AdminApplicationsPage;


