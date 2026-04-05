import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.db.models import Company, FinancialData
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/companies", tags=["companies"])

class CompanyCreate(BaseModel):
    name: str
    cin: str
    doi: Optional[str] = None
    industry: Optional[str] = None
    stage: Optional[str] = None
    company_type: Optional[str] = None
    state: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    cin: Optional[str] = None 
    doi: Optional[str] = None
    industry: Optional[str] = None
    stage: Optional[str] = None
    company_type: Optional[str] = None
    state: Optional[str] = None

class FinancialCreate(BaseModel):
    year: str
    revenue: Optional[float] = None
    ebitda: Optional[float] = None
    pat: Optional[float] = None
    total_assets: Optional[float] = None
    debt: Optional[float] = None
    source: Optional[str] = "manual"

@router.post("", status_code=201)
def create_company(
    body: CompanyCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # ── Duplicate CIN check (across all users) ──────────────────────────
    existing_cin = db.query(Company).filter(
        Company.cin == body.cin.strip().upper()
    ).first()
    if existing_cin:
        raise HTTPException(400, f"A company with CIN {body.cin} already exists in ValuX.")

    # ── Duplicate Name check (per user) ─────────────────────────────────
    existing_name = db.query(Company).filter(
        Company.user_id == current_user.id,
        Company.name == body.name.strip()
    ).first()
    if existing_name:
        raise HTTPException(400, f"You already have a company named '{body.name}'.")

    company = Company(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=body.name.strip(),
        cin=body.cin.strip().upper(),
        doi=body.doi,
        industry=body.industry,
        stage=body.stage,
        company_type=body.company_type,
        state=body.state,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return {"id": str(company.id), "name": company.name, "cin": company.cin}

@router.get("")
def list_companies(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    companies = db.query(Company).filter(
        Company.user_id == current_user.id
    ).all()
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "cin": c.cin,
            "industry": c.industry,
            "stage": c.stage,
            "company_type": c.company_type,
            "state": c.state,
            "doi": c.doi,
            "cin_verified": c.cin_verified,
        }
        for c in companies
    ]

@router.put("/{company_id}")
def update_company(
    company_id: str,
    body: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company = db.query(Company).filter(
        Company.id == company_id,
        Company.user_id == current_user.id
    ).first()
    if not company:
        raise HTTPException(404, "Company not found")

    # Check duplicate name if name is being changed
    if body.name and body.name.strip() != company.name:
        existing = db.query(Company).filter(
            Company.user_id == current_user.id,
            Company.name == body.name.strip(),
            Company.id != company_id
        ).first()
        if existing:
            raise HTTPException(400, f"You already have a company named '{body.name}'.")
    # Update CIN only if not verified
    if body.cin and not company.cin_verified:
        existing_cin = db.query(Company).filter(
            Company.cin == body.cin.strip().upper(),
            Company.id != company_id
        ).first()
        if existing_cin:
            raise HTTPException(400, f"CIN {body.cin} already exists.")
            company.cin = body.cin.strip().upper()
    
    # Update only provided fields
    if body.name: company.name = body.name.strip()
    if body.doi: company.doi = body.doi
    if body.industry: company.industry = body.industry
    if body.stage: company.stage = body.stage
    if body.company_type: company.company_type = body.company_type
    if body.state: company.state = body.state

    db.commit()
    db.refresh(company)
    return {
        "id": str(company.id),
        "name": company.name,
        "cin": company.cin,
        "industry": company.industry,
        "stage": company.stage,
        "company_type": company.company_type,
        "state": company.state,
        "doi": company.doi,
    }

@router.post("/{company_id}/financials", status_code=201)
def add_financials(
    company_id: str,
    body: FinancialCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company = db.query(Company).filter(
        Company.id == company_id,
        Company.user_id == current_user.id
    ).first()
    if not company:
        raise HTTPException(404, "Company not found")

    fin = FinancialData(
        id=uuid.uuid4(),
        company_id=company.id,
        **body.dict()
    )
    db.add(fin)
    db.commit()
    return {"status": "saved"}

@router.get("/{company_id}/financials")
def get_financials(
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

    fins = db.query(FinancialData).filter(
        FinancialData.company_id == company_id
    ).order_by(FinancialData.year).all()

    return [
        {
            "year": f.year,
            "revenue": f.revenue,
            "ebitda": f.ebitda,
            "pat": f.pat,
            "total_assets": f.total_assets,
            "debt": f.debt,
            "source": f.source,
        }
        for f in fins
    ]