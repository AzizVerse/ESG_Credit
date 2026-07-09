import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../api/client";
import Layout from "../components/Layout";

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

function AdminEnterpriseAccountDetailPage() {
  const { id } = useParams();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAccount() {
      try {
        const response = await api.get(`/admin/enterprise-accounts/${id}`);
        setAccount(response.data.data || null);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Chargement du détail du compte entreprise impossible."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, [id]);

  return (
    <Layout
      title="Détail du compte entreprise"
      subtitle="Consultez les informations du compte et les demandes associées."
      actions={
        <Link to="/admin/enterprise-accounts" className="ghost-button">
          Retour à la liste
        </Link>
      }
    >
      <section className="stack">
        {loading ? <p className="muted-text">Chargement du compte...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {account ? (
          <>
            <section className="detail-grid">
              <article className="panel stack">
                <h3>Informations du compte</h3>
                <div className="summary-row">
                  <span>Email</span>
                  <strong>{account.email}</strong>
                </div>
                <div className="summary-row">
                  <span>Entreprise</span>
                  <strong>{account.companyName || "-"}</strong>
                </div>
                <div className="summary-row">
                  <span>Date de création</span>
                  <strong>{new Date(account.createdAt).toLocaleDateString("fr-FR")}</strong>
                </div>
                <div className="summary-row">
                  <span>Nombre de demandes</span>
                  <strong>{account.applicationsCount ?? 0}</strong>
                </div>
              </article>
            </section>

            <section className="panel stack">
              <div className="section-header">
                <div>
                  <h3>Demandes de l’entreprise</h3>
                  <p className="muted-text">
                    Accédez rapidement aux dossiers SGES liés à cette entreprise.
                  </p>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="data-table admin-table">
                  <colgroup>
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "13%" }} />
                    <col style={{ width: "14%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Nom du projet</th>
                      <th>Statut</th>
                      <th>Type de projet</th>
                      <th>Montant</th>
                      <th>Localisation</th>
                      <th>Date de création</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(account.applications || []).map((application) => (
                      <tr key={application.id}>
                        <td className="cell-wrap cell-clamp-2" title={application.projectName}>
                          {application.projectName}
                        </td>
                        <td>
                          <span className={`status-badge status-${application.status?.toLowerCase()}`}>
                            {getStatusLabel(application.status)}
                          </span>
                        </td>
                        <td className="cell-wrap cell-clamp-2" title={application.projectType || "-"}>
                          {application.projectType || "-"}
                        </td>
                        <td className="numeric-cell">{application.financingAmount ?? "-"}</td>
                        <td className="cell-wrap cell-clamp-2" title={application.location || "-"}>
                          {application.location || "-"}
                        </td>
                        <td>{new Date(application.createdAt).toLocaleDateString("fr-FR")}</td>
                        <td className="table-action-cell">
                          <Link
                            to={`/admin/applications/${application.id}`}
                            className="ghost-button"
                          >
                            Examiner
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {!account.applications?.length ? (
                      <tr>
                        <td colSpan="7" className="empty-cell">
                          Aucune demande liée à cette entreprise.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </section>
    </Layout>
  );
}

export default AdminEnterpriseAccountDetailPage;
