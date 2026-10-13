# IFC-based exclusion screening

Source: https://www.ifc.org/en/what-we-do/sector-expertise/sustainability/ifc-exclusion-list-2007

Policy snapshot: EQUORA_IFC_2007_WEB_2026-10_V1. Screening is separate from the unchanged ESG formulas. This is not IFC certification or independent legal verification.

Ordinary FI financing is the default because this is a bank's borrower-screening platform. Only admins can select microfinance or trade finance; the borrower's sector does not determine financing scope.

Explicit qualified YES declarations cause automatic refusal at submission (or when an admin screens an already-submitted legacy application). UNKNOWN declarations require eligibility review and block scoring. Unanswered declarations prevent submission. Legacy data is NOT_SCREENED, never implicitly eligible. No keyword-based rejection or automatic reasonableness waiver is applied.

Weapons, tobacco, spirits and gambling questions explicitly qualify substantial involvement; beer/wine, permitted bonded asbestos and short drift nets are not positive declarations. If substantial involvement, legality, volume, forestry origin or consent is uncertain, select UNKNOWN. Definitions and thresholds require bank/compliance validation before production use.

Screening answers are locked for enterprises after submission. Admins can correct submitted/review declarations until refusal; refused applications are locked, with no appeal/reopening workflow in this phase. Append-only event rows retain the actor, answers, outcome, financing scope and policy version. No human credit approval or committee decision is introduced.

Existing questionnaire answers do not cover all exclusions: dedicated declarations are mandatory for new submissions. Supporting evidence still uses existing document uploads. The platform does not validate truthfulness independently.

Run `npx prisma migrate deploy` and `npx prisma generate`, then restart the backend. Test with `node --test scripts/exclusions.test.cjs` and `npx vite build --config vite.config.mjs`.

Manual QA: open an enterprise draft, answer and save every screening item, then submit. Test NO throughout, one YES, one UNKNOWN, and missing answers using separate test applications. Verify refusal reasons and audit history on the admin detail page; verify counts at /admin and grouping at /admin/exclusions. Verify an enterprise cannot access /api/exclusions/admin/summary, cannot set financing scope and cannot edit another company's screening. Existing demo applications will appear as Not screened until explicitly screened; no demo answers are invented or overwritten.
