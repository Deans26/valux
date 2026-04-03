import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text, Float, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email            = Column(String, unique=True, nullable=False, index=True)
    hashed_password  = Column(String, nullable=True)
    full_name        = Column(String, nullable=True)
    google_id        = Column(String, unique=True, nullable=True)
    plan             = Column(String, default="free")
    is_active        = Column(Boolean, default=True)
    created_at       = Column(DateTime, default=datetime.utcnow)
    companies        = relationship("Company", back_populates="owner")

class Company(Base):
    __tablename__ = "companies"
    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id        = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name           = Column(String, nullable=False)
    cin            = Column(String, nullable=False)
    doi            = Column(String, nullable=True)
    industry       = Column(String, nullable=True)
    stage          = Column(String, nullable=True)
    company_type   = Column(String, nullable=True)
    state          = Column(String, nullable=True)
    cin_verified   = Column(Boolean, default=False)
    connected_erps = Column(JSON, default={})
    created_at     = Column(DateTime, default=datetime.utcnow)
    owner          = relationship("User", back_populates="companies")
    financials     = relationship("FinancialData", back_populates="company")
    valuations     = relationship("Valuation", back_populates="company")
    files          = relationship("UploadedFile", back_populates="company")

class FinancialData(Base):
    __tablename__ = "financial_data"
    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id  = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    year        = Column(String, nullable=False)
    revenue     = Column(Float, nullable=True)
    ebitda      = Column(Float, nullable=True)
    pat         = Column(Float, nullable=True)
    total_assets= Column(Float, nullable=True)
    debt        = Column(Float, nullable=True)
    source      = Column(String, default="manual")
    company     = relationship("Company", back_populates="financials")

class Valuation(Base):
    __tablename__ = "valuations"
    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id   = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    base_val     = Column(Float)
    bear_val     = Column(Float)
    bull_val     = Column(Float)
    methodology  = Column(String)
    assumptions  = Column(JSON, default={})
    projections  = Column(JSON, default=[])
    narrative    = Column(Text)
    generated_at = Column(DateTime, default=datetime.utcnow)
    company      = relationship("Company", back_populates="valuations")

class UploadedFile(Base):
    __tablename__ = "uploaded_files"
    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id          = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    filename            = Column(String)
    s3_key              = Column(String)
    file_type           = Column(String)
    schedule3_detected  = Column(Boolean, default=False)
    validation_status   = Column(String, default="pending")
    uploaded_at         = Column(DateTime, default=datetime.utcnow)
    company             = relationship("Company", back_populates="files")