# app/ai/valuation_prompt.py
# Builds the prompt sent to Claude — anonymized, compliance-safe

SYSTEM_PROMPT = """You are ValuX, an expert financial analyst specializing in 
Indian company valuations. You follow IBBI-approved methodologies (DCF, Revenue 
Multiple, EBITDA Multiple) and are deeply familiar with Indian accounting standards 
(Schedule III), NSE/BSE sector benchmarks, and RBI guidelines.

You always:
- Return ONLY valid JSON, no markdown, no explanation outside the JSON
- Use Indian Rupees (Crores) for all values
- Apply stage-appropriate risk discounts
- Follow Schedule III / Companies Act 2013 structure
- Include compliance disclaimer in narrative

IMPORTANT: This output is AI-assisted and must be reviewed by a 
SEBI/IBBI Registered Valuer before use in any regulatory filing."""

def build_valuation_prompt(company_data: dict, financials: list) -> str:
    """
    Builds the user prompt from company + financial data.
    PII is stripped before this call — only numbers and metadata sent.
    """

    fin_summary = []
    for f in financials:
        fin_summary.append({
            "year": f.get("year"),
            "revenue_cr": f.get("revenue"),
            "ebitda_cr": f.get("ebitda"),
            "pat_cr": f.get("pat"),
            "total_assets_cr": f.get("total_assets"),
            "debt_cr": f.get("debt"),
        })

    prompt = f"""
Generate a comprehensive company valuation using the following data.

COMPANY PROFILE:
- Industry: {company_data.get('industry', 'Not specified')}
- Funding Stage: {company_data.get('stage', 'Not specified')}
- Company Type: {company_data.get('company_type', 'Private Limited')}
- Incorporation Year: {company_data.get('doi', 'Not specified')}
- State: {company_data.get('state', 'Not specified')}

HISTORICAL FINANCIALS (₹ Crores):
{fin_summary}

INSTRUCTIONS:
1. Calculate DCF valuation (5-year projection, WACC appropriate for stage)
2. Calculate Revenue Multiple valuation (use NSE/BSE sector benchmarks)
3. Calculate EBITDA Multiple valuation (use sector benchmarks)
4. Blend all three using stage-appropriate weights
5. Generate bear / base / bull scenarios (±20% / base / +25%)
6. Project 5-year P&L (revenue, ebitda, pat)
7. Write a 3-paragraph narrative

Return ONLY this exact JSON structure, no other text:
{{
  "dcf_valuation": <float in crores>,
  "revenue_multiple_valuation": <float in crores>,
  "ebitda_multiple_valuation": <float in crores>,
  "blended_valuation": <float in crores>,
  "bear_valuation": <float in crores>,
  "bull_valuation": <float in crores>,
  "methodology": "<DCF + Revenue Multiple + EBITDA Multiple>",
  "wacc": <float percentage>,
  "revenue_multiple_used": <float>,
  "ebitda_multiple_used": <float>,
  "assumptions": {{
    "growth_rate": <float>,
    "terminal_growth": <float>,
    "ebitda_margin": <float>,
    "discount_rate": <float>,
    "risk_discount_applied": <float>,
    "stage_weights": {{
      "dcf": <float>,
      "revenue": <float>,
      "ebitda": <float>
    }}
  }},
  "projections": [
    {{"year": "FY2026", "revenue": <float>, "ebitda": <float>, "pat": <float>}},
    {{"year": "FY2027", "revenue": <float>, "ebitda": <float>, "pat": <float>}},
    {{"year": "FY2028", "revenue": <float>, "ebitda": <float>, "pat": <float>}},
    {{"year": "FY2029", "revenue": <float>, "ebitda": <float>, "pat": <float>}},
    {{"year": "FY2030", "revenue": <float>, "ebitda": <float>, "pat": <float>}}
  ],
  "narrative": "<3 paragraph valuation narrative with IBBI methodology disclosure>"
}}
"""
    return prompt