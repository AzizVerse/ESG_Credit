import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import api from "../api/client";
import Layout from "../components/Layout";

const CATEGORY_CONFIG = [
  { prefix: "CAT_A_", title: "Catégorie A" },
  { prefix: "CAT_BP_", title: "Catégorie B+" },
  { prefix: "CAT_B_", title: "Catégorie B" },
  { prefix: "CAT_C_", title: "Catégorie C" },
  { prefix: "CAT_FI_", title: "Catégorie FI" },
];

const SECTION_DOCUMENT_TYPES = {
  REGULATORY_COMPLIANCE: "REGULATORY_COMPLIANCE",
  CERTIFICATIONS: "CERTIFICATIONS",
  PERFORMANCE_STANDARD_1: "PERFORMANCE_STANDARD_1",
  PERFORMANCE_STANDARD_2_HS_BLOC_1: "PERFORMANCE_STANDARD_2_HS",
  PERFORMANCE_STANDARD_2_HS_BLOC_2: "PERFORMANCE_STANDARD_2_HS",
  PERFORMANCE_STANDARD_2_HR: "PERFORMANCE_STANDARD_2_HR",
  PERFORMANCE_STANDARD_3_LIQUID_WASTE: "PERFORMANCE_STANDARD_3_LIQUID_WASTE",
  PERFORMANCE_STANDARD_3_SOLID_WASTE: "PERFORMANCE_STANDARD_3_SOLID_WASTE",
  PERFORMANCE_STANDARD_3_AIR_EMISSIONS: "PERFORMANCE_STANDARD_3_AIR_EMISSIONS",
  PERFORMANCE_STANDARD_3_HAZARDOUS_MATERIALS: "PERFORMANCE_STANDARD_3_HAZARDOUS_MATERIALS",
  PERFORMANCE_STANDARD_3_EMERGENCY_PREPAREDNESS: "PERFORMANCE_STANDARD_3_EMERGENCY_PREPAREDNESS",
  PERFORMANCE_STANDARD_4: "PERFORMANCE_STANDARD_4",
  PERFORMANCE_STANDARD_5: "PERFORMANCE_STANDARD_5",
  PERFORMANCE_STANDARD_6: "PERFORMANCE_STANDARD_6",
  PERFORMANCE_STANDARD_7: "PERFORMANCE_STANDARD_7",
  PERFORMANCE_STANDARD_8: "PERFORMANCE_STANDARD_8",
  CLIMATE_QUESTIONS: "CLIMATE_QUESTIONS",
};

const HR_EFFECTIFS_GROUP_1 = [
  ["Cadres", "NP2_HR_EFFECTIFS_CADRES_HOMMES", "NP2_HR_EFFECTIFS_CADRES_FEMMES"],
  ["Maîtrise", "NP2_HR_EFFECTIFS_MAITRISE_HOMMES", "NP2_HR_EFFECTIFS_MAITRISE_FEMMES"],
  ["Agents d’exécution", "NP2_HR_EFFECTIFS_AGENTS_HOMMES", "NP2_HR_EFFECTIFS_AGENTS_FEMMES"],
];

const HR_EFFECTIFS_GROUP_2 = [
  ["Personnel permanent", "NP2_HR_EFFECTIFS_PERMANENT_HOMMES", "NP2_HR_EFFECTIFS_PERMANENT_FEMMES"],
  ["Personnel intérimaire", "NP2_HR_EFFECTIFS_INTERIMAIRE_HOMMES", "NP2_HR_EFFECTIFS_INTERIMAIRE_FEMMES"],
];

function buildInitialAnswers(sections, existingAnswers) {
  return sections.reduce((accumulator, section) => {
    for (const question of section.questions || []) {
      const existingAnswer = existingAnswers.find(
        (answer) => answer.questionCode === question.code
      );

      accumulator[question.code] = {
        section: section.code,
        questionCode: question.code,
        answerValue: existingAnswer?.answerValue || "",
        answerLabel: existingAnswer?.answerLabel || "",
        comment: existingAnswer?.comment || "",
      };
    }

    return accumulator;
  }, {});
}

function buildAnswerList(sections, answers) {
  return sections
    .flatMap((section) =>
      (section.questions || []).map((question) => {
        const currentAnswer = answers[question.code] || {
          section: section.code,
          questionCode: question.code,
          answerValue: "",
          answerLabel: "",
          comment: "",
        };

        return {
          section: section.code,
          questionCode: question.code,
          answerValue: currentAnswer.answerValue,
          answerLabel: currentAnswer.answerLabel,
          comment: currentAnswer.comment,
        };
      })
    )
    .filter((answer) => answer.answerValue !== "");
}

function groupCategorizationQuestions(questions) {
  const grouped = CATEGORY_CONFIG.map((category) => ({
    ...category,
    questions: questions.filter((question) => question.code.startsWith(category.prefix)),
  })).filter((category) => category.questions.length > 0);

  const uncategorizedQuestions = questions.filter(
    (question) => !CATEGORY_CONFIG.some((category) => question.code.startsWith(category.prefix))
  );

  if (uncategorizedQuestions.length > 0) {
    grouped.push({
      prefix: "OTHER",
      title: "Autres questions",
      questions: uncategorizedQuestions,
    });
  }

  return grouped;
}

function getDefaultOptions(questionType) {
  if (questionType === "BOOLEAN") {
    return [
      { value: "YES", label: "Oui" },
      { value: "NO", label: "Non" },
    ];
  }

  return [];
}

function getSectionUploadType(sectionCode) {
  return SECTION_DOCUMENT_TYPES[sectionCode] || null;
}

function groupAttachmentsByDocumentType(attachments) {
  return attachments.reduce((accumulator, attachment) => {
    const key = attachment.documentType || "OTHER";
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(attachment);
    return accumulator;
  }, {});
}

function getQuestionMap(section) {
  return (section.questions || []).reduce((accumulator, question) => {
    accumulator[question.code] = question;
    return accumulator;
  }, {});
}

function parseTableAnswer(answerValue, metadata) {
  if (!answerValue) {
    return metadata?.initialRows ? JSON.parse(JSON.stringify(metadata.initialRows)) : [{}];
  }

  try {
    const parsed = JSON.parse(answerValue);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {}

  return metadata?.initialRows ? JSON.parse(JSON.stringify(metadata.initialRows)) : [{}];
}

function canAddTableRows(metadata) {
  return Boolean(metadata?.allowAddRows);
}

function parseMultipleChoiceAnswer(answerValue) {
  if (!answerValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(answerValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function ApplicationFormPage() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [sections, setSections] = useState([]);
  const [answers, setAnswers] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingSectionCode, setUploadingSectionCode] = useState("");
  const [expandedGroups, setExpandedGroups] = useState(() =>
    CATEGORY_CONFIG.reduce((accumulator, group) => {
      accumulator[group.prefix] = true;
      return accumulator;
    }, {})
  );

  useEffect(() => {
    async function loadPage() {
      try {
        const [applicationResponse, answersResponse, formResponse, attachmentsResponse] =
          await Promise.all([
            api.get(`/applications/my/${id}`),
            api.get(`/applications/my/${id}/answers`),
            api.get("/forms/active"),
            api.get(`/applications/my/${id}/attachments`),
          ]);

        const resolvedSections = (formResponse.data.data?.sections || []).map((section) => ({
          ...section,
          questions: Array.isArray(section.questions) ? section.questions : [],
        }));

        setApplication(applicationResponse.data.data);
        setSections(resolvedSections);
        setAnswers(buildInitialAnswers(resolvedSections, answersResponse.data.data || []));
        setAttachments(attachmentsResponse.data.data || []);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Chargement de la demande impossible"
        );
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [id]);

  const activeSection = sections[activeSectionIndex] || null;
  const activeQuestionMap = useMemo(
    () => (activeSection ? getQuestionMap(activeSection) : {}),
    [activeSection]
  );
  const answerList = useMemo(() => buildAnswerList(sections, answers), [sections, answers]);
  const attachmentsByDocumentType = useMemo(
    () => groupAttachmentsByDocumentType(attachments),
    [attachments]
  );

  function handleAnswerChange(sectionCode, questionCode, nextValues) {
    setAnswers((current) => ({
      ...current,
      [questionCode]: {
        section: sectionCode,
        questionCode,
        answerValue: "",
        answerLabel: "",
        comment: "",
        ...current[questionCode],
        ...nextValues,
      },
    }));
  }

  function handleTableCellChange(sectionCode, questionCode, rowIndex, key, value, metadata) {
    const currentAnswer = answers[questionCode] || {};
    const rows = parseTableAnswer(currentAnswer.answerValue, metadata);
    const nextRows = rows.map((row, index) =>
      index === rowIndex ? { ...row, [key]: value } : row
    );

    handleAnswerChange(sectionCode, questionCode, {
      answerValue: JSON.stringify(nextRows),
      answerLabel: "Tableau renseigné",
    });
  }

  function handleAddTableRow(sectionCode, questionCode, metadata) {
    const currentAnswer = answers[questionCode] || {};
    const rows = parseTableAnswer(currentAnswer.answerValue, metadata);
    const nextRow = (metadata?.columns || []).reduce((accumulator, column) => {
      accumulator[column.key] = "";
      return accumulator;
    }, {});
    const nextRows = [...rows, nextRow];

    handleAnswerChange(sectionCode, questionCode, {
      answerValue: JSON.stringify(nextRows),
      answerLabel: "Tableau renseigné",
    });
  }

  function handleRemoveTableRow(sectionCode, questionCode, rowIndex, metadata) {
    const currentAnswer = answers[questionCode] || {};
    const rows = parseTableAnswer(currentAnswer.answerValue, metadata);
    const nextRows = rows.filter((_, index) => index !== rowIndex);

    handleAnswerChange(sectionCode, questionCode, {
      answerValue: JSON.stringify(nextRows.length ? nextRows : [{}]),
      answerLabel: "Tableau renseigné",
    });
  }

  async function handleSaveAnswers() {
    setStatusMessage("");
    setError("");
    setSaving(true);

    try {
      await api.put(`/applications/my/${id}/answers`, {
        answers: answerList,
      });
      setStatusMessage("Réponses enregistrées.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Enregistrement des réponses impossible");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitApplication() {
    setStatusMessage("");
    setError("");
    setSubmitting(true);

    try {
      const response = await api.post(`/applications/my/${id}/submit`);
      setApplication(response.data.data);
      setStatusMessage("Demande soumise.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Soumission de la demande impossible");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSectionUpload(sectionCode, files) {
    const documentType = getSectionUploadType(sectionCode);

    if (!documentType || !files?.length) {
      return;
    }

    setStatusMessage("");
    setError("");
    setUploadingSectionCode(sectionCode);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentType", documentType);
        await api.post(`/applications/my/${id}/attachments`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      const attachmentsResponse = await api.get(`/applications/my/${id}/attachments`);
      setAttachments(attachmentsResponse.data.data || []);
      setStatusMessage("Pièces justificatives ajoutées.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Ajout des pièces justificatives impossible"
      );
    } finally {
      setUploadingSectionCode("");
    }
  }

  function toggleGroup(prefix) {
    setExpandedGroups((current) => ({
      ...current,
      [prefix]: !current[prefix],
    }));
  }

  function renderInputByType(section, question, currentAnswer, isDraft) {
    const options =
      question.options && question.options.length > 0
        ? question.options
        : getDefaultOptions(question.type);

    if (question.type === "BOOLEAN" || question.type === "SINGLE_CHOICE") {
      return (
        <div className="button-row">
          {options.map((option) => (
            <label key={option.value} className="ghost-button">
              <input
                type="radio"
                name={question.code}
                value={option.value}
                checked={currentAnswer.answerValue === option.value}
                onChange={() =>
                  handleAnswerChange(section.code, question.code, {
                    answerValue: option.value,
                    answerLabel: option.label,
                  })
                }
                disabled={!isDraft}
              />{" "}
              {option.label}
            </label>
          ))}
        </div>
      );
    }

    if (question.type === "MULTIPLE_CHOICE") {
      const selectedValues = parseMultipleChoiceAnswer(currentAnswer.answerValue);

      return (
        <div className="stack">
          {options.map((option) => {
            const checked = selectedValues.includes(option.value);

            return (
              <label key={option.value} className="ghost-button">
                <input
                  type="checkbox"
                  value={option.value}
                  checked={checked}
                  onChange={(event) => {
                    const nextValues = event.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((value) => value !== option.value);
                    const nextLabels = options
                      .filter((candidate) => nextValues.includes(candidate.value))
                      .map((candidate) => candidate.label);

                    handleAnswerChange(section.code, question.code, {
                      answerValue: JSON.stringify(nextValues),
                      answerLabel: nextLabels.join(", "),
                    });
                  }}
                  disabled={!isDraft}
                />{" "}
                {option.label}
              </label>
            );
          })}
        </div>
      );
    }

    if (question.type === "TEXT") {
      return (
        <label className="field">
          <span>Réponse</span>
          <input
            value={currentAnswer.answerValue}
            onChange={(event) =>
              handleAnswerChange(section.code, question.code, {
                answerValue: event.target.value,
                answerLabel: event.target.value,
              })
            }
            disabled={!isDraft}
          />
        </label>
      );
    }

    if (question.type === "TEXTAREA") {
      return (
        <label className="field">
          <span>Réponse</span>
          <textarea
            rows="4"
            value={currentAnswer.answerValue}
            onChange={(event) =>
              handleAnswerChange(section.code, question.code, {
                answerValue: event.target.value,
                answerLabel: event.target.value,
              })
            }
            disabled={!isDraft}
          />
        </label>
      );
    }

    if (question.type === "DATE") {
      return (
        <label className="field">
          <span>Réponse</span>
          <input
            type="date"
            value={currentAnswer.answerValue}
            onChange={(event) =>
              handleAnswerChange(section.code, question.code, {
                answerValue: event.target.value,
                answerLabel: event.target.value,
              })
            }
            disabled={!isDraft}
          />
        </label>
      );
    }

    if (question.type === "NUMBER") {
      return (
        <label className="field">
          <span>Réponse</span>
          <input
            type="number"
            value={currentAnswer.answerValue}
            onChange={(event) =>
              handleAnswerChange(section.code, question.code, {
                answerValue: event.target.value,
                answerLabel: event.target.value,
              })
            }
            disabled={!isDraft}
          />
        </label>
      );
    }

    return null;
  }

  function renderTableQuestion(section, question) {
    const metadata = question.metadata || {};
    const columns = metadata.columns || [];
    const rows = parseTableAnswer(answers[question.code]?.answerValue, metadata);
    const allowAddRows = canAddTableRows(metadata);
    const isDraft = application?.status === "DRAFT";

    return (
      <article key={question.code} className="data-card">
        <h3>{question.label}</h3>
        {question.helpText ? <p className="muted-text">{question.helpText}</p> : null}
        <table>
          <thead>
            <tr>
              {rows[0] && Object.prototype.hasOwnProperty.call(rows[0], "label") ? <th>Ligne</th> : null}
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
              {allowAddRows ? <th>Action</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${question.code}-${rowIndex}`}>
                {Object.prototype.hasOwnProperty.call(row, "label") ? <td>{row.label}</td> : null}
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.type === "choice" ? (
                      <select
                        value={row[column.key] || ""}
                        onChange={(event) =>
                          handleTableCellChange(
                            section.code,
                            question.code,
                            rowIndex,
                            column.key,
                            event.target.value,
                            metadata
                          )
                        }
                        disabled={!isDraft}
                      >
                        <option value="">-</option>
                        {(column.options || []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={column.type === "number" ? "number" : "text"}
                        value={row[column.key] || ""}
                        onChange={(event) =>
                          handleTableCellChange(
                            section.code,
                            question.code,
                            rowIndex,
                            column.key,
                            event.target.value,
                            metadata
                          )
                        }
                        disabled={!isDraft}
                      />
                    )}
                  </td>
                ))}
                {allowAddRows ? (
                  <td>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() =>
                        handleRemoveTableRow(section.code, question.code, rowIndex, metadata)
                      }
                      disabled={!isDraft}
                    >
                      Supprimer
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        {allowAddRows ? (
          <button
            type="button"
            className="ghost-button"
            onClick={() => handleAddTableRow(section.code, question.code, metadata)}
            disabled={!isDraft}
          >
            Ajouter une ligne
          </button>
        ) : null}
      </article>
    );
  }

  function renderQuestion(section, question) {
    if (question.type === "TABLE") {
      return renderTableQuestion(section, question);
    }

    const currentAnswer = answers[question.code] || {
      section: section.code,
      questionCode: question.code,
      answerValue: "",
      answerLabel: "",
      comment: "",
    };
    const isDraft = application?.status === "DRAFT";

    return (
      <article key={question.code} className="question-card">
        <h3>{question.label}</h3>
        {question.helpText ? <p className="muted-text">{question.helpText}</p> : null}
        {renderInputByType(section, question, currentAnswer, isDraft)}
        {question.hasComment ? (
          <label className="field">
            <span>Commentaire</span>
            <textarea
              rows="3"
              value={currentAnswer.comment}
              onChange={(event) =>
                handleAnswerChange(section.code, question.code, {
                  comment: event.target.value,
                })
              }
              placeholder="Commentaire facultatif"
              disabled={!isDraft}
            />
          </label>
        ) : null}
      </article>
    );
  }

  function renderNumberCell(sectionCode, questionCode) {
    const currentAnswer = answers[questionCode] || { answerValue: "" };
    return (
      <input
        type="number"
        value={currentAnswer.answerValue}
        onChange={(event) =>
          handleAnswerChange(sectionCode, questionCode, {
            answerValue: event.target.value,
            answerLabel: event.target.value,
          })
        }
        disabled={application?.status !== "DRAFT"}
      />
    );
  }

  function renderHrSection(section) {
    const excludedCodes = new Set(
      [
        ...HR_EFFECTIFS_GROUP_1.flatMap((row) => [row[1], row[2]]),
        ...HR_EFFECTIFS_GROUP_2.flatMap((row) => [row[1], row[2]]),
      ]
    );

    const organizationCodes = new Set(["NP2_HR_ORG_001", "NP2_HR_ORG_002", "NP2_HR_ORG_003"]);
    const supplierCodes = new Set(["NP2_HR_SUPPLIERS_001", "NP2_HR_SUPPLIERS_001_DETAILS"]);
    const effectifQuestions = (section.questions || []).filter((question) => excludedCodes.has(question.code));
    const organizationQuestions = (section.questions || []).filter((question) => organizationCodes.has(question.code));
    const supplierQuestions = (section.questions || []).filter((question) => supplierCodes.has(question.code));
    const otherQuestions = (section.questions || []).filter(
      (question) =>
        !excludedCodes.has(question.code) &&
        !organizationCodes.has(question.code) &&
        !supplierCodes.has(question.code)
    );

    return (
      <>
        {effectifQuestions.length ? (
          <article className="data-card">
            <h3>1 — Effectifs</h3>
            <table>
              <thead>
                <tr>
                  <th>Catégorie</th>
                  <th>Hommes</th>
                  <th>Femmes</th>
                </tr>
              </thead>
              <tbody>
                {HR_EFFECTIFS_GROUP_1.map(([label, menCode, womenCode]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    <td>{renderNumberCell(section.code, menCode)}</td>
                    <td>{renderNumberCell(section.code, womenCode)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Hommes</th>
                  <th>Femmes</th>
                </tr>
              </thead>
              <tbody>
                {HR_EFFECTIFS_GROUP_2.map(([label, menCode, womenCode]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    <td>{renderNumberCell(section.code, menCode)}</td>
                    <td>{renderNumberCell(section.code, womenCode)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        ) : null}

        {organizationQuestions.length ? (
          <article className="data-card">
            <h3>2 — Organisation du travail</h3>
            {organizationQuestions.map((question) => renderQuestion(section, question))}
          </article>
        ) : null}

        {otherQuestions.map((question) => renderQuestion(section, question))}

        {supplierQuestions.length ? (
          <article className="data-card">
            <h3>Gestion des sous-traitants et fournisseurs</h3>
            {supplierQuestions.map((question) => renderQuestion(section, question))}
          </article>
        ) : null}
      </>
    );
  }

  function renderSectionUpload(section) {
    const documentType = getSectionUploadType(section.code);

    if (!documentType) {
      return null;
    }

    const sectionAttachments = attachmentsByDocumentType[documentType] || [];
    const helperText =
      section.code === "PERFORMANCE_STANDARD_2_HR"
        ? "Ajoutez les documents justificatifs liés à la gestion des ressources humaines."
        : section.code === "CLIMATE_QUESTIONS"
          ? "Ajoutez les documents justificatifs liés aux questions climatiques."
        : section.code === "PERFORMANCE_STANDARD_4"
          ? "Ajoutez les documents justificatifs liés à la santé, sécurité et sûreté des communautés."
          : section.code === "PERFORMANCE_STANDARD_5"
            ? "Ajoutez les documents justificatifs liés à l’acquisition de terres et à la réinstallation involontaire."
            : section.code === "PERFORMANCE_STANDARD_6"
              ? "Ajoutez les documents justificatifs liés à la biodiversité et aux ressources naturelles."
              : section.code === "PERFORMANCE_STANDARD_7"
                ? "Ajoutez les documents justificatifs liés aux peuples autochtones."
                : section.code === "PERFORMANCE_STANDARD_8"
                  ? "Ajoutez les documents justificatifs liés au patrimoine culturel."
                  : "Ajoutez les documents justificatifs liés à cette section.";

    return (
      <article className="data-card">
        <h3>Pièces justificatives</h3>
        <p className="muted-text">{helperText}</p>

        <label className="field">
          <span>Pièces justificatives</span>
          <input
            type="file"
            multiple
            onChange={(event) => handleSectionUpload(section.code, event.target.files)}
            disabled={application?.status !== "DRAFT" || uploadingSectionCode === section.code}
          />
        </label>

        {sectionAttachments.length ? (
          <div className="stack">
            {sectionAttachments.map((attachment) => (
              <div key={attachment.id} className="answer-row">
                <p>{attachment.originalName || attachment.fileName}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted-text">Aucune pièce justificative ajoutée.</p>
        )}
      </article>
    );
  }

  return (
    <Layout
      title="Évaluation SGES"
      subtitle="Vous pouvez enregistrer vos réponses à tout moment et revenir plus tard."
    >
      <section className="panel">
        {loading ? <p className="muted-text">Chargement de la demande...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {application && activeSection ? (
          <>
            <div className="section-header">
              <div>
                <h2>{application.projectName}</h2>
                <p className="muted-text">{application.projectType}</p>
                <p className="muted-text">
                  Section {activeSectionIndex + 1} / {sections.length}
                </p>
              </div>
              <span className="status-pill">{application.status}</span>
            </div>

            <div className="progress-track" aria-hidden="true">
              <div
                className="progress-bar"
                style={{
                  width: `${((activeSectionIndex + 1) / Math.max(sections.length, 1)) * 100}%`,
                }}
              />
            </div>

            <div className="section-nav-grid">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  type="button"
                  className={
                    index === activeSectionIndex
                      ? "section-nav-button section-nav-button-active"
                      : "section-nav-button"
                  }
                  onClick={() => setActiveSectionIndex(index)}
                >
                  <span className="section-nav-index">{index + 1}</span>
                  <span>{section.title}</span>
                </button>
              ))}
            </div>

            <div className="stack">
              <section className="stack">
                <div>
                  <h3>{activeSection.title}</h3>
                  {activeSection.description ? (
                    <p className="muted-text" style={{ whiteSpace: "pre-line" }}>
                      {activeSection.description}
                    </p>
                  ) : null}
                </div>

                {activeSection.code === "CATEGORIZATION"
                  ? groupCategorizationQuestions(activeSection.questions || []).map((group) => (
                      <div key={group.prefix} className="stack">
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => toggleGroup(group.prefix)}
                        >
                          {expandedGroups[group.prefix] ? "Masquer" : "Afficher"} {group.title}
                        </button>
                        {expandedGroups[group.prefix]
                          ? group.questions.map((question) => renderQuestion(activeSection, question))
                          : null}
                      </div>
                    ))
                  : activeSection.code === "PERFORMANCE_STANDARD_2_HR"
                    ? renderHrSection(activeSection)
                    : (activeSection.questions || []).map((question) =>
                        renderQuestion(activeSection, question)
                      )}

                {renderSectionUpload(activeSection)}
              </section>
            </div>

            {statusMessage ? <p className="success-text">{statusMessage}</p> : null}

            <div className="button-row">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setActiveSectionIndex((current) => Math.max(current - 1, 0))}
                disabled={activeSectionIndex === 0}
              >
                Précédent
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={handleSaveAnswers}
                disabled={saving || application.status !== "DRAFT"}
              >
                {saving ? "Enregistrement..." : "Enregistrer les réponses"}
              </button>

              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setActiveSectionIndex((current) => Math.min(current + 1, sections.length - 1))
                }
                disabled={activeSectionIndex === sections.length - 1}
              >
                Suivant
              </button>
            </div>

            {activeSectionIndex === sections.length - 1 ? (
              <div className="button-row">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleSubmitApplication}
                  disabled={submitting || application.status !== "DRAFT"}
                >
                  {submitting ? "Soumission..." : "Soumettre la demande"}
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </Layout>
  );
}

export default ApplicationFormPage;
