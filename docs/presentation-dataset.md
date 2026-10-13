# EQUORA Presentation Dataset

All companies, contacts and evidence are fictional. Scores below are calculated by the existing engine with the currently saved sector settings.

## Access

Administrator: admin@test.com (existing password preserved). Company demonstration accounts use password 123456.

## Scenario Matrix

| Company | Sector | Status | Category | Risk | ESG score | Flags | Company login |
|---|---|---|---|---|---:|---:|---|
| Atlas Digital Solutions | Technology | SUBMITTED | C | Faible | 84.04 | 0 | atlas-tech.demo@test.com |
| Meridian Cloud Infrastructure | Technology | UNDER_REVIEW | B | Modéré | 79.02 | 2 | meridian-cloud.demo@test.com |
| Carthage Materials | Industrie lourde | UNDER_REVIEW | A | Modéré | 93.19 | 0 | carthage-materials.demo@test.com |
| Nord Metals Processing | Industrie lourde | SUBMITTED | A | Élevé | 44.41 | 15 | nord-metals.demo@test.com |
| Sahel Responsible Textiles | Textile | UNDER_REVIEW | B+ | Modéré | 95.27 | 0 | sahel-textile.demo@test.com |
| DyeWorks Sahel | Textile | SUBMITTED | B+ | Élevé | 66.86 | 7 | dyeworks-sahel.demo@test.com |
| Cap Bon Food Processing | Agroalimentaire | SUBMITTED | B+ | Modéré | 97.41 | 0 | capbon-food.demo@test.com |
| Oasis Cold Chain | Agroalimentaire | DRAFT | B+ | Not calculated | - | - | oasis-coldchain.demo@test.com |
| Medina Civil Infrastructure | BTP / construction | UNDER_REVIEW | A | Substantiel | 76.58 | 0 | medina-civil.demo@test.com |
| Urban Build Services | BTP / construction | SUBMITTED | B | Not calculated | - | - | urban-build.demo@test.com |
| GreenRoute Logistics | Transport | SUBMITTED | B+ | Modéré | 94.93 | 0 | greenroute.demo@test.com |
| SouthLink Freight | Transport | DRAFT | B+ | Not calculated | - | - | southlink.demo@test.com |

## Suggested Presentation Flow

1. Dashboard: six sectors, score distribution, all risk levels, and missing assessments.
2. Atlas Digital Solutions versus Meridian Cloud: technology C versus B physical exposure.
3. Carthage Materials versus Nord Metals: same inherent category A, different controls and residual risks.
4. DyeWorks Sahel: labor safeguards, effluent and chemical controls, red flags and recommendations.
5. Cap Bon Food Processing: sector-specific food safety and wastewater evidence.
6. Medina Civil Infrastructure: community engagement and involuntary resettlement with mitigation details.
7. Urban Build Services: complete submitted application awaiting initial calculation.
8. Oasis Cold Chain and SouthLink Freight: incomplete drafts, save-and-continue and unknown controls.
9. Sector configuration: update a 100% weight distribution, then review the recalculation confirmation.

## Regeneration

npm run seed:demo replaces DEMO companies only and backs up the database. npm run seed:presentation:reset replaces all business records and non-primary users; use only in a disposable demonstration environment.

Scoring settings and active questionnaire templates are preserved. No approvals, rejections or committee decisions are seeded.

Database backup: C:\Users\USER\Desktop\ESG\backups\before-presentation-2026-10-13T20-48-51-923Z.db
