import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../api/client";
import Layout from "../components/Layout";

function getZoneLabel(zoneType) {
  if (zoneType === "URBAN") return "Zone urbaine";
  if (zoneType === "PERI_URBAN") return "Zone péri-urbaine";
  if (zoneType === "RURAL") return "Zone rurale";
  return "-";
}

function getProjectNatureLabel(projectNature) {
  if (projectNature === "MODERNIZATION") return "Modernisation / mise à niveau";
  if (projectNature === "EXTENSION") return "Extension";
  if (projectNature === "NEW_PROJECT") return "Nouveau projet";
  return "-";
}

function getDocumentTypeLabel(documentType) {
  const labels = {
    PROJECT_PROFILE: "Signalétique du projet",
    REGULATORY_COMPLIANCE: "Réglementation nationale",
    CERTIFICATIONS: "Certifications et autorisations",
    PERFORMANCE_STANDARD_1: "Norme de performance 1",
    PERFORMANCE_STANDARD_2_HS: "Norme de performance 2 — Hygiène et sécurité",
    PERFORMANCE_STANDARD_2_HR: "Norme de performance 2 — Gestion des ressources humaines",
    PERFORMANCE_STANDARD_3_LIQUID_WASTE:
      "Norme de performance 3 — Gestion des déchets liquides",
    PERFORMANCE_STANDARD_3_SOLID_WASTE:
      "Norme de performance 3 — Gestion des déchets solides",
    PERFORMANCE_STANDARD_3_AIR_EMISSIONS: "Norme de performance 3 — Émissions gazeuses",
    PERFORMANCE_STANDARD_3_HAZARDOUS_MATERIALS:
      "Norme de performance 3 — Matières dangereuses",
    PERFORMANCE_STANDARD_3_EMERGENCY_PREPAREDNESS:
      "Norme de performance 3 — Préparation aux situations d’urgence",
    PERFORMANCE_STANDARD_4:
      "Norme de performance 4 — Santé, sécurité et sûreté des communautés",
    PERFORMANCE_STANDARD_5:
      "Norme de performance 5 — Acquisition de terres et réinstallation involontaire",
    PERFORMANCE_STANDARD_6:
      "Norme de performance 6 — Conservation de la biodiversité et gestion durable des ressources naturelles vivantes",
    PERFORMANCE_STANDARD_7: "Norme de performance 7 — Peuples autochtones",
    PERFORMANCE_STANDARD_8: "Norme de performance 8 — Patrimoine culturel",
    CLIMATE_QUESTIONS: "Questions climatiques",
  };

  return labels[documentType] || documentType || "Autres pièces";
}

function getStatusLabel(status) {
  const labels = {
    DRAFT: "Brouillon",
    SUBMITTED: "Soumise",
    UNDER_REVIEW: "En revue",
    APPROVED: "Approuvée",
    REJECTED: "Rejetée",
  };

  return labels[status] || status || "-";
}

function getRiskLabel(level) {
  return level || "-";
}

function getSeverityLabel(level) {
  const labels = {
    CRITICAL: "Critique",
    MAJOR: "Majeur",
    MEDIUM: "Moyen",
  };

  return labels[level] || level || "-";
}

function getPriorityLabel(level) {
  const labels = {
    HIGH: "Haute priorité",
    MEDIUM: "Priorité moyenne",
    LOW: "Faible priorité",
  };

  return labels[level] || level || "-";
}

function getPillarLabel(pillar) {
  const labels = {
    Environment: "Environnement",
    Social: "Social",
    Governance: "Gouvernance",
  };

  return labels[pillar] || pillar || "-";
}

function getCategoryClass(category) {
  return (category || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace("+", "plus")
    .replace(/[^a-z]/g, "") || "unknown";
}

function getScoreInterpretation(score) {
  if (typeof score !== "number") return "-";
  if (score >= 80) return "Solide";
  if (score >= 60) return "Acceptable";
  if (score >= 40) return "À renforcer";
  return "Critique";
}

function getExecutiveSummary(result) {
  if (!result) {
    return "";
  }

  const base =
    result.riskLevel === "Élevé"
      ? `Le dossier présente une catégorie SGES ${result.categoryAuto || "-"} avec un niveau de risque ${result.riskLevel}.`
      : result.riskLevel === "Modéré"
        ? `Le dossier présente une catégorie SGES ${result.categoryAuto || "-"} avec un niveau de risque ${result.riskLevel}, nécessitant un suivi ciblé.`
        : `Le dossier présente une catégorie SGES ${result.categoryAuto || "-"} avec un niveau de risque ${result.riskLevel}, globalement maîtrisé.`;

  if (!result.redFlags?.length) {
    return `${base} Aucun red flag critique n’a été identifié à ce stade.`;
  }

  const topFlags = result.redFlags
    .slice()
    .sort((left, right) => {
      const order = { CRITICAL: 0, MAJOR: 1, MEDIUM: 2 };
      return (order[left.severity] ?? 9) - (order[right.severity] ?? 9);
    })
    .slice(0, 3)
    .map((flag) => flag.message);

  return `${base} Les principaux points de vigilance concernent ${topFlags.join(", ")}.`;
}

function buildFormMetadata(formTemplate) {
  const sectionMap = {};
  const questionMap = {};

  for (const section of formTemplate?.sections || []) {
    sectionMap[section.code] = section.title;

    for (const question of section.questions || []) {
      questionMap[question.code] = {
        sectionCode: section.code,
        sectionTitle: section.title,
        requiresAttachment: Boolean(question.requiresAttachment),
        metadata: question.metadata || null,
        type: question.type,
        label: question.label,
      };
    }
  }

  return { sectionMap, questionMap };
}

function groupAnswersBySection(answers, metadata) {
  if (!metadata) {
    return [];
  }

  const groups = new Map();

  for (const answer of answers) {
    const questionMeta = metadata.questionMap[answer.questionCode];
    const sectionCode = questionMeta?.sectionCode || answer.section || "UNKNOWN";
    const sectionTitle =
      questionMeta?.sectionTitle || metadata.sectionMap[answer.section] || answer.section || "-";

    if (!groups.has(sectionCode)) {
      groups.set(sectionCode, {
        sectionCode,
        sectionTitle,
        answers: [],
      });
    }

    groups.get(sectionCode).answers.push({
      ...answer,
      requiresAttachment: questionMeta?.requiresAttachment,
      type: questionMeta?.type,
      metadata: questionMeta?.metadata,
      questionLabel: questionMeta?.label || answer.questionCode,
    });
  }

  return Array.from(groups.values());
}

function groupAttachmentsByDocumentType(attachments) {
  return attachments.reduce((accumulator, attachment) => {
    const key = attachment.documentType || "OTHER";
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(attachment);
    return accumulator;
  }, {});
}

function getQuestionDisplay(questionCode, metadata) {
  if (!questionCode) {
    return { label: null, code: null };
  }

  const label = metadata?.questionMap?.[questionCode]?.label || null;
  return { label, code: questionCode };
}

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
}

function renderAnswerTable(answer) {
  const rows = parseJsonArray(answer.answerValue);
  const columns = answer.metadata?.columns || [];

  if (!rows || !columns.length) {
    return null;
  }

  return (
    <div className="table-wrapper">
      <table className="data-table compact-table">
        <thead>
          <tr>
            {rows[0] && Object.prototype.hasOwnProperty.call(rows[0], "label") ? (
              <th>Question / ligne</th>
            ) : null}
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${answer.questionCode}-${index}`}>
              {Object.prototype.hasOwnProperty.call(row, "label") ? <td>{row.label}</td> : null}
              {columns.map((column) => (
                <td key={column.key}>{row[column.key] || "-"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function groupBy(items, key) {
  return items.reduce((accumulator, item) => {
    const bucketKey = item[key] || "OTHER";
    accumulator[bucketKey] = accumulator[bucketKey] || [];
    accumulator[bucketKey].push(item);
    return accumulator;
  }, {});
}

function AdminApplicationDetail() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [formMetadata, setFormMetadata] = useState(null);
  const [esgResult, setEsgResult] = useState(null);
  const [esgError, setEsgError] = useState("");
  const [esgLoading, setEsgLoading] = useState(true);
  const [esgActionLoading, setEsgActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("resume");

  useEffect(() => {
    async function loadScoringResult() {
      try {
        setEsgLoading(true);
        const scoringResponse = await api.get(`/scoring/applications/${id}/result`);
        setEsgResult(scoringResponse.data.data);
        setEsgError("");
      } catch (requestError) {
        setEsgResult(null);
        setEsgError(
          requestError.response?.data?.message ||
            "Aucun bilan ESG calculé pour cette demande."
        );
      } finally {
        setEsgLoading(false);
      }
    }

    async function loadData() {
      try {
        const [applicationResponse, answersResponse, formResponse, attachmentsResponse] =
          await Promise.all([
            api.get(`/applications/${id}`),
            api.get(`/applications/${id}/answers`),
            api.get("/forms/active"),
            api.get(`/applications/${id}/attachments`),
          ]);

        setApplication(applicationResponse.data.data);
        setAnswers(answersResponse.data.data || []);
        setFormMetadata(buildFormMetadata(formResponse.data.data));
        setAttachments(attachmentsResponse.data.data || []);
        await loadScoringResult();
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Chargement du détail de la demande impossible."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const profileDetails = application?.projectProfile?.details || null;
  const groupedAnswers = useMemo(
    () => groupAnswersBySection(answers, formMetadata),
    [answers, formMetadata]
  );
  const attachmentsByDocumentType = useMemo(
    () => groupAttachmentsByDocumentType(attachments),
    [attachments]
  );
  const redFlagsBySeverity = useMemo(() => {
    const order = ["CRITICAL", "MAJOR", "MEDIUM"];
    const grouped = groupBy(esgResult?.redFlags || [], "severity");
    return order.map((severity) => ({
      severity,
      items: grouped[severity] || [],
    }));
  }, [esgResult]);
  const recommendationsByPriority = useMemo(() => {
    const order = ["HIGH", "MEDIUM", "LOW"];
    const grouped = groupBy(esgResult?.recommendations || [], "priority");
    return order.map((priority) => ({
      priority,
      items: grouped[priority] || [],
    }));
  }, [esgResult]);

  async function handleDownloadAttachment(attachment) {
    const response = await api.get(`/attachments/${attachment.id}/download`, {
      responseType: "blob",
    });
    const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = attachment.originalName || attachment.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }

  async function handleCalculateScoring() {
    try {
      setEsgActionLoading(true);
      const response = await api.post(`/scoring/applications/${id}/calculate`);
      setEsgResult(response.data.data);
      setEsgError("");
      setApplication((current) =>
        current
          ? {
              ...current,
              categoryAuto: response.data.data?.categoryAuto || current.categoryAuto,
            }
          : current
      );
    } catch (requestError) {
      setEsgError(
        requestError.response?.data?.message || "Calcul du bilan ESG impossible."
      );
    } finally {
      setEsgActionLoading(false);
      setEsgLoading(false);
    }
  }

  const tabs = [
    { id: "resume", label: "Résumé" },
    { id: "profile", label: "Signalétique du projet" },
    { id: "attachments", label: "Pièces justificatives" },
    { id: "answers", label: "Réponses SGES" },
    { id: "esg", label: "Bilan ESG" },
    { id: "observations", label: "Observations administrateur" },
  ];

  return (
    <Layout
      title="Examen de la demande"
      subtitle="Analyse détaillée du dossier SGES soumis par l’entreprise."
      actions={
        <div className="topbar-actions">
          <Link to="/admin" className="ghost-button">
            Retour au tableau de bord
          </Link>
          <Link to="/admin/applications" className="ghost-button">
            Retour aux demandes ESG
          </Link>
        </div>
      }
    >
      <section className="stack">
        {loading ? <p className="muted-text">Chargement du détail de la demande...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {application ? (
          <>
            <article className="panel summary-hero">
              <div className="summary-grid">
                <div className="summary-main">
                  <p className="eyebrow">Dossier SGES</p>
                  <h3>{application.projectName}</h3>
                  <p className="muted-text">
                    {application.company?.name || "Entreprise inconnue"}
                  </p>
                </div>
                <div className="summary-facts">
                  <div className="summary-row">
                    <span>Statut</span>
                    <strong>{getStatusLabel(application.status)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Type de projet</span>
                    <strong>{application.projectType || "-"}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Montant du financement</span>
                    <strong>{application.financingAmount ?? "-"}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Localisation</span>
                    <strong>{application.location || "-"}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Catégorie automatique</span>
                    <strong>{application.categoryAuto || "-"}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Date de soumission</span>
                    <strong>{new Date(application.updatedAt).toLocaleDateString("fr-FR")}</strong>
                  </div>
                </div>
              </div>
            </article>

            <div className="tabs-row">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={activeTab === tab.id ? "tab-button tab-button-active" : "tab-button"}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "resume" ? (
              <section className="detail-grid">
                <article className="panel stack">
                  <h3>Résumé du dossier</h3>
                  <div className="summary-row"><span>Entreprise</span><strong>{application.company?.name || "-"}</strong></div>
                  <div className="summary-row"><span>Projet</span><strong>{application.projectName || "-"}</strong></div>
                  <div className="summary-row"><span>Type d’activité</span><strong>{application.activityType || "-"}</strong></div>
                  <div className="summary-row"><span>Statut</span><strong>{getStatusLabel(application.status)}</strong></div>
                </article>

                <article className="panel stack">
                  <h3>Revue SGES</h3>
                  <p className="muted-text">
                    Le dossier comprend {answers.length} réponse(s) et {attachments.length} pièce(s)
                    justificative(s).
                  </p>
                  <p className="muted-text">
                    Utilisez les onglets pour consulter la signalétique, les pièces et les réponses
                    détaillées.
                  </p>
                </article>
              </section>
            ) : null}

            {activeTab === "profile" ? (
              <section className="panel stack">
                <h3>Signalétique du projet</h3>
                {profileDetails ? (
                  <div className="detail-grid">
                    <div className="summary-row"><span>Nom ou raison sociale</span><strong>{profileDetails.legalName || "-"}</strong></div>
                    <div className="summary-row"><span>Adresse</span><strong>{profileDetails.address || "-"}</strong></div>
                    <div className="summary-row"><span>Zone d’implantation</span><strong>{getZoneLabel(profileDetails.zoneType)}</strong></div>
                    <div className="summary-row"><span>Zone industrielle</span><strong>{profileDetails.isIndustrialZone === true ? "Oui" : profileDetails.isIndustrialZone === false ? "Non" : "-"}</strong></div>
                    <div className="summary-row"><span>Responsable / interlocuteur</span><strong>{profileDetails.contactName || "-"}</strong></div>
                    <div className="summary-row"><span>Position</span><strong>{profileDetails.contactPosition || "-"}</strong></div>
                    <div className="summary-row"><span>Date de création</span><strong>{profileDetails.creationDate || "-"}</strong></div>
                    <div className="summary-row"><span>Superficie totale</span><strong>{profileDetails.totalSurface ?? "-"}</strong></div>
                    <div className="summary-row"><span>Superficie couverte</span><strong>{profileDetails.coveredSurface ?? "-"}</strong></div>
                    <div className="summary-row"><span>Type de projet</span><strong>{getProjectNatureLabel(profileDetails.projectNature)}</strong></div>
                    <div className="summary-row"><span>Secteur d’activité</span><strong>{profileDetails.activitySector || "-"}</strong></div>
                    <div className="summary-row summary-row-full"><span>Descriptif du projet</span><strong>{profileDetails.projectDescription || "-"}</strong></div>
                  </div>
                ) : (
                  <p className="muted-text">Aucune signalétique disponible.</p>
                )}
              </section>
            ) : null}

            {activeTab === "attachments" ? (
              <section className="panel stack">
                <h3>Pièces justificatives</h3>
                {!attachments.length ? <p className="muted-text">Aucune pièce justificative ajoutée.</p> : null}
                {Object.entries(attachmentsByDocumentType).map(([documentType, items]) => (
                  <div key={documentType} className="stack">
                    <p className="eyebrow">{getDocumentTypeLabel(documentType)}</p>
                    {items.map((attachment) => (
                      <div key={attachment.id} className="attachment-row">
                        <div>
                          <p className="attachment-name">{attachment.originalName || attachment.fileName}</p>
                          <p className="muted-text">{getDocumentTypeLabel(documentType)}</p>
                        </div>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => handleDownloadAttachment(attachment)}
                        >
                          Télécharger
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </section>
            ) : null}

            {activeTab === "answers" ? (
              <section className="stack">
                {groupedAnswers.map((group) => (
                  <details key={group.sectionCode} className="panel accordion-panel" open>
                    <summary>{group.sectionTitle}</summary>
                    <div className="stack accordion-body">
                      {group.answers.map((answer) => (
                        <article key={answer.id} className="question-review-card">
                          <div className="stack-tight">
                            <h4>{answer.questionLabel}</h4>
                            <p className="muted-text">Code : {answer.questionCode}</p>
                          </div>

                          {answer.type === "TABLE" ? (
                            renderAnswerTable(answer) || (
                              <p><strong>Réponse :</strong> {answer.answerLabel || answer.answerValue || "-"}</p>
                            )
                          ) : (
                            <>
                              <p><strong>Réponse :</strong> {answer.answerLabel || answer.answerValue || "-"}</p>
                              {answer.answerLabel && answer.answerValue && answer.answerLabel !== answer.answerValue ? (
                                <p className="muted-text">Valeur technique : {answer.answerValue}</p>
                              ) : null}
                            </>
                          )}

                          <p><strong>Commentaire :</strong> {answer.comment || "-"}</p>
                          <p>
                            <strong>Pièce justificative requise :</strong>{" "}
                            {answer.requiresAttachment === true
                              ? "Oui"
                              : answer.requiresAttachment === false
                                ? "Non"
                                : "-"}
                          </p>
                        </article>
                      ))}
                    </div>
                  </details>
                ))}
              </section>
            ) : null}

            {activeTab === "esg" ? (
              <section className="panel stack">
                <div className="section-header">
                  <div>
                    <h3>Bilan ESG</h3>
                    <p className="muted-text">
                      Résultat calculé par le moteur de règles SGES/ESG.
                    </p>
                  </div>
                  <div className="topbar-actions">
                    <Link to="/admin" className="ghost-button">
                      Retour au tableau de bord
                    </Link>
                    <Link to="/admin/applications" className="ghost-button">
                      Retour aux demandes ESG
                    </Link>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={handleCalculateScoring}
                      disabled={esgActionLoading}
                    >
                      {esgResult ? "Recalculer le bilan ESG" : "Calculer le bilan ESG"}
                    </button>
                  </div>
                </div>

                {esgLoading ? (
                  <p className="muted-text">Chargement du bilan ESG...</p>
                ) : null}

                {!esgLoading && !esgResult ? (
                  <p className="muted-text">
                    {esgError || "Aucun bilan ESG calculé pour cette demande."}
                  </p>
                ) : null}

                {esgResult ? (
                  <>
                    <article className="esg-executive-card">
                      <p className="eyebrow">Synthèse exécutive</p>
                      <p className="executive-summary-text">{getExecutiveSummary(esgResult)}</p>
                    </article>

                    <div className="esg-summary-grid">
                      <article className="metric-card esg-summary-card">
                        <p className="metric-label">Catégorie SGES</p>
                        <span className={`esg-badge esg-category-badge esg-category-${getCategoryClass(esgResult.categoryAuto)}`}>
                          {esgResult.categoryAuto || "-"}
                        </span>
                      </article>
                      <article className="metric-card esg-summary-card">
                        <p className="metric-label">Niveau de risque</p>
                        <span className={`esg-badge esg-risk-badge esg-risk-${(esgResult.riskLevel || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "") || "unknown"}`}>
                          {getRiskLabel(esgResult.riskLevel)}
                        </span>
                      </article>
                      <article className="metric-card esg-summary-card">
                        <p className="metric-label">Score global ESG</p>
                        <strong className="metric-value metric-value-compact">{esgResult.scores?.global ?? "-"}</strong>
                      </article>
                      <article className="metric-card esg-summary-card">
                        <p className="metric-label">Secteur détecté</p>
                        <strong className="metric-value metric-value-text">{esgResult.sector || "-"}</strong>
                      </article>
                      <article className="metric-card esg-summary-card">
                        <p className="metric-label">Calcul / moteur</p>
                        <strong className="metric-value metric-value-text">
                          {esgResult.calculatedAt
                            ? new Date(esgResult.calculatedAt).toLocaleDateString("fr-FR")
                            : "-"}
                        </strong>
                        <p className="muted-text">Version : {esgResult.engineVersion || "-"}</p>
                      </article>
                    </div>

                    <div className="esg-score-grid">
                      {[
                        { label: "Environnement", value: esgResult.scores?.environment, pillar: "environment" },
                        { label: "Social", value: esgResult.scores?.social, pillar: "social" },
                        { label: "Gouvernance", value: esgResult.scores?.governance, pillar: "governance" },
                      ].map((scoreCard) => (
                        <article key={scoreCard.label} className="panel esg-score-card">
                          <div className="section-header">
                            <div>
                              <h4>{scoreCard.label}</h4>
                              <p className="muted-text">{getScoreInterpretation(scoreCard.value)}</p>
                            </div>
                            <strong className="score-card-value">{scoreCard.value ?? "-"}</strong>
                          </div>
                          <div className="progress-track">
                            <div
                              className={`progress-bar progress-bar-${scoreCard.pillar}`}
                              style={{ width: `${Math.max(0, Math.min(scoreCard.value || 0, 100))}%` }}
                            />
                          </div>
                        </article>
                      ))}
                    </div>

                    <article className="stack">
                      <h4>Red flags</h4>
                      {!esgResult.redFlags?.length ? (
                        <div className="esg-success-state">
                          <p className="success-text">Aucun red flag critique identifié.</p>
                        </div>
                      ) : (
                        redFlagsBySeverity.map((group) =>
                          group.items.length ? (
                            <div key={group.severity} className="stack">
                              <div className="section-header">
                                <h4>{getSeverityLabel(group.severity)}</h4>
                                <span className={`esg-badge esg-severity-${group.severity.toLowerCase()}`}>
                                  {group.items.length}
                                </span>
                              </div>
                              <div className="esg-card-grid">
                                {group.items.map((flag, index) => {
                                  const questionDisplay = getQuestionDisplay(flag.questionCode, formMetadata);

                                  return (
                                    <div key={`${flag.questionCode}-${index}`} className="question-review-card esg-flag-card">
                                      <div className="flag-card-head">
                                        <span className={`esg-badge esg-severity-${flag.severity?.toLowerCase()}`}>
                                          {getSeverityLabel(flag.severity)}
                                        </span>
                                        <span className="esg-badge esg-pillar-badge">
                                          {getPillarLabel(flag.pillar)}
                                        </span>
                                      </div>
                                      <p className="flag-message">{flag.message}</p>
                                      {questionDisplay.label ? (
                                        <p><strong>Question :</strong> {questionDisplay.label}</p>
                                      ) : null}
                                      {questionDisplay.code ? (
                                        <p className="muted-text">Code interne : {questionDisplay.code}</p>
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null
                        )
                      )}
                    </article>

                    <div className="detail-grid esg-strength-weakness-grid">
                      <article className="panel stack">
                        <h4>Points forts</h4>
                        {!esgResult.strengths?.length ? (
                          <p className="muted-text">Aucun point fort mis en évidence.</p>
                        ) : (
                          <ul className="esg-bullet-list">
                            {esgResult.strengths.map((item, index) => (
                              <li key={`strength-${index}`}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </article>

                      <article className="panel stack">
                        <h4>Points faibles</h4>
                        {!esgResult.weaknesses?.length ? (
                          esgResult.redFlags?.length ? (
                            <p className="muted-text">Des points de vigilance sont signalés dans les red flags ci-dessus.</p>
                          ) : (
                            <p className="muted-text">Aucun point faible majeur identifié.</p>
                          )
                        ) : (
                          <ul className="esg-bullet-list">
                            {esgResult.weaknesses.map((item, index) => (
                              <li key={`weakness-${index}`}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </article>
                    </div>

                    <article className="stack">
                      <h4>Recommandations</h4>
                      {!esgResult.recommendations?.length ? (
                        <p className="muted-text">Aucune recommandation générée.</p>
                      ) : (
                        recommendationsByPriority.map((group) =>
                          group.items.length ? (
                            <div key={group.priority} className="stack">
                              <div className="section-header">
                                <h4>{getPriorityLabel(group.priority)}</h4>
                              </div>
                              <div className="esg-card-grid">
                                {group.items.map((item, index) => {
                                  const sourceReferences = (item.sourceCodes || [])
                                    .map((code) => {
                                      const questionDisplay = getQuestionDisplay(code, formMetadata);
                                      return questionDisplay.label
                                        ? `${questionDisplay.label} (${code})`
                                        : code;
                                    })
                                    .filter(Boolean);

                                  return (
                                    <div key={`recommendation-${group.priority}-${index}`} className="question-review-card esg-recommendation-card">
                                      <div className="flag-card-head">
                                        <span className={`esg-badge esg-priority-${item.priority?.toLowerCase()}`}>
                                          {getPriorityLabel(item.priority)}
                                        </span>
                                        <span className="esg-badge esg-pillar-badge">
                                          {getPillarLabel(item.pillar)}
                                        </span>
                                      </div>
                                      <p className="recommendation-action">{item.title}</p>
                                      {sourceReferences.length ? (
                                        <p><strong>Références :</strong> {sourceReferences.join(", ")}</p>
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null
                        )
                      )}
                    </article>

                    <article className="stack">
                      <h4>Détail par section</h4>
                      {!esgResult.sectionBreakdown?.length ? (
                        <p className="muted-text">Aucun détail de section disponible.</p>
                      ) : (
                        esgResult.sectionBreakdown.map((item) => (
                          <details key={item.sectionCode} className="panel accordion-panel esg-section-card">
                            <summary>
                              <div className="accordion-summary-row">
                                <span>{item.sectionTitle}</span>
                                <span className="esg-badge esg-pillar-badge">{getPillarLabel(item.pillar)}</span>
                              </div>
                            </summary>
                            <div className="stack accordion-body">
                              <div className="section-header">
                                <strong className="score-card-value">{item.score}</strong>
                                <span className="muted-text">{getScoreInterpretation(item.score)}</span>
                              </div>
                              <div className="progress-track">
                                <div
                                  className={`progress-bar progress-bar-${(item.pillar || "").toLowerCase()}`}
                                  style={{ width: `${Math.max(0, Math.min(item.score || 0, 100))}%` }}
                                />
                              </div>
                              <p><strong>Synthèse :</strong> {item.summary}</p>
                            </div>
                          </details>
                        ))
                      )}
                    </article>
                  </>
                ) : null}
              </section>
            ) : null}

            {activeTab === "observations" ? (
              <section className="panel stack">
                <h3>Observations administrateur</h3>
                <p className="muted-text">
                  Décision et plan d’action correctif — à venir.
                </p>
              </section>
            ) : null}
          </>
        ) : null}
      </section>
    </Layout>
  );
}

export default AdminApplicationDetail;
