import { useCollection, CollectionControls, CollectionPagination, ApplicationFilters, filterApplications } from "../components/CollectionControls";
import { t } from "../i18n/french";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client";
import Layout from "../components/Layout";

function EnterpriseDashboard() {
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function getEnterpriseErrorMessage(requestError) {
    const message = requestError.response?.data?.message || "";
    return message === "Accès refusé"
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

  const filtered = useMemo(() => filterApplications(applications, search, status), [applications, search, status]);
  const collection = useCollection(filtered, JSON.stringify([search, status]));

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
      { label: "Soumise", value: byStatus.SUBMITTED || 0 },
      { label: "En revue", value: byStatus.UNDER_REVIEW || 0 },
    ];
  }, [applications]);

  const existingApplication = applications[0] || null;

  return (
    <Layout
      title="Tableau de bord entreprise"
      subtitle="View your application and continue your project's ESMS assessment."
      actions={
        existingApplication ? (
          <Link to={`/enterprise/applications/${existingApplication.id}`} className="primary-button">
            {existingApplication.status === "DRAFT" ? "Continuer ma demande" : "Ouvrir ma demande"}
          </Link>
        ) : (
          <Link to="/enterprise/new" className="primary-button">
            Créer une demande
          </Link>
        )
      }
    >
      <section className="stack">
        <div className="metric-grid">
          {metrics.map((metric) => (
            <article key={metric.label} className="metric-card">
              <p className="metric-label">{t(metric.label)}</p>
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
          {error ? <p className="error-text">{t(error)}</p> : null}

          {!loading && !error ? (
            <><ApplicationFilters search={search} status={status} onSearch={setSearch} onStatus={setStatus} />
              <CollectionControls collection={collection} total={(applications).length} active={Boolean(search || status)} onReset={() => { setSearch(""); setStatus(""); }} />
            <div className="table-wrapper" tabIndex={0} role="region" aria-label="Résultats des demandes">
              <table className="data-table admin-table">
                <colgroup>
                  <col style={{ width: "26%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "14%" }} />
                </colgroup>
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
                  {collection.rows.map((application) => (
                    <tr key={application.id}>
                      <td className="cell-wrap cell-clamp-2" title={application.projectName}>
                        {application.projectName}
                      </td>
                      <td>
                        <span className={`status-badge status-${application.status?.toLowerCase()}`}>
                          {t(application.status)}
                        </span>
                      </td>
                      <td className="cell-wrap cell-clamp-2" title={application.projectType || "-"}>
                        {t(application.projectType || "-")}
                      </td>
                      <td className="numeric-cell">{application.financingAmount ?? "-"}</td>
                      <td>{new Date(application.createdAt).toLocaleDateString("fr-FR")}</td>
                      <td className="table-action-cell">
                        <Link
                          to={`/enterprise/applications/${application.id}`}
                          className="ghost-button"
                        >
                          Ouvrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!collection.total ? (
                    <tr>
                      <td colSpan="6" className="empty-cell">
                        Aucune demande ne correspond à vos filtres.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <CollectionPagination collection={collection} />
            </>
          ) : null}
        </section>
      </section>
    </Layout>
  );
}

export default EnterpriseDashboard;
