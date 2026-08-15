from fastapi import APIRouter, HTTPException, Query

from app.services.safety import fetch_weather_risk

router = APIRouter()


@router.get("/safety/check")
def get_safety_check(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
):
    try:
        return fetch_weather_risk(latitude, longitude)
    except Exception as exc:  # pragma: no cover - defensive network guard for the demo
        raise HTTPException(
            status_code=502,
            detail=f"Unable to evaluate safety at this location: {exc}",
        ) from exc
