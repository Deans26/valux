# app/routers/valuation.py
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Company, FinancialData, Valuation
from app.ai.valuation_service import generate_valuation
from app.core.deps import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/valuation", tags=["valuation"])

@router.post("/{company_id}/generate")
async def generate(
    company_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Fetch company — ensure it belongs to current user
    company = db.query(Company).filter(
        Company.id == company_id,
        Company.user_id == current_user.id
    ).first()
    if not company:
        raise HTTPException(404, "Company not found")

    # Fetch financials
    fins = db.query(FinancialData).filter(
        FinancialData.company_id == company_id
    ).order_by(FinancialData.year).all()
    if not fins:
        raise HTTPException(400, "No financial data found. Please add financials first.")

    # Build anonymized company profile — no PII sent to Claude
    company_data = {
        "industry": company.industry,
        "stage": company.stage,
        "company_type": company.company_type,
        "doi": company.doi,
        "state": company.state,
    }
    financials = [
        {
            "year": f.year,
            "revenue": f.revenue,
            "ebitda": f.ebitda,
            "pat": f.pat,
            "total_assets": f.total_assets,
            "debt": f.debt,
        }
        for f in fins
    ]

    # Call Claude
    try:
        result = await generate_valuation(company_data, financials)
    except Exception as e:
        raise HTTPException(500, f"AI generation failed: {str(e)}")

    # Save to DB — full audit trail
    val = Valuation(
        id=uuid.uuid4(),
        company_id=company.id,
        base_val=result.get("blended_valuation"),
        bear_val=result.get("bear_valuation"),
        bull_val=result.get("bull_valuation"),
        methodology=result.get("methodology"),
        assumptions=result.get("assumptions", {}),
        projections=result.get("projections", []),
        narrative=result.get("narrative"),
        generated_at=datetime.utcnow()
    )
    db.add(val)
    db.commit()

    return {
        "valuation_id": str(val.id),
        "company_id": company_id,
        "dcf": result.get("dcf_valuation"),
        "revenue_multiple": result.get("revenue_multiple_valuation"),
        "ebitda_multiple": result.get("ebitda_multiple_valuation"),
        "blended": result.get("blended_valuation"),
        "bear": result.get("bear_valuation"),
        "bull": result.get("bull_valuation"),
        "methodology": result.get("methodology"),
        "assumptions": result.get("assumptions"),
        "projections": result.get("projections"),
        "narrative": result.get("narrative"),
        "generated_at": str(val.generated_at),
        "disclaimer": "This valuation is AI-assisted. Must be reviewed by a SEBI/IBBI Registered Valuer before regulatory use."
    }

@router.get("/{company_id}/history")
def get_history(
    company_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company = db.query(Company).filter(
        Company.id == company_id,
        Company.user_id == current_user.id
    ).first()
    if not company:
        raise HTTPException(404, "Company not found")

    vals = db.query(Valuation).filter(
        Valuation.company_id == company_id
    ).order_by(Valuation.generated_at.desc()).all()

    return [
        {
            "valuation_id": str(v.id),
            "base_val": v.base_val,
            "bear_val": v.bear_val,
            "bull_val": v.bull_val,
            "methodology": v.methodology,
            "generated_at": str(v.generated_at),
        }
        for v in vals
    ]