"""Generate explicitly fictional evidence notes for the EQUORA demonstration dataset."""
import json
import subprocess
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "prisma" / "presentation-documents"
OUTPUT.mkdir(parents=True, exist_ok=True)
scenarios = json.loads(subprocess.check_output(["node", "-e", "process.stdout.write(JSON.stringify(require('./prisma/presentation.scenarios')))"], cwd=ROOT, text=True))
NAVY = colors.HexColor("#102f3d")
SAGE = colors.HexColor("#b9d8a6")
BODY = ParagraphStyle("Body", fontName="Helvetica", fontSize=10, leading=16, textColor=NAVY, spaceAfter=10)
TITLE = ParagraphStyle("Title", parent=BODY, fontName="Helvetica-Bold", fontSize=19, leading=24, spaceAfter=16)
LABEL = ParagraphStyle("Label", parent=BODY, fontName="Helvetica-Bold", fontSize=10, leading=16)
TYPES = {
    "PROJECT_PROFILE": "Project profile summary",
    "REGULATORY_COMPLIANCE": "Regulatory status summary",
    "CERTIFICATIONS": "Declared certification summary",
    "PERFORMANCE_STANDARD_1": "Environmental and social management summary",
    "PERFORMANCE_STANDARD_2_HS": "Workplace safety summary",
    "PERFORMANCE_STANDARD_2_HR": "Workforce and employment summary",
    "PERFORMANCE_STANDARD_3_LIQUID_WASTE": "Wastewater control summary",
    "PERFORMANCE_STANDARD_3_AIR_EMISSIONS": "Air emissions control summary",
    "PERFORMANCE_STANDARD_3_HAZARDOUS_MATERIALS": "Hazardous material control summary",
    "PERFORMANCE_STANDARD_4": "Community engagement summary",
    "PERFORMANCE_STANDARD_5": "Resettlement mitigation summary",
    "CLIMATE_QUESTIONS": "Energy transition summary",
}

def paragraph(text, style=BODY):
    return Paragraph(escape(str(text)), style)

def page_frame(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, A4[1] - 35 * mm, A4[0], 35 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 20)
    canvas.drawString(20 * mm, A4[1] - 18 * mm, "EQUORA")
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(SAGE)
    canvas.drawString(20 * mm, A4[1] - 26 * mm, "DEMONSTRATION ONLY - FICTIONAL EVIDENCE")
    canvas.setFillColor(colors.HexColor("#647977"))
    canvas.setFont("Helvetica", 8)
    canvas.drawString(20 * mm, 15 * mm, "Synthetic presentation data. Not valid for credit or compliance decisions.")
    canvas.drawRightString(A4[0] - 20 * mm, 15 * mm, str(doc.page))
    canvas.restoreState()

count = 0
for case in scenarios:
    for evidence_type in case["evidence"]:
        filename = OUTPUT / f'{case["slug"]}-{evidence_type}.pdf'
        story = [paragraph(TYPES[evidence_type], TITLE), paragraph(f'DEMO - {case["name"]}', LABEL), paragraph(case["project"])]
        sector = {"Industrie lourde": "Heavy industry", "Agroalimentaire": "Food processing", "BTP / construction": "Building / construction"}.get(case["sector"], case["sector"])
        rows = [[paragraph("Sector", LABEL), paragraph(sector)], [paragraph("Location", LABEL), paragraph(f'{case["location"]}, Tunisia')], [paragraph("Financing request", LABEL), paragraph(f'{case["amount"]:,} TND')], [paragraph("Workforce", LABEL), paragraph(f'{case["staff"]} employees')]]
        table = Table(rows, colWidths=[48 * mm, 118 * mm], hAlign="LEFT")
        table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f4f5f1")), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
        story += [table, Spacer(1, 6 * mm), paragraph("Scenario context", LABEL), paragraph(case["description"]), paragraph("Evidence and verification status", LABEL)]
        if evidence_type == "REGULATORY_COMPLIANCE":
            values = case["regulation"]
            text = f'Environmental assessment: {values[0]}; assessment status: {values[1]}; building permit: {values[2]}; classified site: {values[3]}; other operating permit: {values[4]}. These are scenario declarations, not copies of official approvals.'
        elif evidence_type == "CERTIFICATIONS":
            certs = {"CERT_005": "HACCP", "CERT_007": "ISO 9001", "CERT_008": "ISO 14001"}
            text = "Scenario-declared credentials: " + ", ".join(certs[code] for code in case["certifications"] if code in certs) + ". No official certificates, issuer signatures or accreditation marks are reproduced. Actual certification would require independent verification."
        elif evidence_type == "CLIMATE_QUESTIONS":
            total, fuel, gas, renewable, other = case["energy"]
            text = f'Total annual energy: {total:,} kWh; fuel: {fuel:,}; natural gas: {gas:,}; renewables: {renewable:,}; other: {other:,}. Grid electricity is the remaining balance. Planned transition investment: {case["investment"]:,} TND. Transition commitment: {case["plan"]}. Targets are not verified savings.'
        elif evidence_type == "PERFORMANCE_STANDARD_5":
            text = "The scenario includes an inventory of affected households, consultation, compensation arrangements and livelihood restoration monitoring. This note is not a compensation agreement or proof of consent."
        elif evidence_type == "PERFORMANCE_STANDARD_4":
            text = "The scenario provides for a community liaison contact, stakeholder consultations, construction traffic controls, a grievance register and periodic follow-up. These declarations require review in a real assessment."
        elif evidence_type.startswith("PERFORMANCE_STANDARD_3"):
            text = "The controlled scenario provides for dedicated monitoring records, maintenance responsibilities, appropriate treatment or containment, and traceable waste disposal. No laboratory report or real monitoring certificate is fabricated."
        elif evidence_type == "PERFORMANCE_STANDARD_2_HR":
            text = "The scenario includes employment contracts, social security registration, worker representation and accident monitoring. Staff numbers include permanent and temporary workers; no personal employee data is included."
        else:
            text = case["notes"]
        story += [paragraph(text), paragraph("Presentation purpose", LABEL), paragraph(case["notes"]), Spacer(1, 3 * mm), paragraph("This document is an illustrative software demonstration note. It is not a certificate, regulatory approval, audit opinion or document from a real company.", LABEL)]
        SimpleDocTemplate(str(filename), pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=45 * mm, bottomMargin=25 * mm).build(story, onFirstPage=page_frame, onLaterPages=page_frame)
        pdf = PdfReader(filename)
        assert len(pdf.pages) == 1, f"Unexpected pagination: {filename}"
        assert "DEMONSTRATION ONLY" in pdf.pages[0].extract_text(), filename
        count += 1
print(f"Generated and text-validated {count} single-page fictional evidence PDFs.")
