from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.models import *
from app.routes.auth import router as auth_router
from app.routes.contacts import router as contacts_router
from app.routes.medical import router as medical_router
from app.routes.trips import router as trips_router
from app.routes.sos import router as sos_router
from app.routes.safety import router as safety_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TravelGuardian360 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(contacts_router, prefix="/api", tags=["contacts"])
app.include_router(medical_router, prefix="/api", tags=["medical"])
app.include_router(trips_router, prefix="/api", tags=["trips"])
app.include_router(sos_router, prefix="/api", tags=["sos"])
app.include_router(safety_router, prefix="/api", tags=["safety"])


@app.get("/api/health")
def health_check():
    return {"ok": True, "service": "travel-guardian-demo", "timestamp": "2026-08-15T00:00:00Z"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3001, reload=True)
