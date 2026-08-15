import unittest

from app.services.safety import classify_weather_risk


class SafetyRiskClassificationTests(unittest.TestCase):
    def test_severe_weather_is_marked_danger(self):
        result = classify_weather_risk(
            weather_code=95,
            temperature_c=31.1,
            precipitation_mm=0.0,
            wind_speed_kmh=18.0,
        )
        self.assertEqual(result["status"], "DANGER")
        self.assertIn("Thunderstorm", result["reason"])

    def test_light_rain_is_caution(self):
        result = classify_weather_risk(
            weather_code=61,
            temperature_c=28.0,
            precipitation_mm=5.0,
            wind_speed_kmh=20.0,
        )
        self.assertEqual(result["status"], "CAUTION")

    def test_clear_weather_is_safe(self):
        result = classify_weather_risk(
            weather_code=0,
            temperature_c=25.0,
            precipitation_mm=0.0,
            wind_speed_kmh=8.0,
        )
        self.assertEqual(result["status"], "NO_KNOWN_HAZARD")


if __name__ == "__main__":
    unittest.main()
