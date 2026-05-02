const { PrismaClient } = require("@prisma/client");

const ApiError = require("../../utils/apiError");

const prisma = new PrismaClient();

function getActiveFormInclude() {
  return {
    sections: {
      orderBy: { order: "asc" },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            options: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    },
  };
}

async function getActiveTemplateOrThrow() {
  const formTemplate = await prisma.formTemplate.findFirst({
    where: { isActive: true },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: getActiveFormInclude(),
  });

  if (!formTemplate) {
    throw new ApiError("Aucun formulaire actif trouve", 404);
  }

  return formTemplate;
}

async function getActiveForm() {
  return getActiveTemplateOrThrow();
}

async function getSections() {
  const formTemplate = await getActiveTemplateOrThrow();
  return formTemplate.sections;
}

async function getSectionQuestions(sectionId) {
  const formTemplate = await getActiveTemplateOrThrow();
  const section = formTemplate.sections.find((item) => item.id === sectionId);

  if (!section) {
    throw new ApiError("Section introuvable dans le formulaire actif", 404);
  }

  return section.questions;
}

module.exports = {
  getActiveForm,
  getSections,
  getSectionQuestions,
};
