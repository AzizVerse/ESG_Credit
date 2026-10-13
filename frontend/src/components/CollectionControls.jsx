import { useMemo, useState } from "react";
import { t } from "../i18n/french";

export function normalizeSearch(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function useCollection(items, resetKey = "") {
  const [sort, setSort] = useState("newest");
  const [pageSize, setPageSize] = useState(10);
  const [position, setPosition] = useState({ key: "", page: 1 });
  const key = JSON.stringify([resetKey, sort, pageSize]);
  if (position.key !== key) setPosition({ key, page: 1 });
  const sorted = useMemo(() => [...items].sort((a, b) => {
    if (sort === "name") return String(a.projectName || a.companyName || a.email || "").localeCompare(String(b.projectName || b.companyName || b.email || ""), "fr", { sensitivity: "base", numeric: true });
    const difference = (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0);
    return sort === "oldest" ? difference : -difference;
  }), [items, sort]);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(position.key === key ? position.page : 1, pages);
  const start = (page - 1) * pageSize;
  return { sort, setSort, pageSize, setPageSize, page, pages, start,
    total: items.length, rows: sorted.slice(start, start + pageSize),
    setPage: (next) => setPosition({ key, page: Math.max(1, Math.min(next, pages)) }) };
}

export function CollectionControls({ collection, total, onReset, active = false }) {
  return <div className="collection-controls">
    <p className="collection-count" role="status">{collection.total.toLocaleString("fr-FR")} résultat(s) sur {total.toLocaleString("fr-FR")}</p>
    <div className="collection-options">
      <label className="field"><span>Trier par</span><select value={collection.sort} onChange={(event) => collection.setSort(event.target.value)}>
        <option value="newest">Plus récentes d’abord</option><option value="oldest">Plus anciennes d’abord</option><option value="name">Nom de A à Z</option>
      </select></label>
      <label className="field"><span>Par page</span><select value={collection.pageSize} onChange={(event) => collection.setPageSize(Number(event.target.value))}>
        {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
      </select></label>
      <button type="button" className="ghost-button" disabled={!active} onClick={onReset}>Réinitialiser les filtres</button>
    </div>
  </div>;
}

export function CollectionPagination({ collection }) {
  if (!collection.total) return null;
  return <nav className="collection-pagination" aria-label="Pagination des résultats">
    <p className="muted-text" role="status">Résultats {collection.start + 1}–{Math.min(collection.start + collection.pageSize, collection.total)} sur {collection.total}</p>
    <div className="action-row">
      <button type="button" className="ghost-button" disabled={collection.page === 1} onClick={() => collection.setPage(collection.page - 1)}>Précédent</button>
      <span>Page {collection.page} sur {collection.pages}</span>
      <button type="button" className="ghost-button" disabled={collection.page === collection.pages} onClick={() => collection.setPage(collection.page + 1)}>Suivant</button>
    </div>
  </nav>;
}

export function ApplicationFilters({ search, status, onSearch, onStatus }) {
  return <div className="filters-grid collection-filter-grid">
    <label className="field"><span>Rechercher une demande</span><input type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Projet, type ou localisation" /></label>
    <label className="field"><span>Statut</span><select value={status} onChange={(event) => onStatus(event.target.value)}>
      <option value="">Tous les statuts</option>
      {["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"].map((value) => <option key={value} value={value}>{t(value)}</option>)}
    </select></label>
  </div>;
}

export function filterApplications(items, search, status) {
  const term = normalizeSearch(search.trim());
  return items.filter((item) => (!status || item.status === status) && normalizeSearch(`${item.projectName || ""} ${item.projectType || ""} ${item.location || ""}`).includes(term));
}
