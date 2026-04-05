# app/ai/valuation_service.py
import json
import os
import anthropic
from app.ai.valuation_prompt import SYSTEM_PROMPT, build_valuation_prompt

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

async def generate_valuation(company_data: dict, financials: list) -> dict:
    """
    Calls Claude API to generate a structured valuation.
    Returns parsed JSON dict.
    Compliant: no PII sent, full audit trail returned.
    """
    prompt = build_valuation_prompt(company_data, financials)

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()

    # Strip markdown fences if Claude wraps in ```json
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        result = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"Claude returned invalid JSON: {e}\nRaw: {raw[:500]}")

    return result