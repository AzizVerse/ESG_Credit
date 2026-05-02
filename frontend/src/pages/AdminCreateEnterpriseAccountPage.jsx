import { useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client";
import Layout from "../components/Layout";

function AdminCreateEnterpriseAccountPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdAccount, setCreatedAccount] = useState(null);

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/admin/enterprise-accounts", form);
      setCreatedAccount(response.data.data || null);
      setSuccess("Compte entreprise créé avec succès.");
      setForm({ email: "", password: "" });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Création du compte entreprise impossible."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout
      title="Créer un compte entreprise"
      subtitle="Ajoutez un nouvel accès entreprise pour la plateforme SGES."
      actions={
        <Link to="/admin/enterprise-accounts" className="ghost-button">
          Voir les comptes
        </Link>
      }
    >
      <section className="form-layout">
        <article className="panel stack">
          <div>
            <h3>Nouveau compte entreprise</h3>
            <p className="muted-text">
              L’entreprise sera créée automatiquement à partir de l’email.
            </p>
          </div>

          <form className="stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="entreprise@exemple.com"
                required
              />
            </label>

            <label className="field">
              <span>Mot de passe</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 caractères"
                minLength="6"
                required
              />
            </label>

            {error ? <p className="error-text">{error}</p> : null}
            {success ? <p className="success-text">{success}</p> : null}

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Création..." : "Créer le compte"}
            </button>
          </form>
        </article>

        <article className="panel stack">
          <div>
            <h3>Résultat</h3>
            <p className="muted-text">
              Les informations sensibles ne sont jamais réaffichées après création.
            </p>
          </div>

          {createdAccount ? (
            <div className="stack">
              <div className="summary-row">
                <span>Email</span>
                <strong>{createdAccount.email}</strong>
              </div>
              <div className="summary-row">
                <span>Entreprise</span>
                <strong>{createdAccount.companyName || "-"}</strong>
              </div>
              <div className="summary-row">
                <span>Nombre de demandes</span>
                <strong>{createdAccount.applicationsCount ?? 0}</strong>
              </div>
            </div>
          ) : (
            <p className="muted-text">Aucun compte créé pour le moment.</p>
          )}
        </article>
      </section>
    </Layout>
  );
}

export default AdminCreateEnterpriseAccountPage;
