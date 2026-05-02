import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client";
import Layout from "../components/Layout";

function EnterpriseDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function getEnterpriseErrorMessage(requestError) {
    const message = requestError.response?.data?.message || "";
    return message === "Access denied"
      ? "Vous n’êtes pas autorisé à accéder à cette ressource."
      : message || "Chargement des demandes impossible.";
  }

  useEffect(() => {
    async function loadApplications() {
      try {
        const response = await api.get("/applications/my");
        setApplications(response.data.data || []);
      } catch (requestError) {
        setError(getEnterpriseErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, []);

  const metrics = useMemo(() => {
    const byStatus = applications.reduce(
      (accumulator, application) => {
        accumulator.total += 1;
        accumulator[application.status] = (accumulator[application.status] || 0) + 1;
        return accumulator;
      },
      { total: 0, DRAFT: 0, SUBMITTED: 0, UNDER_REVIEW: 0 }
    );

    return [
      { label: "Nombre total de demandes", value: byStatus.total },
      { label: "Brouillons", value: byStatus.DRAFT || 0 },
      { label: "Soumises", value: byStatus.SUBMITTED || 0 },
      { label: "En revue", value: byStatus.UNDER_REVIEW || 0 },
    ];
  }, [applications]);

  return (
    <Layout
      title="Tableau de bord entreprise"
      subtitle="Consultez vos demandes et poursuivez l’évaluation SGES de vos projets."
      actions={
        <Link to="/enterprise/new" className="primary-button">
          Nouvelle demande
        </Link>
      }
    >
      <section className="stack">
        <div className="metric-grid">
          {metrics.map((metric) => (
            <article key={metric.label} className="metric-card">
              <p className="metric-label">{metric.label}</p>
              <strong className="metric-value">{metric.value}</strong>
            </article>
          ))}
        </div>

        <section className="panel stack">
          <div className="section-header">
            <div>
              <h3>Mes demandes</h3>
              <p className="muted-text">
                Suivez l’avancement de vos dossiers et reprenez vos formulaires.
              </p>
            </div>
          </div>

          {loading ? <p className="muted-text">Chargement des demandes...</p> : null}
          {error ? <p className="error-text">{error}</p> : null}

          {!loading ? (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nom du projet</th>
                    <th>Statut</th>
                    <th>Type de projet</th>
                    <th>Montant du financement</th>
                    <th>Date de création</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id}>
                      <td>{application.projectName}</td>
                      <td>
                        <span className={`status-badge status-${application.status?.toLowerCase()}`}>
                          {application.status}
                        </span>
                      </td>
                      <td>{application.projectType || "-"}</td>
                      <td>{application.financingAmount ?? "-"}</td>
                      <td>{new Date(application.createdAt).toLocaleDateString("fr-FR")}</td>
                      <td>
                        <Link
                          to={`/enterprise/applications/${application.id}`}
                          className="ghost-button"
                        >
                          Ouvrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!applications.length ? (
                    <tr>
                      <td colSpan="6" className="empty-cell">
                        Aucune demande disponible pour le moment.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </section>
    </Layout>
  );
}

export default EnterpriseDashboard;
