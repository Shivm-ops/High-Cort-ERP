"""
app/services/property/report_generator.py
=========================================
Generates tamper-evident, publication-grade A4 Property Legal Due Diligence Reports.
Formats clean, printable HTML ready for direct browser printing or PDF download.
"""

import html as html_lib
from typing import Dict, Any, List
from datetime import datetime


class PropertyReportGenerator:
    @staticmethod
    def generate_html_report(
        property_request: Dict[str, Any],
        assessment_result: Dict[str, Any],
        land_records: Dict[str, Any],
        court_cases: List[Dict[str, Any]],
        registration_data: Dict[str, Any],
        mortgage_data: Dict[str, Any],
        sources_status: Dict[str, str],
        report_id: str,
    ) -> str:
        req = property_request
        res = assessment_result
        satbara = land_records.get("satbara_7_12") or {}
        
        category_labels = {
            "agricultural_land": "Agricultural Land (शेती जमीन)",
            "residential_plot": "Residential Plot (निवासी भूखंड)",
            "na_plot": "Non-Agricultural (NA) Plot (अकृषक प्लॉट)",
            "flat_apartment": "Flat / Apartment (फ्लॅट / सदनिका)",
            "commercial_property": "Commercial Property (व्यावसायिक जागा)",
            "industrial_property": "Industrial Property (औद्योगिक भूखंड)",
        }
        category_name = category_labels.get(req.get("property_category", ""), req.get("property_category", "").title())

        # Badge color according to risk category
        risk_cat = res.get("risk_category", "further_verification_required")
        if risk_cat == "records_found":
            badge_bg = "#dcfce7"
            badge_text = "#15803d"
            badge_label = "RECORDS FOUND - PRELIMINARY CLEAR"
        elif risk_cat == "further_verification_required":
            badge_bg = "#fef3c7"
            badge_text = "#b45309"
            badge_label = "FURTHER VERIFICATION REQUIRED (पुढील पडताळणी आवश्यक)"
        elif risk_cat == "no_record_found":
            badge_bg = "#f1f5f9"
            badge_text = "#475569"
            badge_label = "NO RECORD FOUND IN SOURCES CHECKED"
        else:
            badge_bg = "#fee2e2"
            badge_text = "#b91c1c"
            badge_label = "SOURCE UNAVAILABLE / INCOMPLETE SEARCH"

        # Discrepancies HTML
        discrepancies_html = ""
        discrepancies = res.get("discrepancies", [])
        if discrepancies:
            for d in discrepancies:
                border_col = "#ef4444" if d.get("severity") in ["CRITICAL", "HIGH"] else "#f59e0b"
                discrepancies_html += f"""
                <div style="margin-bottom: 12px; padding: 12px 14px; background: #fff; border-left: 4px solid {border_col}; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <strong style="color: #1e293b; font-size: 13px;">{html_lib.escape(d.get('title', ''))}</strong>
                        <span style="font-size: 10px; font-weight: bold; background: #fee2e2; color: #b91c1c; padding: 2px 6px; rounded: 3px;">{html_lib.escape(d.get('severity', ''))}</span>
                    </div>
                    <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Source: <strong>{html_lib.escape(d.get('source', ''))}</strong></div>
                    <p style="margin: 0; font-size: 12px; color: #334155; line-height: 1.4;">{html_lib.escape(d.get('detail', ''))}</p>
                </div>
                """
        else:
            discrepancies_html = """
            <div style="padding: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; color: #166534; font-size: 12px;">
                ✔ No direct title conflicts, adverse litigation, or encumbrance flags were detected in the checked databases.
            </div>
            """

        # Court Cases HTML
        court_cases_html = ""
        if court_cases:
            for cc in court_cases:
                tier_badge = "#fee2e2" if cc.get("relevance_tier") == "HIGH" else "#fef3c7"
                tier_color = "#b91c1c" if cc.get("relevance_tier") == "HIGH" else "#b45309"
                court_cases_html += f"""
                <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                    <td style="padding: 8px;"><strong>{html_lib.escape(cc.get('case_type', ''))}</strong><br><span style="color:#64748b;">No: {html_lib.escape(cc.get('case_number', ''))}</span></td>
                    <td style="padding: 8px;">{html_lib.escape(cc.get('court_name', ''))}<br><span style="color:#64748b;">CNR: {html_lib.escape(cc.get('cnr_number', ''))}</span></td>
                    <td style="padding: 8px;"><strong>Petitioner:</strong> {html_lib.escape(cc.get('petitioner', ''))}<br><strong>Respondent:</strong> {html_lib.escape(cc.get('respondent', ''))}</td>
                    <td style="padding: 8px;"><span style="background:{tier_badge}; color:{tier_color}; padding:2px 6px; border-radius:3px; font-weight:bold;">{html_lib.escape(cc.get('relevance_tier', ''))}</span><br><span style="font-size:10px; color:#64748b;">{html_lib.escape(cc.get('relevance_reason', ''))}</span></td>
                    <td style="padding: 8px;"><strong>{html_lib.escape(cc.get('status', ''))}</strong></td>
                </tr>
                """
        else:
            court_cases_html = """
            <tr>
                <td colspan="5" style="padding: 14px; text-align: center; color: #64748b; font-size: 12px;">
                    No pending civil or title litigation found for the party in checked District and High Courts.
                </td>
            </tr>
            """

        # Chain of title HTML
        chain_html = ""
        chain = registration_data.get("chain_of_title", [])
        if chain:
            for ch in chain:
                gap_alert = f"<br><span style='color:#ef4444; font-size:10px;'>⚠️ {html_lib.escape(ch.get('title_gap_note', ''))}</span>" if ch.get("has_title_gap") else ""
                chain_html += f"""
                <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                    <td style="padding: 6px 8px;">{ch.get('sequence')}</td>
                    <td style="padding: 6px 8px;"><strong>{html_lib.escape(str(ch.get('year', '')))}</strong><br><span style="color:#64748b;">Doc: {html_lib.escape(str(ch.get('document_number', '')))}</span></td>
                    <td style="padding: 6px 8px;">{html_lib.escape(ch.get('document_type', ''))}</td>
                    <td style="padding: 6px 8px;"><strong>Seller:</strong> {html_lib.escape(ch.get('seller', ''))}<br><strong>Buyer:</strong> {html_lib.escape(ch.get('buyer', ''))}{gap_alert}</td>
                    <td style="padding: 6px 8px;">₹ {ch.get('consideration_amount', 0):,}</td>
                </tr>
                """
        else:
            chain_html = """
            <tr>
                <td colspan="5" style="padding: 12px; text-align: center; color: #64748b; font-size: 11px;">
                    No digitized Index II transactions found for this identifier. Ground SRO record search recommended.
                </td>
            </tr>
            """

        # Missing docs list
        missing_docs_html = "".join([f"<li style='margin-bottom: 4px;'>{html_lib.escape(m)}</li>" for m in res.get("missing_documents", [])]) or "<li>None noted.</li>"
        
        # Next steps list
        next_steps_html = "".join([f"<li style='margin-bottom: 4px;'>{html_lib.escape(s)}</li>" for s in res.get("recommended_next_steps", [])])

        generated_date = datetime.utcnow().strftime("%d %B %Y, %I:%M %p UTC")

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FastCase Property Legal Due Diligence Report - Ref {report_id[:8]}</title>
    <style>
        @page {{
            size: A4;
            margin: 15mm 15mm 18mm 15mm;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1e293b;
            background: #f8fafc;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.5;
        }}
        .report-page {{
            background: #ffffff;
            max-width: 800px;
            margin: 0 auto;
            padding: 30px 35px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
            position: relative;
        }}
        .watermark {{
            position: absolute;
            top: 45%;
            left: 10%;
            transform: rotate(-35deg);
            font-size: 42px;
            color: rgba(226, 232, 240, 0.65);
            font-weight: 900;
            letter-spacing: 4px;
            pointer-events: none;
            z-index: 0;
            text-transform: uppercase;
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }}
        .section-title {{
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1.5px solid #cbd5e1;
            padding-bottom: 4px;
            margin-top: 20px;
            margin-bottom: 10px;
        }}
        .grid-2 {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }}
        .table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            margin-bottom: 14px;
        }}
        .table th {{
            background: #f1f5f9;
            color: #475569;
            font-size: 10px;
            text-transform: uppercase;
            padding: 6px 8px;
            text-align: left;
            border-bottom: 1.5px solid #cbd5e1;
        }}
        .callout {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 14px;
            margin-top: 8px;
        }}
        @media print {{
            body {{ background: transparent; padding: 0; }}
            .report-page {{ box-shadow: none; border: none; padding: 0; }}
            .no-print {{ display: none; }}
        }}
    </style>
</head>
<body>
    <div class="no-print" style="max-width: 800px; margin: 0 auto 15px auto; display: flex; justify-content: flex-end; gap: 10px;">
        <button onclick="window.print()" style="background:#0f172a; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">
            🖨️ Print / Save as PDF
        </button>
    </div>

    <div class="report-page">
        <div class="watermark">PRELIMINARY CHECK &bull; FASTCASE</div>

        <!-- Header -->
        <div class="header">
            <div>
                <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #047857; letter-spacing: -0.5px;">FASTCASE &trade;</h1>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600;">Automated Property Legal Check & Court Litigation Due Diligence</p>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 10px; color: #64748b;">Report Ref: <strong>{report_id[:12].upper()}</strong></div>
                <div style="font-size: 10px; color: #64748b;">Generated: <strong>{generated_date}</strong></div>
            </div>
        </div>

        <!-- Verdict Banner -->
        <div style="background: {badge_bg}; border: 1.5px solid {badge_text}; border-radius: 8px; padding: 12px 16px; margin-bottom: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="color: {badge_text}; font-size: 13px; font-weight: 900; letter-spacing: 0.5px;">{badge_label}</span>
                <span style="font-size: 11px; font-weight: bold; color: {badge_text};">Risk Index: {res.get('risk_score')}/100</span>
            </div>
            <p style="margin: 0; font-size: 11.5px; color: #1e293b; line-height: 1.4;">{html_lib.escape(res.get('summary_verdict', ''))}</p>
        </div>

        <!-- 1. Property Identification -->
        <div class="section-title">1. Property Identification & Search Criteria</div>
        <div class="grid-2 callout">
            <div>
                <div style="font-size: 10px; color: #64748b;">Property Category:</div>
                <div style="font-size: 12px; font-weight: bold;">{category_name}</div>
                <div style="margin-top: 6px; font-size: 10px; color: #64748b;">Location:</div>
                <div style="font-size: 11px;">{html_lib.escape(req.get('district', ''))}, Taluka: {html_lib.escape(req.get('taluka') or 'N/A')}, Village: {html_lib.escape(req.get('village_city') or 'N/A')}</div>
            </div>
            <div>
                <div style="font-size: 10px; color: #64748b;">Target Identifiers:</div>
                <div style="font-size: 11px;"><strong>Survey / Gat:</strong> {html_lib.escape(req.get('survey_number') or req.get('gat_number') or 'None')} | <strong>CTS:</strong> {html_lib.escape(req.get('cts_number') or 'None')}</div>
                <div style="margin-top: 6px; font-size: 10px; color: #64748b;">Current Owner / Seller:</div>
                <div style="font-size: 12px; font-weight: bold; color: #047857;">{html_lib.escape(req.get('current_owner_name', ''))}</div>
            </div>
        </div>

        <!-- 2. Discrepancies & Adverse Indicators -->
        <div class="section-title">2. Discrepancy & Risk Analysis</div>
        <div style="margin-top: 8px;">
            {discrepancies_html}
        </div>

        <!-- 3. Maharashtra Land Records -->
        <div class="section-title">3. Official Maharashtra Land Records (MahaBhumi)</div>
        <table class="table">
            <thead>
                <tr>
                    <th>Record Type</th>
                    <th>Survey / Gat</th>
                    <th>Registered Khatedars (Holders)</th>
                    <th>Total Area</th>
                    <th>Other Rights (Lien / Charges)</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                    <td style="padding: 8px;">7/12 Satbara Extract</td>
                    <td style="padding: 8px;">{html_lib.escape(str(satbara.get('survey_gat_number', 'N/A')))}</td>
                    <td style="padding: 8px;">{html_lib.escape(', '.join(satbara.get('owners', [])) or 'No Khatedar record')}</td>
                    <td style="padding: 8px;">{html_lib.escape(str(satbara.get('total_area_hectares', 'N/A')))} Hectares</td>
                    <td style="padding: 8px;">{html_lib.escape(', '.join(satbara.get('other_rights', [])) or 'No adverse remark')}</td>
                </tr>
            </tbody>
        </table>

        <!-- 4. Court Litigation -->
        <div class="section-title">4. Court Case & Dispute Search (District Courts & High Court)</div>
        <table class="table">
            <thead>
                <tr>
                    <th>Case No & Type</th>
                    <th>Court & CNR</th>
                    <th>Parties</th>
                    <th>Property Relevance</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {court_cases_html}
            </tbody>
        </table>

        <!-- 5. Chain of Title -->
        <div class="section-title">5. Registration History & Chain of Title (Maharashtra IGR Index II)</div>
        <table class="table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Year & Doc No</th>
                    <th>Deed Type</th>
                    <th>Parties (Seller ➔ Purchaser)</th>
                    <th>Consideration</th>
                </tr>
            </thead>
            <tbody>
                {chain_html}
            </tbody>
        </table>

        <!-- 6. Limitations & Next Steps -->
        <div class="grid-2" style="margin-top: 15px;">
            <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 12px;">
                <div style="font-weight: bold; font-size: 11px; color: #92400e; margin-bottom: 4px;">⚠️ Verification Limitations:</div>
                <ul style="margin: 0; padding-left: 16px; font-size: 10.5px; color: #78350f;">
                    {"".join([f"<li style='margin-bottom: 3px;'>{html_lib.escape(vl)}</li>" for vl in res.get('verification_limitations', [])[:3]])}
                </ul>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px;">
                <div style="font-weight: bold; font-size: 11px; color: #166534; margin-bottom: 4px;">⚖️ Recommended Next Steps:</div>
                <ul style="margin: 0; padding-left: 16px; font-size: 10.5px; color: #14532d;">
                    {next_steps_html}
                </ul>
            </div>
        </div>

        <!-- Footer Notice -->
        <div style="margin-top: 25px; padding-top: 12px; border-top: 1px solid #cbd5e1; font-size: 9.5px; color: #64748b; text-align: center; line-height: 1.4;">
            <strong>STATUTORY LEGAL DISCLAIMER:</strong> This report is an automated preliminary intelligence document generated by FastCase through programmatic public-records access. It does not constitute a certified Title Certificate, Search Report, or conclusive Title Opinion. To obtain an advocate-signed Title Opinion, engage a qualified property lawyer through the FastCase Consumer Portal.
        </div>
    </div>
</body>
</html>
"""
        return html_content
