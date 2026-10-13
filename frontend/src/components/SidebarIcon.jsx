const paths = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  application: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></>,
  accounts: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V3h8v4M8 11v2m8-2v2m-8 4v2m8-2v2M12 7v14" /></>,
  create: <><circle cx="9" cy="7" r="4" /><path d="M2 21v-2a7 7 0 0 1 11-5M18 13v8m-4-4h8" /></>,
  logout: <><path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M9 12h12m-5-5 5 5-5 5" /></>,
};

function SidebarIcon({ name }) {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

export default SidebarIcon;
