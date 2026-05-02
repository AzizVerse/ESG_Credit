import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

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

function AdminApplicationDetail() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [formMetadata, setFormMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("resume");

  useEffect(() => {
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

  const tabs = [
    { id: "resume", label: "Résumé" },
    { id: "profile", label: "Signalétique du projet" },
    { id: "attachments", label: "Pièces justificatives" },
    { id: "answers", label: "Réponses SGES" },
    { id: "observations", label: "Observations administrateur" },
  ];

  return (
    <Layout
      title="Examen de la demande"
      subtitle="Analyse détaillée du dossier SGES soumis par l’entreprise."
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
