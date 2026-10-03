import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.database.seed import init_db
from app.services.translate import get_lang, translate_text
from app.routes import (
    admin, auth, emergency_contacts, locations, medical, notifications, safety_zones, sos,
    tourist_id, travel_info, trips, users, weather,
)
from app.routes import family


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(title="TravelGuardian360 API", version="1.0.0", lifespan=lifespan)

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware, allow_origins=origins, allow_credentials=False, allow_methods=["*"], allow_headers=["*"],
)

for module in (
    auth, users, trips, locations, tourist_id, emergency_contacts, medical, sos,
    safety_zones, weather, notifications, travel_info, family, admin,
):
    app.include_router(module.router)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    """Return one readable sentence instead of the raw validation structure."""
    messages = []
    for err in exc.errors():
        field = ".".join(str(p) for p in err["loc"] if p not in ("body", "query", "path"))
        text = err["msg"].removeprefix("Value error, ")
        messages.append(f"{field.replace('_', ' ').capitalize()}: {text}" if field else text)
    lang = get_lang(request.headers.get("x-lang"))
    messages = [translate_text(m, lang) for m in messages]
    return JSONResponse(status_code=422, content={"detail": messages[0] if messages else translate_text("Invalid data.", lang), "errors": messages})


@app.exception_handler(StarletteHTTPException)
async def http_error_handler(request: Request, exc: StarletteHTTPException):
    """Same body as FastAPI's default, with the message in the client's language."""
    detail = exc.detail
    if isinstance(detail, str):
        detail = translate_text(detail, get_lang(request.headers.get("x-lang")))
    return JSONResponse(status_code=exc.status_code, content={"detail": detail}, headers=getattr(exc, "headers", None))


@app.exception_handler(SQLAlchemyError)
async def database_error_handler(_request: Request, _exc: SQLAlchemyError):
    return JSONResponse(status_code=500, content={"detail": "We could not complete that request. Please try again."})


@app.get("/health", tags=["System"])
def health():
    return {"ok": True, "service": "TravelGuardian360 API"}
