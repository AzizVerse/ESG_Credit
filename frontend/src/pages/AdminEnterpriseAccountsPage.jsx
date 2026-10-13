import { useCollection, CollectionControls, CollectionPagination, normalizeSearch } from "../components/CollectionControls";
import { t } from "../i18n/french";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client";
import Layout from "../components/Layout";

function AdminEnterpriseAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [activity, setActivity] = useState("");
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
    const term = normalizeSearch(search.trim());
    return accounts.filter((account) => normalizeSearch(`${account.email || ""} ${account.companyName || ""}`).includes(term) && (!activity || (activity === "with" ? Number(account.applicationsCount || 0) > 0 : Number(account.applicationsCount || 0) === 0)));
  }, [accounts, search, activity]);
  const collection = useCollection(filteredAccounts, JSON.stringify([search, activity]));

  return (
    <Layout
      title="Liste des comptes entreprises"
      subtitle="Company accounts registered for ESMS assessment."
      actions={
        <Link to="/admin/enterprise-accounts/new" className="primary-button">
          Créer le compte
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
            <input type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Email ou entreprise"
            />
          </label>
        </div>

        <label className="field filter-field"><span>Présence d’une demande</span><select value={activity} onChange={(event) => setActivity(event.target.value)}><option value="">Tous les comptes</option><option value="with">Avec une demande</option><option value="without">Sans demande</option></select></label>
        {!loading && !error ? <CollectionControls collection={collection} total={accounts.length} active={Boolean(search || activity)} onReset={() => { setSearch(""); setActivity(""); }} /> : null}
        {loading ? <p className="muted-text">Chargement des comptes...</p> : null}
        {error ? <p className="error-text">{t(error)}</p> : null}

        {!loading && !error ? (
          <div className="table-wrapper" tabIndex={0} role="region" aria-label="Résultats des comptes entreprises">
            <table className="data-table admin-table">
              <colgroup>
                <col style={{ width: "28%" }} />
                <col style={{ width: "24%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "16%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Adresse e-mail</th>
                  <th>Entreprise</th>
                  <th>Nombre de demandes</th>
                  <th>Date de création</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {collection.rows.map((account) => (
                  <tr key={account.id}>
                    <td className="cell-wrap cell-clamp-2" title={account.email}>{account.email}</td>
                    <td className="cell-wrap cell-clamp-2" title={account.companyName || "-"}>{account.companyName || "-"}</td>
                    <td className="numeric-cell">{account.applicationsCount ?? 0}</td>
                    <td>{new Date(account.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td className="table-action-cell">
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
        {!loading && !error ? <CollectionPagination collection={collection} /> : null}
      </section>
    </Layout>
  );
}

export default AdminEnterpriseAccountsPage;
