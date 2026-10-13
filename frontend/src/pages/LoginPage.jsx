import { t } from "../i18n/french";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import EquoraLogo from "../components/EquoraLogo";

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
        <div className="equora-login-brand"><EquoraLogo /></div>
        <div className="login-editorial">
          <div className="login-editorial-copy">
            <h1>Cadre intégré d’évaluation<br /><em>et de performance ESG.</em></h1>
            <p className="login-lead">Un espace commun pour comprendre les impacts de votre activité et accompagner vos projets avec responsabilité.</p>
          </div>
          <div className="esg-orbit" aria-hidden="true">
            <div className="esg-orbit-track esg-orbit-e"><span className="esg-orbit-node"><span>E</span></span></div>
            <div className="esg-orbit-track esg-orbit-s"><span className="esg-orbit-node"><span>S</span></span></div>
            <div className="esg-orbit-track esg-orbit-g"><span className="esg-orbit-node"><span>G</span></span></div>
            <span className="esg-orbit-center" />
          </div>
        </div>
        <div className="login-feature-list">
          <div><span>01</span> Votre demande, un parcours clair</div>
          <div><span>02</span> Vos documents, au même endroit</div>
          <div><span>03</span> Une vision environnementale et sociale</div>
        </div>
        <p className="login-brand-footer">STB BANK</p>
      </section>

      <section className="auth-card auth-card-wide">
        <p className="eyebrow">Accès sécurisé</p>
        <h2>Bienvenue sur EQUORA.</h2>
        <p className="muted-text">
          Retrouvez votre espace entreprise ou administrateur.
        </p>

        <form className="stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Adresse e-mail</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="vous@entreprise.com"
              autoComplete="username"
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
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <p className="error-text">{t(error)}</p> : null}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>
        <p className="login-access-note">Accès réservé aux comptes habilités par STB Bank.</p>
      </section>
    </div>
  );
}

export default LoginPage;
