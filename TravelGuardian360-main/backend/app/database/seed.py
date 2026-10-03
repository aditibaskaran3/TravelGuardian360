import json
import os
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.database import models  # noqa: F401  (registers every table)
from app.database.database import Base, SessionLocal, engine
from app.models import (
    EmergencyContact, FamilyMember, Location, MedicalInfo, Notification, NotificationRecipient, SafetyZone, SOSRequest,
    TouristID, TravelInfo, Trip, User, WeatherInfo,
)
from app.services.tourist_id import compute_record_hash, ensure_tourist_id
from app.utils.security import hash_password
from app.utils.time import utcnow

TOURIST_PASSWORD = "Tourist@123"


def ensure_admin(db: Session) -> None:
    email = os.getenv("ADMIN_EMAIL", "admin@travelguardian360.com").strip().lower()
    password = os.getenv("ADMIN_PASSWORD", "Admin@360")
    admin = db.query(User).filter(User.email == email).first()
    if admin is None:
        db.add(User(
            full_name="TravelGuardian Control", email=email, phone="+91 11 4000 0360",
            password_hash=hash_password(password), role="admin",
        ))
        db.commit()


ZONES = [
    # name, city, type, level, description, lat, lon, radius
    ("Connaught Place", "New Delhi", "safe", 88, "Well-lit commercial district with heavy police presence and tourist assistance booths.", 28.6315, 77.2167, 900),
    ("India Gate Lawns", "New Delhi", "safe", 90, "Open public grounds patrolled throughout the evening. Busy and well monitored.", 28.6129, 77.2295, 800),
    ("Chandni Chowk Market", "New Delhi", "caution", 55, "Dense crowds and narrow lanes. Pickpocketing is common during peak hours.", 28.6506, 77.2303, 700),
    ("Paharganj Main Bazaar", "New Delhi", "caution", 50, "Crowded backpacker area. Agree taxi fares before travelling and avoid unlit side streets.", 28.6448, 77.2130, 500),
    ("Yamuna Riverbank", "New Delhi", "high_risk", 25, "Isolated stretch with poor lighting after sunset. Avoid travelling alone.", 28.6700, 77.2500, 800),
    ("Hawa Mahal Quarter", "Jaipur", "safe", 86, "Main tourist precinct with regular patrols and visitor services.", 26.9239, 75.8267, 800),
    ("Johari Bazaar", "Jaipur", "caution", 58, "Busy shopping street. Watch bags in the evening rush.", 26.9190, 75.8270, 450),
    ("Amer Fort Approach", "Jaipur", "safe", 82, "Managed entry road with ticketed access and security staff.", 26.9855, 75.8513, 900),
    ("Taj Mahal Precinct", "Agra", "safe", 91, "Secured heritage zone with controlled entry and tourist police.", 27.1751, 78.0421, 1000),
    ("Sadar Bazaar Lanes", "Agra", "caution", 52, "Aggressive touts reported. Use registered guides and prepaid transport.", 27.1590, 78.0120, 600),
    ("Baga Beach Strip", "Goa", "caution", 60, "Strong currents beyond marked areas and crowded nightlife until late.", 15.5524, 73.7517, 1000),
    ("Anjuna Cliff Trail", "Goa", "high_risk", 30, "Unfenced cliff edge with no lifeguard cover. Avoid at night and in monsoon.", 15.5735, 73.7410, 600),
    ("Gateway of India", "Mumbai", "safe", 84, "Waterfront promenade with constant police presence.", 18.9220, 72.8347, 700),
]

TRAVEL_INFO = [
    ("emergency", "National Emergency Number", "Single number for police, fire and medical emergencies across India.", "112", None, 1),
    ("emergency", "Police", "Report crimes, theft or threats to personal safety.", "100", None, 2),
    ("emergency", "Fire Service", "Fire and rescue emergencies.", "101", None, 3),
    ("emergency", "Ambulance", "Medical emergencies and patient transport.", "102", None, 4),
    ("emergency", "Women Helpline", "24-hour support for women in distress.", "1091", None, 5),
    ("emergency", "Tourist Helpline", "Multilingual assistance for visitors, available round the clock.", "1363", None, 6),
    ("safety", "Use registered transport", "Book taxis through the prepaid counters at stations and airports. Share the vehicle number with a contact.", None, None, 1),
    ("safety", "Keep copies of your documents", "Carry photocopies of your passport and visa and keep originals in your accommodation safe.", None, None, 2),
    ("safety", "Stay hydrated and avoid peak heat", "Summer afternoons can exceed 40°C. Carry water and plan outdoor visits for the morning.", None, None, 3),
    ("safety", "Avoid isolated areas after dark", "Stay on well-lit, busy streets and check the Safety Zones tab before heading out.", None, None, 4),
    ("tourist", "Red Fort and Old Delhi", "Mughal-era fort with a sound and light show in the evening. Closed on Mondays.", None, "New Delhi", 1),
    ("tourist", "Humayun's Tomb", "Garden tomb that inspired the Taj Mahal. Best visited early morning.", None, "New Delhi", 2),
    ("tourist", "Amer Fort", "Hilltop fort near Jaipur with elephant-free jeep access and a palace complex.", None, "Jaipur", 3),
    ("tourist", "Taj Mahal at sunrise", "Entry opens at sunrise. Closed on Fridays for prayers.", None, "Agra", 4),
    ("travel", "Local SIM cards", "Tourist SIMs require passport and visa copies plus a photograph. Airport counters are the quickest option.", None, None, 1),
    ("travel", "Currency and payments", "UPI works almost everywhere. Keep small cash notes for markets and auto-rickshaws.", None, None, 2),
    ("travel", "Getting around Delhi", "The Metro is the fastest way to cross the city. Airport Express links the terminal with New Delhi station in 20 minutes.", None, "New Delhi", 3),
    ("travel", "Rail travel between cities", "Book intercity trains on the IRCTC app at least a week ahead during the tourist season.", None, None, 4),
    ("help", "Contact support", "Our team replies within a few hours. For anything urgent use the SOS button instead.", "+91 11 4000 0360", None, 1),
    ("help", "How does SOS work?", "Pressing SOS sends your location and emergency details to the monitoring team and shows your contacts. You can mark yourself safe at any time.", None, None, 2),
    ("help", "Who can see my location?", "Your position is shared with the monitoring team only while tracking is on or after you raise an SOS. Turn tracking off any time.", None, None, 3),
    ("help", "Is my Medical ID private?", "Medical details are released to administrators only during an open emergency request, and every access is logged.", None, None, 4),
]


def _make_user(db, name, email, phone, days_ago, nationality=None, dob=None, passport=None, avatar=None, active=True):
    created = utcnow() - timedelta(days=days_ago, hours=3)
    user = User(
        full_name=name, email=email, phone=phone, password_hash=hash_password(TOURIST_PASSWORD), role="user",
        is_active=active, avatar_url=avatar, created_at=created, last_login_at=utcnow() - timedelta(hours=days_ago * 3),
    )
    db.add(user)
    db.flush()
    tid = ensure_tourist_id(db, user)
    tid.nationality, tid.date_of_birth, tid.passport_number = nationality, dob, passport
    tid.record_hash = compute_record_hash(user, tid)
    return user


def _verify(db, user, admin):
    tid = user.tourist_id
    tid.verification_status, tid.verified_at, tid.verified_by = "verified", utcnow() - timedelta(days=1), admin.id


def _trip(db, user, destination, lat, lon, start_offset, end_offset, status, **extra):
    trip = Trip(
        user_id=user.id, destination=destination, destination_lat=lat, destination_lon=lon,
        start_date=date.today() + timedelta(days=start_offset), end_date=date.today() + timedelta(days=end_offset),
        status=status, started_at=utcnow() - timedelta(days=abs(start_offset)) if status != "upcoming" else None, **extra,
    )
    if status == "completed":
        trip.ended_at = utcnow() - timedelta(days=abs(end_offset))
    db.add(trip)
    db.flush()
    return trip


def _track(db, user, trip, lat, lon, label, minutes_ago, tracking=True, trail=()):
    for i, (dlat, dlon) in enumerate(trail):
        db.add(Location(
            user_id=user.id, trip_id=trip.id if trip else None, latitude=lat + dlat, longitude=lon + dlon,
            accuracy=12, label=label, tracking_active=True, recorded_at=utcnow() - timedelta(minutes=minutes_ago + (len(trail) - i) * 6),
        ))
    db.add(Location(
        user_id=user.id, trip_id=trip.id if trip else None, latitude=lat, longitude=lon, accuracy=10, label=label,
        tracking_active=tracking, recorded_at=utcnow() - timedelta(minutes=minutes_ago),
    ))


def _contacts(db, user, items):
    for i, (name, phone, rel) in enumerate(items):
        db.add(EmergencyContact(user_id=user.id, name=name, phone=phone, relationship_label=rel, is_primary=i == 0))


def _medical(db, user, blood, allergies=None, conditions=None, medications=None, notes=None, contact=None):
    db.add(MedicalInfo(
        user_id=user.id, blood_group=blood, allergies=allergies, conditions=conditions,
        medications=medications, notes=notes, emergency_contact=contact,
    ))


def _sos(db, user, trip, lat, lon, label, status, minutes_ago, message, handler=None, note=None):
    from app.services.serializers import build_emergency_info
    created = utcnow() - timedelta(minutes=minutes_ago)
    sos = SOSRequest(
        user_id=user.id, trip_id=trip.id if trip else None, latitude=lat, longitude=lon, location_label=label,
        status=status, message=message, emergency_info=build_emergency_info(db, user), admin_note=note, created_at=created,
    )
    if status in ("acknowledged", "resolved"):
        sos.acknowledged_at, sos.handled_by = created + timedelta(minutes=3), handler.id
    if status == "resolved":
        sos.resolved_at = created + timedelta(minutes=35)
    db.add(sos)


def _notify(db, title, message, type_, users, hours_ago, admin, target_all=False, read=False):
    note = Notification(
        title=title, message=message, type=type_, target_all=target_all, created_by=admin.id,
        created_at=utcnow() - timedelta(hours=hours_ago),
    )
    note.recipients = [NotificationRecipient(user_id=u.id, is_read=read) for u in users]
    db.add(note)


def seed(db: Session) -> None:
    admin = db.query(User).filter(User.role == "admin").first()

    aditi = _make_user(db, "Aditi Sharma", "aditi.sharma@mail.com", "+91 98200 11234", 9, "Indian", date(1999, 4, 12), "N4821907",
                       "https://i.pravatar.cc/200?img=47")
    liam = _make_user(db, "Liam Carter", "liam.carter@mail.com", "+44 7700 900312", 6, "British", date(1992, 9, 3), "533210489",
                      "https://i.pravatar.cc/200?img=12")
    mei = _make_user(db, "Mei Tanaka", "mei.tanaka@mail.com", "+81 90 1234 5678", 5, "Japanese", date(1995, 1, 22), "TK8820143",
                     "https://i.pravatar.cc/200?img=45")
    daniel = _make_user(db, "Daniel Okafor", "daniel.okafor@mail.com", "+234 803 555 0142", 4, "Nigerian", date(1989, 11, 30), "A09876543",
                        "https://i.pravatar.cc/200?img=33")
    sofia = _make_user(db, "Sofia Alvarez", "sofia.alvarez@mail.com", "+34 612 345 678", 8, "Spanish", date(1997, 6, 18), "XDA441290",
                       "https://i.pravatar.cc/200?img=44")
    rohan = _make_user(db, "Rohan Mehta", "rohan.mehta@mail.com", "+91 99870 45521", 2, "Indian", date(2000, 2, 7), "P7302918",
                       "https://i.pravatar.cc/200?img=15")
    _make_user(db, "Pierre Dubois", "pierre.dubois@mail.com", "+33 6 12 34 56 78", 11, "French", date(1985, 8, 14), "19AB52211", active=False)

    for user in (aditi, sofia, daniel):
        _verify(db, user, admin)
    liam.tourist_id.verification_requested_at = utcnow() - timedelta(hours=7)
    mei.tourist_id.verification_requested_at = utcnow() - timedelta(hours=20)

    _contacts(db, aditi, [("Rahul Sharma", "+91 98765 43210", "Brother"), ("Meera Sharma", "+91 98110 22331", "Mother")])
    _contacts(db, liam, [("Emma Carter", "+44 7700 900845", "Spouse")])
    _contacts(db, mei, [("Haruto Tanaka", "+81 80 9876 5432", "Father")])
    _contacts(db, daniel, [("Ngozi Okafor", "+234 802 555 0177", "Sister")])
    _contacts(db, sofia, [("Carlos Alvarez", "+34 600 112 233", "Brother")])
    _contacts(db, rohan, [("Anita Mehta", "+91 98100 55772", "Mother")])

    for owner, name, rel, dob, phone, nat, passport, blood, allergy, notes in [
        (liam, "Emma Carter", "Spouse", date(1993, 5, 11), "+44 7700 900845", "British", "533210511", "A+", "None known", None),
        (liam, "Oliver Carter", "Son", date(2018, 3, 2), None, "British", "533210877", "A-", "Peanuts", "Carries an adrenaline pen."),
        (aditi, "Kavya Sharma", "Sister", date(2002, 8, 19), "+91 98200 55123", "Indian", "N4821955", "B+", None, None),
    ]:
        db.add(FamilyMember(
            user_id=owner.id, full_name=name, relationship_label=rel, date_of_birth=dob, phone=phone, nationality=nat,
            passport_number=passport, blood_group=blood, allergies=allergy, medical_notes=notes,
        ))

    _medical(db, aditi, "O+", "Penicillin", "Mild asthma", "Salbutamol inhaler (as needed)", "Carries an inhaler in the side pocket of her bag.", "Rahul Sharma +91 98765 43210")
    _medical(db, liam, "A-", "None known", None, None, None, "Emma Carter +44 7700 900845")
    _medical(db, mei, "B+", "Shellfish", "Type 1 diabetes", "Insulin (rapid-acting)", "Insulin pen is kept in an insulated pouch.", "Haruto Tanaka +81 80 9876 5432")
    _medical(db, daniel, "AB+", "Peanuts", None, None, None, "Ngozi Okafor +234 802 555 0177")

    t_aditi = _trip(db, aditi, "New Delhi, India", 28.6139, 77.2090, -2, 5, "active", accommodation="The Imperial, Janpath", transport="Airport Express and local Metro", notes="Old Delhi food walk on Friday.")
    _trip(db, aditi, "Jaipur, India", 26.9124, 75.7873, 9, 13, "upcoming", accommodation="Samode Haveli", transport="Shatabdi Express")
    _trip(db, aditi, "Goa, India", 15.4989, 73.8278, -60, -54, "completed", accommodation="Taj Fort Aguada")
    t_liam = _trip(db, liam, "Jaipur, India", 26.9124, 75.7873, -3, 3, "active", accommodation="Rambagh Palace", transport="Private car with driver")
    t_mei = _trip(db, mei, "Agra, India", 27.1767, 78.0081, -1, 2, "active", accommodation="Oberoi Amarvilas", transport="Gatimaan Express")
    t_daniel = _trip(db, daniel, "Goa, India", 15.4989, 73.8278, -4, 4, "active", accommodation="Beachside villa, Anjuna", transport="Rented scooter")
    t_sofia = _trip(db, sofia, "Mumbai, India", 19.0760, 72.8777, -20, -12, "completed", accommodation="Taj Mahal Palace")
    _trip(db, sofia, "Goa, India", 15.4989, 73.8278, 21, 27, "upcoming", accommodation="Alila Diwa")
    _trip(db, rohan, "Jaipur, India", 26.9124, 75.7873, 4, 8, "upcoming", accommodation="Zostel Jaipur")

    _track(db, aditi, t_aditi, 28.6315, 77.2167, "Connaught Place, New Delhi", 1, trail=[(-0.004, -0.006), (-0.002, -0.003), (-0.0008, -0.001)])
    _track(db, liam, t_liam, 26.9239, 75.8267, "Hawa Mahal, Jaipur", 4, trail=[(0.003, 0.004), (0.001, 0.002)])
    _track(db, mei, t_mei, 27.1751, 78.0421, "Taj Mahal, Agra", 6, trail=[(-0.002, -0.004)])
    _track(db, daniel, t_daniel, 15.5735, 73.7410, "Anjuna, Goa", 12, trail=[(-0.004, 0.003), (-0.002, 0.001)])
    _track(db, sofia, None, 19.0760, 72.8777, "Mumbai, Maharashtra", 60 * 24 * 12, tracking=False)

    _sos(db, mei, t_mei, 27.1751, 78.0421, "Taj Mahal, Agra", "active", 5, "Feeling faint and dizzy near the east gate. Need medical help.")
    _sos(db, daniel, t_daniel, 15.5735, 73.7410, "Anjuna Cliff Trail, Goa", "acknowledged", 48, "Scooter broke down on the cliff road after dark.", admin, "Recovery vehicle dispatched.")
    _sos(db, sofia, t_sofia, 18.9220, 72.8347, "Gateway of India, Mumbai", "resolved", 60 * 24 * 14, "Bag stolen near the promenade.", admin, "Police report filed and passport replacement arranged.")

    everyone = [aditi, liam, mei, daniel, sofia, rohan]
    _notify(db, "Heat advisory for Delhi and Agra", "Temperatures are expected to cross 40°C this week. Carry water and avoid outdoor travel between 12 and 4 pm.", "weather", everyone, 5, admin, True)
    _notify(db, "Crowd alert near Chandni Chowk", "Heavy footfall is expected in Chandni Chowk this weekend. Keep valuables secure and avoid the main lane after 6 pm.", "safety", everyone, 20, admin, True, read=True)
    _notify(db, "Metro service change", "The Yellow Line is running at reduced frequency on Sunday for maintenance. Allow extra time for airport transfers.", "travel", [aditi, liam], 30, admin)
    _notify(db, "Trip reminder", "Your trip to New Delhi ends in 5 days. Review your return transport and keep your documents ready.", "trip", [aditi], 3, admin)
    _notify(db, "Welcome to TravelGuardian360", "Your Tourist ID is ready. Add an emergency contact and your Medical ID so help can reach you faster.", "general", [aditi], 24 * 9, admin, read=True)

    for name, city, ztype, level, desc, lat, lon, radius in ZONES:
        db.add(SafetyZone(name=name, city=city, zone_type=ztype, safety_level=level, description=desc, latitude=lat, longitude=lon, radius_m=radius))

    for category, title, content, phone, destination, order in TRAVEL_INFO:
        db.add(TravelInfo(category=category, title=title, content=content, phone=phone, destination=destination, sort_order=order))

    for key, name, lat, lon, temp, feels, cond, icon, hum, wind in [
        ("28.6:77.2", "New Delhi, Delhi, India", 28.6139, 77.2090, 36.4, 39.1, "Partly cloudy", "partly", 38, 14.2),
        ("26.9:75.8", "Jaipur, Rajasthan, India", 26.9124, 75.7873, 34.8, 36.0, "Mostly clear", "clear", 31, 11.5),
    ]:
        db.add(WeatherInfo(
            place_key=key, location_name=name, latitude=lat, longitude=lon, temperature=temp, feels_like=feels,
            condition=cond, icon=icon, humidity=hum, wind_speed=wind, fetched_at=utcnow() - timedelta(hours=2),
        ))
    db.commit()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        ensure_admin(db)
        if db.query(User).filter(User.role == "user").count() == 0:
            seed(db)


if __name__ == "__main__":
    init_db()
    print("Database ready.")
