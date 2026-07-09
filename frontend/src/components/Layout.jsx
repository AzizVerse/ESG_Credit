import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function getNavigationItems(role) {
  if (role === "ADMIN") {
    return [
      { to: "/admin", label: "Tableau de bord", shortLabel: "TB", end: true },
      { to: "/admin/applications", label: "Demandes ESG", shortLabel: "DE", end: true },
      { to: "/admin/enterprise-accounts", label: "Comptes entreprises", shortLabel: "CE" },
      { to: "/admin/enterprise-accounts/new", label: "Créer un compte entreprise", shortLabel: "CR" },
    ];
  }

  return [
    { to: "/enterprise", label: "Ma demande", shortLabel: "MD", end: true },
  ];
}

function Layout({ title, subtitle, children, actions = null }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const navigationItems = getNavigationItems(user?.role);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 1100px)");
    function applyLayoutState(event) {
      const mobile = event.matches;
      const storedValue = window.localStorage.getItem("sges_sidebar_collapsed");
      setIsMobile(mobile);

      if (mobile) {
        setSidebarCollapsed(true);
        setMobileSidebarOpen(false);
      } else {
        setSidebarCollapsed(storedValue === "true");
      }
    }

    applyLayoutState(mediaQuery);
    mediaQuery.addEventListener("change", applyLayoutState);

    return () => {
      mediaQuery.removeEventListener("change", applyLayoutState);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || isMobile) {
      return;
    }

    window.localStorage.setItem("sges_sidebar_collapsed", String(sidebarCollapsed));
  }, [isMobile, sidebarCollapsed]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function handleToggleSidebar() {
    if (isMobile) {
      setMobileSidebarOpen((current) => !current);
      return;
    }

    setSidebarCollapsed((current) => !current);
  }

  function handleCloseMobileSidebar() {
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  }

  return (
    <div
      className={[
        "app-shell",
        sidebarCollapsed ? "app-shell-collapsed" : "",
        mobileSidebarOpen ? "app-shell-mobile-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <aside className="app-sidebar">
        <div className="brand-block">
          <div className="sidebar-brand-row">
            <div>
              <p className="brand-kicker">STB</p>
              <h1 className="sidebar-title">Plateforme SGES</h1>
              <p className="brand-caption">
                Évaluation environnementale et sociale
              </p>
            </div>
            <button
              type="button"
              className="sidebar-toggle"
              onClick={handleToggleSidebar}
              aria-label={isMobile ? "Ouvrir ou fermer le menu" : "Réduire ou ouvrir la barre latérale"}
            >
              {isMobile ? (mobileSidebarOpen ? "Fermer" : "Menu") : sidebarCollapsed ? "Ouvrir" : "Réduire"}
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item, index) => (
            <NavLink
              key={`${item.to}-${index}`}
              to={item.to}
              end={item.end}
              title={sidebarCollapsed ? item.label : undefined}
              onClick={handleCloseMobileSidebar}
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"
              }
            >
              <span className="sidebar-link-short">{item.shortLabel}</span>
              <span className="sidebar-link-label">{item.label}</span>
            </NavLink>
          ))}

          <button
            type="button"
            className="sidebar-link sidebar-link-button"
            title={sidebarCollapsed ? "Déconnexion" : undefined}
            onClick={handleLogout}
          >
            <span className="sidebar-link-short">DC</span>
            <span className="sidebar-link-label">Déconnexion</span>
          </button>
        </nav>
      </aside>

      {isMobile && mobileSidebarOpen ? (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Fermer le menu"
          onClick={handleCloseMobileSidebar}
        />
      ) : null}

      <div className="app-content">
        <header className="app-topbar">
          <div className="topbar-heading">
            {isMobile ? (
              <button
                type="button"
                className="sidebar-toggle sidebar-toggle-mobile"
                onClick={handleToggleSidebar}
              >
                {mobileSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
              </button>
            ) : null}
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
