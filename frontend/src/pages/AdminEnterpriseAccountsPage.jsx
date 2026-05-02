import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client";
import Layout from "../components/Layout";

function AdminEnterpriseAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAccounts() {
      try {
        const response = await api.get("/admin/enterprise-accounts");
        setAccounts(response.data.data || []);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Chargement des comptes entreprises impossible."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAccounts();
  }, []);

  const filteredAccounts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return accounts;
    }

    return accounts.filter((account) => {
      const email = String(account.email || "").toLowerCase();
      const companyName = String(account.companyName || "").toLowerCase();
      return email.includes(term) || companyName.includes(term);
    });
  }, [accounts, search]);

  return (
    <Layout
      title="Comptes entreprises"
      subtitle="Liste des comptes entreprises créés pour l’évaluation SGES."
      actions={
        <Link to="/admin/enterprise-accounts/new" className="primary-button">
          Créer un compte
        </Link>
      }
    >
      <section className="panel stack">
        <div className="section-header">
          <div>
            <h3>Liste des comptes entreprises</h3>
            <p className="muted-text">
              Recherchez un compte par email ou par nom d’entreprise.
            </p>
          </div>
          <label className="field filter-field">
            <span>Recherche</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Email ou entreprise"
            />
          </label>
        </div>

        {loading ? <p className="muted-text">Chargement des comptes...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {!loading ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Entreprise</th>
                  <th>Nombre de demandes</th>
                  <th>Date de création</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr key={account.id}>
                    <td>{account.email}</td>
                    <td>{account.companyName || "-"}</td>
                    <td>{account.applicationsCount ?? 0}</td>
                    <td>{new Date(account.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td>
                      <Link
                        to={`/admin/enterprise-accounts/${account.id}`}
                        className="ghost-button"
                      >
                        Voir détails
                      </Link>
                    </td>
                  </tr>
                ))}
                {!filteredAccounts.length ? (
                  <tr>
                    <td colSpan="5" className="empty-cell">
                      Aucun compte entreprise trouvé.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </Layout>
  );
}

export default AdminEnterpriseAccountsPage;
