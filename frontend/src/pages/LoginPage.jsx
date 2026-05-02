import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function getLoginErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Connexion impossible."
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(form.email, form.password);
      const fallbackPath = user.role === "ADMIN" ? "/admin" : "/enterprise";
      const nextPath = location.state?.from?.pathname || fallbackPath;
      navigate(nextPath, { replace: true });
    } catch (requestError) {
      setError(getLoginErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <section className="login-brand-panel">
        <p className="brand-kicker">STB</p>
        <h1>Plateforme SGES</h1>
        <p className="login-lead">
          Évaluation environnementale et sociale pour les opérations de banque
          d’entreprise.
        </p>
        <div className="login-feature-list">
          <div className="feature-chip">Suivi des demandes ESG</div>
          <div className="feature-chip">Revue documentaire centralisée</div>
          <div className="feature-chip">Interface entreprise et administrateur</div>
        </div>
      </section>

      <section className="auth-card auth-card-wide">
        <p className="eyebrow">Accès sécurisé</p>
        <h2>Connexion</h2>
        <p className="muted-text">
          Connectez-vous en tant qu’entreprise ou administrateur.
        </p>

        <form className="stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="vous@entreprise.com"
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
              placeholder="Votre mot de passe"
              required
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default LoginPage;
