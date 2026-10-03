import json
from datetime import datetime, timezone
from urllib import parse, request

WEATHER_LABELS = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Cloudy",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers",
    81: "Heavy rain showers",
    82: "Violent rain showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Severe thunderstorm",
}


def classify_weather_risk(weather_code: int | None, temperature_c: float | None, precipitation_mm: float | None, wind_speed_kmh: float | None) -> dict:
    code = int(weather_code or 0)
    label = WEATHER_LABELS.get(code, "Unknown weather")
    temp = float(temperature_c or 0.0)
    precipitation = float(precipitation_mm or 0.0)
    wind = float(wind_speed_kmh or 0.0)

    if code in {95, 96, 99}:
        return {
            "status": "DANGER",
            "reason": f"{label} conditions are active and may create immediate travel hazards.",
        }

    if code in {45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86} or precipitation >= 10 or wind >= 40 or temp >= 42:
        return {
            "status": "CAUTION",
            "reason": f"Current conditions ({label}, {precipitation:.1f} mm rain, {wind:.1f} km/h wind) suggest reduced safety for outdoor travel.",
        }

    return {
        "status": "NO_KNOWN_HAZARD",
        "reason": f"No major weather hazard is currently indicated for this location ({label}).",
    }


def fetch_weather_risk(latitude: float, longitude: float) -> dict:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,precipitation,wind_speed_10m,weather_code",
        "timezone": "auto",
        "forecast_days": 1,
    }
    url = f"https://api.open-meteo.com/v1/forecast?{parse.urlencode(params)}"
    with request.urlopen(url, timeout=12) as response:
        payload = json.loads(response.read().decode("utf-8"))

    current = payload.get("current") or {}
    weather_code = current.get("weather_code")
    temperature_c = current.get("temperature_2m")
    precipitation_mm = current.get("precipitation")
    wind_speed_kmh = current.get("wind_speed_10m")

    decision = classify_weather_risk(weather_code, temperature_c, precipitation_mm, wind_speed_kmh)
    score_by_status = {
        "NO_KNOWN_HAZARD": 90,
        "CAUTION": 60,
        "DANGER": 25,
    }
    band_by_status = {
        "NO_KNOWN_HAZARD": "high",
        "CAUTION": "moderate",
        "DANGER": "low",
    }

    return {
        "status": decision["status"],
        "reason": decision["reason"],
        "score": score_by_status[decision["status"]],
        "band": band_by_status[decision["status"]],
        "source": "Open-Meteo Forecast API",
        "location": {"latitude": latitude, "longitude": longitude},
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "weather": {
            "weatherCode": weather_code,
            "temperatureC": temperature_c,
            "precipitationMm": precipitation_mm,
            "windSpeedKmh": wind_speed_kmh,
            "label": WEATHER_LABELS.get(int(weather_code or 0), "Unknown weather"),
        },
    }
