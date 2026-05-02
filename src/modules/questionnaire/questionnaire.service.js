const { PrismaClient } = require("@prisma/client");

const ApiError = require("../../utils/apiError");

const prisma = new PrismaClient();

async function getOwnedApplication(user, applicationId) {
  if (!user?.companyId) {
    throw new ApiError("Enterprise user must belong to a company", 400);
  }

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      companyId: user.companyId,
    },
  });

  if (!application) {
    throw new ApiError("Application not found", 404);
  }

  return application;
}

function normalizeAnswers(answers) {
  if (!Array.isArray(answers) || answers.length === 0) {
    throw new ApiError("answers must be a non-empty array", 400);
  }

  return answers.map((answer) => {
    const section = String(answer?.section || "").trim();
    const questionCode = String(answer?.questionCode || "").trim();
    const answerValue = String(answer?.answerValue || "").trim();

    if (!section || !questionCode || !answerValue) {
      throw new ApiError("section, questionCode, and answerValue are required", 400);
    }

    return {
      section,
      questionCode,
      answerValue,
      answerLabel: answer?.answerLabel ? String(answer.answerLabel).trim() : null,
      comment: answer?.comment ? String(answer.comment).trim() : null,
    };
  });
}

async function saveMyAnswers(user, applicationId, answers) {
  await getOwnedApplication(user, applicationId);

  const normalizedAnswers = normalizeAnswers(answers);

  const savedAnswers = await prisma.$transaction(
    normalizedAnswers.map((answer) =>
      prisma.questionnaireAnswer.upsert({
        where: {
          applicationId_questionCode: {
            applicationId,
            questionCode: answer.questionCode,
          },
        },
        update: {
          section: answer.section,
          answerValue: answer.answerValue,
          answerLabel: answer.answerLabel,
          comment: answer.comment,
        },
        create: {
          applicationId,
          section: answer.section,
          questionCode: answer.questionCode,
          answerValue: answer.answerValue,
          answerLabel: answer.answerLabel,
          comment: answer.comment,
        },
      })
    )
  );

  return savedAnswers;
}

async function getMyAnswers(user, applicationId) {
  await getOwnedApplication(user, applicationId);

  return prisma.questionnaireAnswer.findMany({
    where: { applicationId },
    orderBy: [{ section: "asc" }, { questionCode: "asc" }],
  });
}

async function getAnswersByApplication(applicationId) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new ApiError("Application not found", 404);
  }

  return prisma.questionnaireAnswer.findMany({
    where: { applicationId },
    orderBy: [{ section: "asc" }, { questionCode: "asc" }],
  });
}

module.exports = {
  saveMyAnswers,
  getMyAnswers,
  getAnswersByApplication,
};
