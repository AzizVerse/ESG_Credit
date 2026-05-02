import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client";
import Layout from "../components/Layout";

function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    enterprise: "",
    search: "",
  });

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [applicationsResponse, accountsResponse] = await Promise.all([
          api.get("/applications"),
          api.get("/admin/enterprise-accounts"),
        ]);

        setApplications(applicationsResponse.data.data || []);
        setAccounts(accountsResponse.data.data || []);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Chargement du tableau de bord impossible."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    const summary = applications.reduce(
      (accumulator, application) => {
        accumulator.total += 1;
        accumulator[application.status] = (accumulator[application.status] || 0) + 1;
        return accumulator;
      },
      { total: 0, SUBMITTED: 0, UNDER_REVIEW: 0, APPROVED: 0, REJECTED: 0 }
    );

    return [
      { label: "Total demandes", value: summary.total },
      { label: "Soumises", value: summary.SUBMITTED || 0 },
      { label: "En revue", value: summary.UNDER_REVIEW || 0 },
      { label: "Approuvées", value: summary.APPROVED || 0 },
      { label: "Rejetées", value: summary.REJECTED || 0 },
      { label: "Entreprises enregistrées", value: accounts.length },
    ];
  }, [accounts.length, applications]);

  const companies = useMemo(() => {
    return Array.from(
      new Set(
        applications
          .map((application) => application.company?.name)
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "fr"));
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const term = filters.search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus = !filters.status || application.status === filters.status;
      const matchesEnterprise =
        !filters.enterprise || application.company?.name === filters.enterprise;
      const haystack = [
        application.projectName,
        application.company?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !term || haystack.includes(term);

      return matchesStatus && matchesEnterprise && matchesSearch;
    });
  }, [applications, filters]);

  function handleFilterChange(event) {
    setFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  return (
    <Layout
      title="Tableau de bord administrateur"
      subtitle="Suivez les dossiers ESG soumis par les entreprises et organisez la revue."
      actions={
        <Link to="/admin/enterprise-accounts/new" className="primary-button">
          Créer un compte entreprise
        </Link>
      }
    >
      <section className="stack">
        <div className="metric-grid metric-grid-admin">
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
              <h3>Demandes ESG</h3>
              <p className="muted-text">
                Filtrez les dossiers par statut, entreprise ou mot-clé.
              </p>
            </div>
          </div>

          <div className="filters-grid">
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
              <span>Entreprise</span>
              <select
                name="enterprise"
                value={filters.enterprise}
                onChange={handleFilterChange}
              >
                <option value="">Toutes</option>
                {companies.map((companyName) => (
                  <option key={companyName} value={companyName}>
                    {companyName}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Recherche</span>
              <input
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Projet ou entreprise"
              />
            </label>
          </div>

          {loading ? <p className="muted-text">Chargement des demandes...</p> : null}
          {error ? <p className="error-text">{error}</p> : null}

          {!loading ? (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Entreprise</th>
                    <th>Projet</th>
                    <th>Statut</th>
                    <th>Type de projet</th>
                    <th>Montant</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((application) => (
                    <tr key={application.id}>
                      <td>{application.company?.name || "-"}</td>
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
                          to={`/admin/applications/${application.id}`}
                          className="ghost-button"
                        >
                          Examiner
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!filteredApplications.length ? (
                    <tr>
                      <td colSpan="7" className="empty-cell">
                        Aucune demande ne correspond aux filtres.
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

export default AdminDashboard;
