import os
from datetime import timedelta

import httpx
from sqlalchemy.orm import Session

from app.models import WeatherInfo
from app.services.geocode import reverse_geocode
from app.utils.time import utcnow

FRESH_FOR = timedelta(minutes=10)

# WMO weather codes (Open-Meteo) -> (condition, icon)
_WMO = {
    0: ("Clear sky", "clear"), 1: ("Mostly clear", "clear"), 2: ("Partly cloudy", "partly"),
    3: ("Overcast", "cloudy"), 45: ("Fog", "fog"), 48: ("Freezing fog", "fog"),
    51: ("Light drizzle", "drizzle"), 53: ("Drizzle", "drizzle"), 55: ("Heavy drizzle", "drizzle"),
    56: ("Freezing drizzle", "drizzle"), 57: ("Freezing drizzle", "drizzle"),
    61: ("Light rain", "rain"), 63: ("Rain", "rain"), 65: ("Heavy rain", "rain"),
    66: ("Freezing rain", "rain"), 67: ("Freezing rain", "rain"),
    71: ("Light snow", "snow"), 73: ("Snow", "snow"), 75: ("Heavy snow", "snow"), 77: ("Snow grains", "snow"),
    80: ("Rain showers", "rain"), 81: ("Rain showers", "rain"), 82: ("Violent showers", "rain"),
    85: ("Snow showers", "snow"), 86: ("Snow showers", "snow"),
    95: ("Thunderstorm", "storm"), 96: ("Thunderstorm with hail", "storm"), 99: ("Thunderstorm with hail", "storm"),
}
_OWM = {"Clear": "clear", "Clouds": "cloudy", "Rain": "rain", "Drizzle": "drizzle", "Thunderstorm": "storm",
        "Snow": "snow", "Mist": "fog", "Fog": "fog", "Haze": "fog", "Smoke": "fog", "Dust": "fog"}


class WeatherUnavailable(Exception):
    pass


def _place_key(lat: float, lon: float) -> str:
    return f"{round(lat, 1)}:{round(lon, 1)}"


def _fetch_open_meteo(lat: float, lon: float) -> dict:
    response = httpx.get(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude": lat, "longitude": lon, "wind_speed_unit": "kmh",
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
        },
        timeout=6,
    )
    response.raise_for_status()
    current = response.json()["current"]
    condition, icon = _WMO.get(int(current["weather_code"]), ("Unsettled", "cloudy"))
    return {
        "temperature": current["temperature_2m"], "feels_like": current.get("apparent_temperature"),
        "humidity": int(current["relative_humidity_2m"]), "wind_speed": current["wind_speed_10m"],
        "condition": condition, "icon": icon,
    }


def _fetch_openweather(lat: float, lon: float, key: str) -> dict:
    response = httpx.get(
        "https://api.openweathermap.org/data/2.5/weather",
        params={"lat": lat, "lon": lon, "appid": key, "units": "metric"},
        timeout=6,
    )
    response.raise_for_status()
    data = response.json()
    main = data["weather"][0]
    return {
        "temperature": data["main"]["temp"], "feels_like": data["main"].get("feels_like"),
        "humidity": int(data["main"]["humidity"]), "wind_speed": round(data["wind"]["speed"] * 3.6, 1),
        "condition": main["description"].capitalize(), "icon": _OWM.get(main["main"], "cloudy"),
    }


def _serialize(row: WeatherInfo, stale: bool) -> dict:
    return {
        "location_name": row.location_name, "latitude": row.latitude, "longitude": row.longitude,
        "temperature": round(row.temperature, 1), "feels_like": row.feels_like,
        "condition": row.condition, "icon": row.icon, "humidity": row.humidity,
        "wind_speed": row.wind_speed, "fetched_at": row.fetched_at.isoformat() + "Z", "stale": stale,
    }


def get_weather(db: Session, lat: float, lon: float, name: str | None = None, force: bool = False) -> dict:
    key = _place_key(lat, lon)
    row = db.query(WeatherInfo).filter(WeatherInfo.place_key == key).first()
    if row and not force and utcnow() - row.fetched_at < FRESH_FOR:
        return _serialize(row, stale=False)

    try:
        api_key = os.getenv("OPENWEATHER_API_KEY", "").strip()
        reading = _fetch_openweather(lat, lon, api_key) if api_key else _fetch_open_meteo(lat, lon)
    except (httpx.HTTPError, KeyError, ValueError, IndexError):
        if row:
            return _serialize(row, stale=True)
        raise WeatherUnavailable("Weather information is not available right now.")

    if row is None:
        row = WeatherInfo(place_key=key, latitude=lat, longitude=lon)
        db.add(row)
    if name:
        row.location_name = name
    elif not row.location_name:
        row.location_name = reverse_geocode(db, lat, lon)
    row.latitude, row.longitude = lat, lon
    row.temperature = reading["temperature"]
    row.feels_like = reading["feels_like"]
    row.condition = reading["condition"]
    row.icon = reading["icon"]
    row.humidity = reading["humidity"]
    row.wind_speed = reading["wind_speed"]
    row.fetched_at = utcnow()
    db.commit()
    db.refresh(row)
    return _serialize(row, stale=False)
