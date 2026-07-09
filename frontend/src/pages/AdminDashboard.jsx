import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../api/client";
import Layout from "../components/Layout";

const RISK_COLORS = {
  Faible: "#0d6a5f",
  "Modéré": "#0f8f83",
  Substantiel: "#d97706",
  "Élevé": "#b42318",
};

const CATEGORY_COLORS = ["#8f1d1d", "#c96a12", "#235b88", "#0d6a5f", "#45338d", "#6b7280"];

function formatScore(value) {
  return typeof value === "number" ? value.toFixed(2) : "-";
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

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  async function loadSummary() {
    const response = await api.get("/scoring/admin/dashboard-summary");
    setSummary(response.data.data || null);
  }

  useEffect(() => {
    async function load() {
      try {
        await loadSummary();
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Chargement du tableau de bord impossible."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const metrics = useMemo(() => {
    if (!summary) {
      return [];
    }

    return [
      { label: "Total demandes", value: summary.totalApplications || 0 },
      { label: "Bilans ESG calculés", value: summary.totalCalculatedResults || 0 },
      { label: "Bilans manquants", value: summary.missingResults || 0 },
      { label: "Risque élevé", value: summary.byRiskLevel?.["Élevé"] || 0 },
      { label: "Risque substantiel", value: summary.byRiskLevel?.Substantiel || 0 },
      { label: "Score ESG moyen", value: formatScore(summary.averageScores?.global) },
    ];
  }, [summary]);

  const riskData = useMemo(
    () =>
      Object.entries(summary?.byRiskLevel || {}).map(([name, value]) => ({
        name,
        value,
      })),
    [summary]
  );

  const categoryData = useMemo(
    () =>
      Object.entries(summary?.byCategory || {}).map(([name, value]) => ({
        name,
        value,
      })),
    [summary]
  );

  const scoreData = useMemo(
    () => [
      { name: "Environnement", value: summary?.averageScores?.environment || 0 },
      { name: "Social", value: summary?.averageScores?.social || 0 },
      { name: "Gouvernance", value: summary?.averageScores?.governance || 0 },
      { name: "Global", value: summary?.averageScores?.global || 0 },
    ],
    [summary]
  );

  const sectorData = useMemo(
    () =>
      Object.entries(summary?.bySector || {})
        .map(([name, value]) => ({ name, value }))
        .sort((left, right) => right.value - left.value),
    [summary]
  );

  async function handleBatchAction(type) {
    try {
      setActionLoading(type);
      setActionMessage("");
      const endpoint =
        type === "missing"
          ? "/scoring/admin/calculate-missing"
          : "/scoring/admin/recalculate-all";
      const response = await api.post(endpoint);
      const data = response.data.data || {};

      if (type === "missing") {
        setActionMessage(`${data.calculated || 0} bilans calculés avec succès.`);
      } else {
        setActionMessage(`${data.recalculated || 0} bilans recalculés avec succès.`);
      }

      await loadSummary();
    } catch (requestError) {
      setActionMessage(
        requestError.response?.data?.message ||
          "Opération de calcul impossible."
      );
    } finally {
      setActionLoading("");
    }
  }

  return (
    <Layout
      title="Tableau de bord"
      subtitle="Vue exécutive des expositions ESG, des catégories SGES et des priorités de revue."
      actions={
        <div className="topbar-actions">
          <Link to="/admin/applications" className="ghost-button">
            Voir les demandes ESG
          </Link>
          <Link to="/admin/enterprise-accounts/new" className="primary-button">
            Créer un compte entreprise
          </Link>
        </div>
      }
    >
      <section className="stack">
        <div className="dashboard-action-row">
          <button
            type="button"
            className="secondary-button"
            disabled={actionLoading === "missing"}
            onClick={() => handleBatchAction("missing")}
          >
            {actionLoading === "missing"
              ? "Calcul en cours..."
              : "Calculer les bilans manquants"}
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={actionLoading === "all"}
            onClick={() => handleBatchAction("all")}
          >
            {actionLoading === "all"
              ? "Recalcul en cours..."
              : "Recalculer tous les bilans"}
          </button>
        </div>

        {actionMessage ? <p className="muted-text">{actionMessage}</p> : null}
        {loading ? <p className="muted-text">Chargement du tableau de bord...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {summary ? (
          <>
            <div className="metric-grid metric-grid-admin">
              {metrics.map((metric) => (
                <article key={metric.label} className="metric-card">
                  <p className="metric-label">{metric.label}</p>
                  <strong className="metric-value">{metric.value}</strong>
                </article>
              ))}
            </div>

            <div className="dashboard-chart-grid">
              <article className="panel stack chart-card">
                <div>
                  <h3>Répartition par niveau de risque</h3>
                  <p className="muted-text">Faible, Modéré, Substantiel et Élevé.</p>
                </div>
                <div className="chart-shell">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={riskData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
                        {riskData.map((entry) => (
                          <Cell key={entry.name} fill={RISK_COLORS[entry.name] || "#6b7280"} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="panel stack chart-card">
                <div>
                  <h3>Répartition par catégorie SGES</h3>
                  <p className="muted-text">A, B+, B, C, FI et À déterminer.</p>
                </div>
                <div className="chart-shell">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {categoryData.map((entry, index) => (
                          <Cell key={entry.name} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="panel stack chart-card">
                <div>
                  <h3>Score moyen par pilier</h3>
                  <p className="muted-text">Environnement, Social, Gouvernance et Global.</p>
                </div>
                <div className="chart-shell">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={scoreData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#123b5d" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="panel stack chart-card chart-card-wide">
                <div>
                  <h3>Répartition par secteur</h3>
                  <p className="muted-text">Vue des secteurs détectés par le moteur ESG.</p>
                </div>
                <div className="chart-shell">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sectorData} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={120} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0f8f83" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </div>

            <div className="detail-grid analytics-grid">
              <section className="panel stack">
                <div className="section-header">
                  <div>
                    <h3>Dossiers à risque élevé</h3>
                    <p className="muted-text">Demandes à examiner en priorité.</p>
                  </div>
                </div>

                {!summary.highRiskApplications?.length ? (
                  <p className="muted-text">Aucun dossier à risque prioritaire pour le moment.</p>
                ) : (
                  <div className="admin-list-grid">
                    {summary.highRiskApplications.map((application) => (
                      <article key={application.id} className="admin-list-card">
                        <div className="admin-list-main">
                          <p className="eyebrow">Projet prioritaire</p>
                          <h4 className="application-card-title cell-clamp-2" title={application.projectName}>
                            {application.projectName}
                          </h4>
                          <p className="muted-text cell-clamp-2" title={application.companyName}>
                            {application.companyName}
                          </p>
                        </div>
                        <div className="admin-list-meta">
                          <div className="metric-row">
                            <span className="muted-text">Secteur</span>
                            <strong className="cell-clamp-2" title={application.sector || "-"}>
                              {application.sector || "-"}
                            </strong>
                          </div>
                          <div className="metric-row">
                            <span className="muted-text">Catégorie</span>
                            <span className={`esg-badge category-badge esg-category-${normalizeCategoryClass(application.categoryAuto)}`}>
                              {application.categoryAuto}
                            </span>
                          </div>
                          <div className="metric-row">
                            <span className="muted-text">Risque</span>
                            <span className={`esg-badge risk-badge esg-risk-${normalizeRiskClass(application.riskLevel)}`}>
                              {application.riskLevel}
                            </span>
                          </div>
                        </div>
                        <div className="admin-list-side">
                          <span className="score-pill">{formatScore(application.globalScore)}</span>
                          <div className="action-row">
                            <Link to={`/admin/applications/${application.id}`} className="ghost-button">
                              Examiner
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="panel stack">
                <div className="section-header">
                  <div>
                    <h3>Dossiers récents</h3>
                    <p className="muted-text">Dernières demandes reçues ou mises à jour.</p>
                  </div>
                </div>

                {!summary.recentApplications?.length ? (
                  <p className="muted-text">Aucun dossier récent disponible.</p>
                ) : (
                  <div className="admin-list-grid admin-list-grid-compact">
                    {summary.recentApplications.map((application) => (
                      <article key={application.id} className="admin-list-card admin-list-card-compact">
                        <div className="admin-list-main">
                          <h4 className="application-card-title cell-clamp-2" title={application.projectName}>
                            {application.projectName}
                          </h4>
                          <p className="muted-text cell-clamp-2" title={application.companyName}>
                            {application.companyName}
                          </p>
                          <p className="muted-text">
                            {new Date(application.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <div className="admin-list-meta">
                          <div className="action-row">
                            <span className={`status-badge status-${application.status?.toLowerCase()}`}>
                              {getStatusLabel(application.status)}
                            </span>
                            <span className={`esg-badge category-badge esg-category-${normalizeCategoryClass(application.categoryAuto)}`}>
                              {application.categoryAuto}
                            </span>
                          </div>
                          <div className="action-row">
                            {application.riskLevel ? (
                              <span className={`esg-badge risk-badge esg-risk-${normalizeRiskClass(application.riskLevel)}`}>
                                {application.riskLevel}
                              </span>
                            ) : (
                              <span className="status-badge status-draft">Bilan non calculé</span>
                            )}
                            <span className="score-pill">{formatScore(application.globalScore)}</span>
                          </div>
                        </div>
                        <div className="admin-list-side">
                          <div className="action-row">
                            <Link to={`/admin/applications/${application.id}`} className="ghost-button">
                              Examiner
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        ) : null}
      </section>
    </Layout>
  );
}

export default AdminDashboard;
