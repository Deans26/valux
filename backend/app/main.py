from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine
from app.db import models
from app.routers import auth, companies, valuation

# Create all database tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ValuX API",
    description="AI-powered valuation platform for Indian businesses",
    version="1.0.0",
)

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(valuation.router)

@app.get("/")
def health_check():
    return {
        "status": "ok",
        "service": "ValuX API",
        "version": "1.0.0"
    }