"""
LittleGo — public waitlist endpoint for the littlego.ng landing page.

Drop this into the existing FastAPI backend (suggested path:
backend/app/routers/public_waitlist.py), then:

  1. Point the two imports marked ADAPT at your real database Base and
     session dependency.
  2. Register the router:   app.include_router(public_waitlist.router)
  3. Create the table with an Alembic migration:
        alembic revision --autogenerate -m "waitlist signups"
        alembic upgrade head
  4. Add the site to CORS:  LITTLEGO_CORS_ORIGINS=...,https://littlego.ng,https://www.littlego.ng
  5. Optional: set LITTLEGO_WAITLIST_IP_SALT to any long random string.

Endpoint:  POST /public/waitlist   (JSON)
  201 {"ok": true}                      saved (or already on the list — same reply,
                                        so the endpoint can't be used to check
                                        whether someone has signed up)
  422 {"message": ..., "errors": {...}} validation failed; keys match form fields
  429 {"message": ...}                  too many attempts from one address

Note: written against FastAPI + SQLAlchemy 2.x (sync sessions) but not yet run
inside the LittleGo repo, so check it against your conventions.
"""
from __future__ import annotations

import hashlib
import os
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field, ValidationError, field_validator
from sqlalchemy import JSON, Boolean, DateTime, Integer, String, select
from sqlalchemy.orm import Mapped, Session, mapped_column

# ADAPT: your project's declarative Base and DB session dependency.
from app.db import Base, get_db  # noqa: E402

router = APIRouter(prefix="/public", tags=["public"])

Area = Literal[
    "lagos_lekki_ajah", "lagos_vi_ikoyi", "lagos_ikeja", "lagos_gbagada_magodo",
    "lagos_yaba_surulere", "lagos_festac_amuwo", "lagos_ikorodu", "lagos_alimosho",
    "lagos_other", "abuja", "port_harcourt", "ibadan", "other_nigeria", "outside_nigeria",
]
Journey = Literal["school", "lessons", "sports_clubs", "other"]
StartWindow = Literal["asap", "next_term", "within_6_months", "later"]

MIN_FILL_MS = 1500          # faster than this is almost certainly a bot
RATE_LIMIT = 5              # submissions ...
RATE_WINDOW_S = 10 * 60     # ... per IP per 10 minutes (per server instance)


class WaitlistSignup(Base):
    __tablename__ = "waitlist_signups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    area: Mapped[str] = mapped_column(String(40), index=True)
    journeys: Mapped[list] = mapped_column(JSON)
    start_window: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    consent: Mapped[bool] = mapped_column(Boolean)
    consent_text: Mapped[str] = mapped_column(String(400))
    consent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    source: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    utm_source: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    utm_medium: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    utm_campaign: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    ip_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    unsubscribed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class WaitlistIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=20)
    area: Area
    journeys: list[Journey] = Field(min_length=1, max_length=4)
    start_window: Optional[StartWindow] = None
    consent: bool
    consent_text: str = Field(max_length=400)
    source: Optional[str] = Field(default=None, max_length=80)
    utm_source: Optional[str] = Field(default=None, max_length=80)
    utm_medium: Optional[str] = Field(default=None, max_length=80)
    utm_campaign: Optional[str] = Field(default=None, max_length=80)
    website: str = ""           # honeypot — must stay empty
    elapsed_ms: int = 0

    @field_validator("full_name")
    @classmethod
    def _name(cls, v: str) -> str:
        return " ".join(v.split())

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        cleaned = "".join(ch for ch in v if ch.isdigit() or ch == "+")
        digits = cleaned.lstrip("+")
        if not digits.isdigit() or not 8 <= len(digits) <= 15:
            raise ValueError("Please enter a valid phone number.")
        return cleaned

    @field_validator("consent")
    @classmethod
    def _consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Consent is required to join the waitlist.")
        return v

    @field_validator("journeys")
    @classmethod
    def _dedupe(cls, v: list) -> list:
        return list(dict.fromkeys(v))


FRIENDLY = {
    "full_name": "Please enter your full name.",
    "email": "Please enter a valid email address.",
    "phone": "Please enter a valid phone number.",
    "area": "Please choose the area you live in.",
    "journeys": "Please choose at least one type of journey.",
    "start_window": "Please choose an option from the list.",
    "consent": "Please agree to receive launch updates.",
}

_hits: dict[str, deque] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    # Render (and most proxies) put the real client first in X-Forwarded-For.
    fwd = request.headers.get("x-forwarded-for", "")
    return (fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else "")) or "unknown"


def _rate_limited(ip: str) -> bool:
    now = time.monotonic()
    q = _hits[ip]
    while q and now - q[0] > RATE_WINDOW_S:
        q.popleft()
    if len(q) >= RATE_LIMIT:
        return True
    q.append(now)
    return False


def _hash_ip(ip: str) -> str:
    salt = os.environ.get("LITTLEGO_WAITLIST_IP_SALT", "littlego-waitlist")
    return hashlib.sha256(f"{salt}:{ip}".encode()).hexdigest()


@router.post("/waitlist", status_code=201)
async def join_waitlist(request: Request, db: Session = Depends(get_db)):
    ip = _client_ip(request)
    if _rate_limited(ip):
        return JSONResponse(status_code=429, content={"message": "Too many attempts. Please try again later."})

    try:
        raw = await request.json()
    except Exception:
        return JSONResponse(status_code=422, content={"message": "Invalid request.", "errors": {}})
    if not isinstance(raw, dict):
        return JSONResponse(status_code=422, content={"message": "Invalid request.", "errors": {}})

    try:
        data = WaitlistIn.model_validate(raw)
    except ValidationError as exc:
        errors = {}
        for err in exc.errors():
            field = str(err["loc"][0]) if err["loc"] else "form"
            errors.setdefault(field, FRIENDLY.get(field, "Please check this field."))
        return JSONResponse(status_code=422, content={"message": "Some details need another look.", "errors": errors})

    # Bots: reply as if successful so they don't adapt, but store nothing.
    if data.website or data.elapsed_ms < MIN_FILL_MS:
        return {"ok": True}

    now = datetime.now(timezone.utc)
    email = data.email.lower()
    fields = dict(
        full_name=data.full_name, phone=data.phone, area=data.area, journeys=data.journeys,
        start_window=data.start_window, consent=True, consent_text=data.consent_text,
        consent_at=now, source=data.source, utm_source=data.utm_source,
        utm_medium=data.utm_medium, utm_campaign=data.utm_campaign,
        ip_hash=_hash_ip(ip), updated_at=now, unsubscribed_at=None,
    )
    existing = db.execute(select(WaitlistSignup).where(WaitlistSignup.email == email)).scalar_one_or_none()
    if existing:
        for k, v in fields.items():
            setattr(existing, k, v)
    else:
        db.add(WaitlistSignup(email=email, created_at=now, **fields))
    db.commit()
    return {"ok": True}
