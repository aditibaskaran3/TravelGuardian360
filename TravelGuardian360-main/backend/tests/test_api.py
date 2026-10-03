import os
import tempfile

_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["ADMIN_EMAIL"] = "admin@travelguardian360.com"
os.environ["ADMIN_PASSWORD"] = "Admin@360"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

TOURIST = {"email": "aditi.sharma@mail.com", "password": "Tourist@123"}
ADMIN = {"email": "admin@travelguardian360.com", "password": "Admin@360"}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def auth(client, path, creds):
    r = client.post(path, json=creds)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture(scope="module")
def tourist(client):
    return auth(client, "/auth/login", TOURIST)


@pytest.fixture(scope="module")
def admin(client):
    return auth(client, "/admin/login", ADMIN)


def test_registration_rules(client):
    body = {"full_name": "Test Person", "email": "test.person@mail.com", "phone": "+91 90000 11111",
            "password": "Passw0rdX", "confirm_password": "Passw0rdX", "role": "admin"}
    r = client.post("/auth/register", json=body)
    assert r.status_code == 201
    assert r.json()["user"]["role"] == "user"  # role in the payload is ignored
    assert client.post("/auth/register", json=body).status_code == 409
    assert client.post("/auth/register", json={**body, "email": "x@y"}).status_code == 422
    assert client.post("/auth/register", json={**body, "email": "a1@mail.com", "password": "short"}).status_code == 422


def test_login_and_roles(client, tourist, admin):
    assert client.post("/auth/login", json={**TOURIST, "password": "wrong"}).status_code == 401
    # administrators cannot use the tourist login and tourists cannot use the admin login
    assert client.post("/auth/login", json=ADMIN).status_code == 403
    assert client.post("/admin/login", json=TOURIST).status_code == 403
    assert client.get("/users/me", headers=tourist).json()["tourist_id"].startswith("TG360-")


def test_admin_routes_are_protected(client, tourist, admin):
    for path in ["/admin/dashboard", "/admin/users", "/admin/tourists", "/admin/trips", "/admin/locations",
                 "/admin/sos", "/admin/safety-zones", "/admin/notifications"]:
        assert client.get(path).status_code == 401, path
        assert client.get(path, headers=tourist).status_code == 403, path
        assert client.get(path, headers=admin).status_code == 200, path
    assert client.delete("/admin/users/1", headers=tourist).status_code == 403
    # tourist routes are not for admins either
    assert client.get("/trips", headers=admin).status_code == 403


def test_dashboard_numbers(client, admin):
    d = client.get("/admin/dashboard", headers=admin).json()
    assert d["active_trips"] >= 4 and d["safety_zones"] == 13
    assert d["sos_by_status"]["active"] >= 1


def test_trip_lifecycle_reaches_admin(client, tourist, admin):
    r = client.post("/trips", headers=tourist, json={
        "destination": "Udaipur, India", "start_date": "2030-01-10", "end_date": "2030-01-14"})
    assert r.status_code == 201
    trip = r.json()
    assert client.post("/trips", headers=tourist, json={"destination": "X", "start_date": "2030-01-10", "end_date": "2030-01-01"}).status_code == 422
    assert client.post(f"/trips/{trip['id']}/start", headers=tourist).status_code == 409  # Delhi trip already active
    assert any(t["destination"] == "Udaipur, India" for t in client.get("/admin/trips?status=upcoming", headers=admin).json())
    assert client.delete(f"/trips/{trip['id']}", headers=tourist).status_code == 204


def test_location_and_sos_flow(client, tourist, admin):
    r = client.post("/locations", headers=tourist, json={"latitude": 28.63, "longitude": 77.21, "label": "Connaught Place"})
    assert r.status_code == 201 and r.json()["trip_id"]
    assert client.post("/locations", headers=tourist, json={"latitude": 123, "longitude": 0}).status_code == 422
    assert client.get("/locations/latest", headers=tourist).json()["status"] == "live"

    sos = client.post("/sos", headers=tourist, json={"latitude": 28.63, "longitude": 77.21}).json()
    assert sos["status"] == "active"
    assert client.post("/sos", headers=tourist, json={"latitude": 28.63, "longitude": 77.21}).json()["id"] == sos["id"]
    assert any(s["id"] == sos["id"] for s in client.get("/admin/sos?status=active", headers=admin).json())

    r = client.put(f"/admin/sos/{sos['id']}", headers=admin, json={"status": "acknowledged"})
    assert r.json()["status"] == "acknowledged"
    assert client.get("/sos/current", headers=tourist).json()["status"] == "acknowledged"
    titles = [n["title"] for n in client.get("/notifications", headers=tourist).json()]
    assert "Emergency update" in titles

    med = client.get(f"/admin/users/{sos['user_id']}/emergency-medical", headers=admin)
    assert med.status_code == 200 and "notes" not in med.json() and "medications" not in med.json()
    client.put(f"/admin/sos/{sos['id']}", headers=admin, json={"status": "resolved"})
    assert client.get(f"/admin/users/{sos['user_id']}/emergency-medical", headers=admin).status_code == 403


def test_contacts_and_medical(client, tourist):
    c = client.post("/emergency-contacts", headers=tourist, json={"name": "Priya Nair", "phone": "+91 98000 12345", "relationship": "Friend", "is_primary": True})
    assert c.status_code == 201
    contacts = client.get("/emergency-contacts", headers=tourist).json()
    assert sum(1 for x in contacts if x["is_primary"]) == 1
    assert client.delete(f"/emergency-contacts/{c.json()['id']}", headers=tourist).status_code == 204
    assert client.post("/emergency-contacts", headers=tourist, json={"name": "A", "phone": "abc", "relationship": "x"}).status_code == 422

    saved = client.put("/medical", headers=tourist, json={"blood_group": "o+", "allergies": "Penicillin"}).json()
    assert saved["blood_group"] == "O+"
    assert client.put("/medical", headers=tourist, json={"blood_group": "Z"}).status_code == 422


def test_zone_changes_reach_tourists(client, tourist, admin):
    z = client.post("/admin/safety-zones", headers=admin, json={
        "name": "Test Lane", "city": "New Delhi", "zone_type": "high_risk", "safety_level": 10,
        "latitude": 28.7, "longitude": 77.3, "radius_m": 300}).json()
    status = client.get("/safety-zones/status?lat=28.7&lon=77.3", headers=tourist).json()
    assert status["status"] == "high_risk" and status["zone"]["name"] == "Test Lane"
    client.put(f"/admin/safety-zones/{z['id']}", headers=admin, json={**z, "zone_type": "safe", "safety_level": 90})
    assert client.get("/safety-zones/status?lat=28.7&lon=77.3", headers=tourist).json()["label"] == "Safe"
    assert client.delete(f"/admin/safety-zones/{z['id']}", headers=admin).status_code == 204


def test_targeted_notification(client, tourist, admin):
    users = client.get("/admin/users?q=Aditi", headers=admin).json()
    uid = users[0]["id"]
    n = client.post("/admin/notifications", headers=admin, json={
        "title": "Targeted notice", "message": "Only for one tourist", "type": "safety", "target_all": False, "target_user_ids": [uid]})
    assert n.status_code == 201 and n.json()["recipient_count"] == 1
    assert "Targeted notice" in [x["title"] for x in client.get("/notifications", headers=tourist).json()]
    other = auth(client, "/auth/login", {"email": "liam.carter@mail.com", "password": "Tourist@123"})
    assert "Targeted notice" not in [x["title"] for x in client.get("/notifications", headers=other).json()]


def test_admin_user_management(client, admin):
    users = client.get("/admin/users?q=Rohan", headers=admin).json()
    uid = users[0]["id"]
    assert client.put(f"/admin/users/{uid}", headers=admin, json={"is_active": False}).json()["is_active"] is False
    assert client.post("/auth/login", json={"email": "rohan.mehta@mail.com", "password": "Tourist@123"}).status_code == 403
    client.put(f"/admin/users/{uid}", headers=admin, json={"is_active": True})
    assert client.get(f"/admin/users?q=TG360", headers=admin).status_code == 200


def test_weather_and_safety_status(client, tourist):
    r = client.get("/weather?lat=28.6139&lon=77.209", headers=tourist)
    assert r.status_code == 200 and "temperature" in r.json()
    s = client.get("/safety-zones/status?lat=28.6315&lon=77.2167", headers=tourist).json()
    assert s["label"] == "Safe"


def test_bulk_verification(client, tourist, admin):
    client.post("/tourist-id/me/verification-request", headers=tourist)
    pending = client.get("/admin/tourists?verification=pending", headers=admin).json()
    assert any(t["verification_requested"] for t in pending)
    assert client.post("/admin/tourists/verify-requested", headers=tourist).status_code == 403
    done = client.post("/admin/tourists/verify-requested", headers=admin).json()
    assert done["verified"] >= 1
    assert client.post("/admin/tourists/verify-requested", headers=admin).json()["verified"] == 0


def test_selected_bulk_verification(client, tourist, admin):
    client.put("/tourist-id/me", headers=tourist, json={"nationality": "Indian"})  # resets to pending
    client.post("/tourist-id/me/verification-request", headers=tourist)
    me = client.get("/users/me", headers=tourist).json()["id"]
    assert client.post("/admin/tourists/verify-requested", headers=admin, json={"user_ids": []}).json()["verified"] == 0
    assert client.post("/admin/tourists/verify-requested", headers=admin, json={"user_ids": [me]}).json()["verified"] == 1


def test_server_text_follows_language_header(client, tourist, monkeypatch):
    from app.services import translate

    monkeypatch.setattr(translate, "_fetch", lambda text, lang: f"[{lang}] {text}")
    zones = client.get("/safety-zones", headers={**tourist, "X-Lang": "hi"}).json()
    assert zones[0]["name"].startswith("[hi] ")
    english = client.get("/safety-zones", headers=tourist).json()
    assert not english[0]["name"].startswith("[")
    error = client.post("/auth/login", headers={"X-Lang": "fr"}, json={"email": "aditi.sharma@mail.com", "password": "wrong"})
    assert error.status_code == 401 and error.json()["detail"].startswith("[fr] ")
    unsupported = client.get("/safety-zones", headers={**tourist, "X-Lang": "xx"}).json()
    assert not unsupported[0]["name"].startswith("[")


def test_family_members(client, tourist, admin):
    created = client.post("/family", headers=tourist, json={
        "full_name": "Isha Verma", "relationship": "Daughter", "date_of_birth": "2016-04-02", "blood_group": "b+", "allergies": "Dust"})
    assert created.status_code == 201 and created.json()["blood_group"] == "B+"
    member_id = created.json()["id"]
    assert client.post("/family", headers=tourist, json={"full_name": "X", "relationship": "Son"}).status_code == 422
    assert client.post("/family", headers=tourist, json={"full_name": "Future Kid", "relationship": "Son", "date_of_birth": "2999-01-01"}).status_code == 422
    assert client.put(f"/family/{member_id}", headers=tourist, json={"full_name": "Isha Verma", "relationship": "Daughter", "is_travelling": False}).json()["is_travelling"] is False
    me = client.get("/users/me", headers=tourist).json()
    assert me["family_count"] >= 1
    detail = client.get(f"/admin/users/{me['id']}", headers=admin).json()
    assert any(f["full_name"] == "Isha Verma" for f in detail["family"])
    assert "passport_number" not in detail["family"][0]
    assert client.get("/family", headers=admin).status_code == 403
    assert client.delete(f"/family/{member_id}", headers=tourist).status_code == 204
