import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function getNavigationItems(role) {
  if (role === "ADMIN") {
    return [
      { to: "/admin", label: "Tableau de bord", end: true },
      { to: "/admin", label: "Demandes ESG", end: true },
      { to: "/admin/enterprise-accounts", label: "Comptes entreprises" },
      { to: "/admin/enterprise-accounts/new", label: "Créer un compte entreprise" },
    ];
  }

  return [
    { to: "/enterprise", label: "Tableau de bord", end: true },
    { to: "/enterprise/new", label: "Nouvelle demande" },
    { to: "/enterprise", label: "Mes demandes", end: true },
  ];
}

function Layout({ title, subtitle, children, actions = null }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const navigationItems = getNavigationItems(user?.role);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-block">
          <p className="brand-kicker">STB</p>
          <h1>Plateforme SGES</h1>
          <p className="brand-caption">
            Évaluation environnementale et sociale
          </p>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item, index) => (
            <NavLink
              key={`${item.to}-${index}`}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"
              }
            >
              {item.label}
            </NavLink>
          ))}

          <button type="button" className="sidebar-link sidebar-link-button" onClick={handleLogout}>
            Déconnexion
          </button>
        </nav>
      </aside>

      <div className="app-content">
        <header className="app-topbar">
          <div>
            <p className="eyebrow">Plateforme SGES — STB Bank</p>
            <h2>{title}</h2>
            {subtitle ? <p className="muted-text">{subtitle}</p> : null}
          </div>

          <div className="topbar-user">
            <div>
              <p className="topbar-user-name">{user?.name || user?.email}</p>
              <p className="muted-text">{user?.role === "ADMIN" ? "Administrateur" : "Entreprise"}</p>
            </div>
            {actions}
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
