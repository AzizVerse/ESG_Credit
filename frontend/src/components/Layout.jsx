import { t } from "../i18n/french";
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import EquoraLogo from "./EquoraLogo";
import SidebarIcon from "./SidebarIcon";

function getNavigationItems(role) {
  if (role === "ADMIN") {
    return [
      { to: "/admin", label: "Tableau de bord", icon: "dashboard", end: true },
      { to: "/admin/applications", label: "Demandes ESG", icon: "application", end: true },
      { to: "/admin/exclusions", label: "Exclusions IFC", icon: "application", end: true },
      { to: "/admin/enterprise-accounts", label: "Liste des comptes entreprises", icon: "accounts", end: true },
      { to: "/admin/enterprise-accounts/new", label: "Créer un compte entreprise", icon: "create", end: true },
    ];
  }

  return [
    { to: "/enterprise", label: "Mes demandes", icon: "application", end: true },
  ];
}

function Layout({ title, subtitle, children, actions = null }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const navigationItems = getNavigationItems(user?.role);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    window.matchMedia("(max-width: 1100px)").matches || window.localStorage.getItem("sges_sidebar_collapsed") === "true"
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 1100px)").matches);

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
              <EquoraLogo compact={sidebarCollapsed && !isMobile} />
              <p className="brand-caption">
                Cadre intégré d’évaluation et de performance ESG
              </p>
            </div>
            <button
              type="button"
              className="sidebar-toggle"
              onClick={handleToggleSidebar}
              aria-label={isMobile ? "Ouvrir ou fermer le menu" : "Réduire ou ouvrir la barre latérale"}
              aria-expanded={isMobile ? mobileSidebarOpen : !sidebarCollapsed}
            >
              {isMobile ? (mobileSidebarOpen ? "Fermer" : "Menu") : sidebarCollapsed ? "Ouvrir" : "Réduire"}
            </button>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Navigation principale">
          {navigationItems.map((item, index) => (
            <NavLink
              key={`${item.to}-${index}`}
              to={item.to}
              end={item.end}
              aria-label={item.label}
              title={sidebarCollapsed ? item.label : undefined}
              onClick={handleCloseMobileSidebar}
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"
              }
            >
              <span className="sidebar-link-short"><SidebarIcon name={item.icon} /></span>
              <span className="sidebar-link-label">{t(item.label)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-link sidebar-signout"
            aria-label="Déconnexion"
            title={sidebarCollapsed ? "Déconnexion" : undefined}
            onClick={handleLogout}
          >
            <span className="sidebar-link-short"><SidebarIcon name="logout" /></span>
            <span className="sidebar-link-label">Déconnexion</span>
          </button>
        </div>
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
            <p className="eyebrow">EQUORA · STB BANK</p>
            <h2>{t(title)}</h2>
            {subtitle ? <p className="muted-text">{t(subtitle)}</p> : null}
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
