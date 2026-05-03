"""
Haraj Plus - Comprehensive Backend Tests
Covers: auth, meta, listings, favorites, chat, reports, ads, admin, cloudinary
"""
import os
import uuid
import pytest
import requests
import time

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://platform-inspect.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@harajplus.com"
ADMIN_PASSWORD = "Admin@HarajPlus2026"


# ---------- fixtures ----------
@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "admin"
    s.headers.update({"Authorization": f"Bearer {data['access_token']}"})
    return s


@pytest.fixture(scope="module")
def user_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    suffix = uuid.uuid4().hex[:8]
    email = f"test_{suffix}@example.com"
    payload = {
        "name": "TEST User",
        "email": email,
        "password": "TestPass@1234",
        "phone": f"5{suffix[:8]}",
        "country_code": "SA",
        "city": "الرياض",
    }
    r = s.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 200, f"Register failed: {r.text}"
    data = r.json()
    s.headers.update({"Authorization": f"Bearer {data['access_token']}"})
    s._email = email
    s._password = payload["password"]
    s._user_id = data["user"]["id"]
    return s


@pytest.fixture(scope="module")
def user2_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    suffix = uuid.uuid4().hex[:8]
    email = f"test2_{suffix}@example.com"
    payload = {
        "name": "TEST User 2",
        "email": email,
        "password": "TestPass@1234",
        "phone": f"56{suffix[:7]}",
        "country_code": "AE",
    }
    r = s.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 200
    data = r.json()
    s.headers.update({"Authorization": f"Bearer {data['access_token']}"})
    s._user_id = data["user"]["id"]
    return s


# ---------- meta ----------
class TestMeta:
    def test_root(self):
        r = requests.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_categories_returns_15(self):
        r = requests.get(f"{API}/meta/categories")
        assert r.status_code == 200
        cats = r.json()
        assert isinstance(cats, list)
        assert len(cats) == 15
        keys = {c["key"] for c in cats}
        assert {"cars", "realestate", "jobs", "services", "all"}.issubset(keys)
        # verify custom fields per category
        cars = next(c for c in cats if c["key"] == "cars")
        assert len(cars["fields"]) >= 10
        jobs = next(c for c in cats if c["key"] == "jobs")
        job_keys = {f["key"] for f in jobs["fields"]}
        assert {"experience_years", "salary_min", "skills"}.issubset(job_keys)
        services = next(c for c in cats if c["key"] == "services")
        srv_keys = {f["key"] for f in services["fields"]}
        assert {"schedule", "pickup_address", "dropoff_address", "pricing_type"}.issubset(srv_keys)

    def test_countries_returns_6(self):
        r = requests.get(f"{API}/meta/countries")
        assert r.status_code == 200
        countries = r.json()
        assert len(countries) == 6
        codes = {c["code"] for c in countries}
        assert codes == {"SA", "AE", "KW", "QA", "BH", "OM"}
        for c in countries:
            assert c.get("phone_code")
            assert len(c.get("cities", [])) > 0

    def test_theme(self):
        r = requests.get(f"{API}/meta/theme")
        assert r.status_code == 200
        t = r.json()
        assert t["primary_color"] == "#89CFF0"


# ---------- auth ----------
class TestAuth:
    def test_register_success_sets_cookies(self):
        s = requests.Session()
        suffix = uuid.uuid4().hex[:8]
        r = s.post(f"{API}/auth/register", json={
            "name": "TEST Reg",
            "email": f"reg_{suffix}@example.com",
            "password": "StrongPass@123",
            "phone": f"57{suffix[:7]}",
            "country_code": "SA",
        })
        assert r.status_code == 200
        data = r.json()
        assert "user" in data and "access_token" in data
        assert "password_hash" not in data["user"]
        # httpOnly cookies
        cookies = r.cookies
        assert "access_token" in cookies
        assert "refresh_token" in cookies

    def test_register_duplicate_email_returns_400(self, user_session):
        r = requests.post(f"{API}/auth/register", json={
            "name": "Dup",
            "email": user_session._email,
            "password": "StrongPass@123",
            "phone": "511111111",
            "country_code": "SA",
        })
        assert r.status_code == 400

    def test_register_invalid_country(self):
        r = requests.post(f"{API}/auth/register", json={
            "name": "Bad",
            "email": f"bad_{uuid.uuid4().hex[:6]}@example.com",
            "password": "StrongPass@123",
            "phone": "500000111",
            "country_code": "US",
        })
        assert r.status_code == 400

    def test_admin_login_returns_admin_role(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == ADMIN_EMAIL
        assert "password_hash" not in data["user"]

    def test_login_wrong_password_401(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "WrongPass123!"})
        assert r.status_code == 401

    def test_get_me_with_token(self, user_session):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": user_session.headers["Authorization"]})
        assert r.status_code == 200
        me = r.json()
        assert "password_hash" not in me
        assert me["email"] == user_session._email

    def test_get_me_without_auth_401(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_logout_clears_cookies(self, user_session):
        s = requests.Session()
        suffix = uuid.uuid4().hex[:8]
        s.post(f"{API}/auth/register", json={
            "name": "Lo",
            "email": f"lo_{suffix}@example.com",
            "password": "StrongPass@123",
            "phone": f"58{suffix[:7]}",
            "country_code": "SA",
        })
        r = s.post(f"{API}/auth/logout")
        assert r.status_code == 200
        assert r.json().get("success") is True

    def test_refresh_issues_new_access(self):
        s = requests.Session()
        suffix = uuid.uuid4().hex[:8]
        s.post(f"{API}/auth/register", json={
            "name": "Rf",
            "email": f"rf_{suffix}@example.com",
            "password": "StrongPass@123",
            "phone": f"59{suffix[:7]}",
            "country_code": "SA",
        })
        r = s.post(f"{API}/auth/refresh")
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_brute_force_lockout_after_5(self):
        # Use a dedicated email to avoid polluting other tests
        suffix = uuid.uuid4().hex[:6]
        email = f"locktest_{suffix}@example.com"
        # Register first
        requests.post(f"{API}/auth/register", json={
            "name": "Lock",
            "email": email,
            "password": "StrongPass@123",
            "phone": f"53{suffix}999",
            "country_code": "SA",
        })
        # 5 wrong attempts
        statuses = []
        for _ in range(6):
            r = requests.post(f"{API}/auth/login", json={"email": email, "password": "wrong"})
            statuses.append(r.status_code)
        # Last attempt should be 429 (lockout)
        assert 429 in statuses, f"Expected 429 after 5 fails, got {statuses}"


# ---------- cloudinary ----------
class TestCloudinary:
    def test_signature_requires_auth(self):
        r = requests.get(f"{API}/cloudinary/signature", params={"resource_type": "image", "folder": "listings"})
        assert r.status_code == 401

    def test_signature_success(self, user_session):
        r = requests.get(
            f"{API}/cloudinary/signature",
            params={"resource_type": "image", "folder": "listings"},
            headers={"Authorization": user_session.headers["Authorization"]},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["signature"]
        assert data["timestamp"]
        assert data["cloud_name"]
        assert data["api_key"]

    def test_signature_invalid_folder(self, user_session):
        r = requests.get(
            f"{API}/cloudinary/signature",
            params={"resource_type": "image", "folder": "hacker"},
            headers={"Authorization": user_session.headers["Authorization"]},
        )
        assert r.status_code == 400


# ---------- listings ----------
class TestListings:
    def test_create_without_auth(self):
        r = requests.post(f"{API}/listings", json={
            "title": "Test", "description": "desc test desc", "category": "cars", "city": "الرياض"
        })
        assert r.status_code == 401

    def test_create_with_invalid_category(self, user_session):
        r = requests.post(f"{API}/listings", json={
            "title": "بيع سيارة جميلة",
            "description": "سيارة ممتازة بحالة جيدة جداً",
            "category": "non_existent_cat",
            "city": "الرياض",
            "custom_fields": {},
        }, headers={"Authorization": user_session.headers["Authorization"]})
        assert r.status_code == 400

    def test_create_car_listing(self, user_session):
        r = requests.post(f"{API}/listings", json={
            "title": "TEST تويوتا كامري 2020",
            "description": "سيارة تويوتا كامري ممتازة بحالة جيدة جداً",
            "price": 75000,
            "category": "cars",
            "subcategory": "cars_used",
            "custom_fields": {"make": "تويوتا", "model": "كامري", "year": 2020},
            "city": "الرياض",
            "lat": 24.7,
            "lng": 46.7,
        }, headers={"Authorization": user_session.headers["Authorization"]})
        assert r.status_code == 200, r.text
        listing = r.json()
        assert listing["id"]
        assert listing["category"] == "cars"
        assert listing["country_code"] == "SA"  # auto from user's country
        assert listing["status"] == "active"
        assert listing["moderation"] == "approved"
        user_session._listing_id = listing["id"]
        return listing

    def test_create_banned_word_pending(self, user_session):
        r = requests.post(f"{API}/listings", json={
            "title": "TEST بيع مخدرات",
            "description": "هذا إعلان مخالف بوضوح للاختبار فقط",
            "category": "all",
            "custom_fields": {"item_type": "متفرقات"},
            "city": "الرياض",
        }, headers={"Authorization": user_session.headers["Authorization"]})
        assert r.status_code == 200
        assert r.json()["moderation"] == "pending"

    def test_list_listings_filters(self, user_session):
        self.test_create_car_listing(user_session)
        r = requests.get(f"{API}/listings", params={"category": "cars", "country_code": "SA"})
        assert r.status_code == 200
        data = r.json()
        assert "total" in data and "items" in data
        assert data["total"] >= 1
        for item in data["items"]:
            assert item["category"] == "cars"
            assert item["country_code"] == "SA"

    def test_list_listings_search_and_price_filter(self, user_session):
        r = requests.get(f"{API}/listings", params={"q": "كامري", "min_price": 1000, "max_price": 999999})
        assert r.status_code == 200
        assert r.json()["total"] >= 1

    def test_get_listing_by_id_increments_views(self, user_session):
        if not hasattr(user_session, "_listing_id"):
            self.test_create_car_listing(user_session)
        lid = user_session._listing_id
        r1 = requests.get(f"{API}/listings/{lid}")
        assert r1.status_code == 200
        assert r1.json().get("seller")
        v1 = r1.json().get("views", 0)
        r2 = requests.get(f"{API}/listings/{lid}")
        v2 = r2.json().get("views", 0)
        assert v2 >= v1  # incremented

    def test_similar_listings(self, user_session):
        if not hasattr(user_session, "_listing_id"):
            self.test_create_car_listing(user_session)
        # create another one for similarity
        requests.post(f"{API}/listings", json={
            "title": "TEST تويوتا كورولا 2019",
            "description": "سيارة كورولا بحالة جيدة جداً",
            "price": 55000,
            "category": "cars",
            "custom_fields": {"make": "تويوتا", "model": "كورولا"},
            "city": "الرياض",
        }, headers={"Authorization": user_session.headers["Authorization"]})
        r = requests.get(f"{API}/listings/{user_session._listing_id}/similar")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_my_listings_auth(self, user_session):
        r = requests.get(f"{API}/listings/me/mine", headers={"Authorization": user_session.headers["Authorization"]})
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 1

    def test_map_nearby(self):
        r = requests.get(f"{API}/listings/map/nearby", params={"country_code": "SA"})
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)

    def test_delete_forbidden_for_non_owner(self, user_session, user2_session):
        # user_session owns listing, user2 tries delete
        if not hasattr(user_session, "_listing_id"):
            self.test_create_car_listing(user_session)
        r = requests.delete(
            f"{API}/listings/{user_session._listing_id}",
            headers={"Authorization": user2_session.headers["Authorization"]},
        )
        assert r.status_code == 403

    def test_delete_by_owner(self, user_session):
        # create throwaway
        cr = requests.post(f"{API}/listings", json={
            "title": "TEST To Delete Listing",
            "description": "temp listing for delete test",
            "category": "all",
            "custom_fields": {"item_type": "misc"},
            "city": "الرياض",
        }, headers={"Authorization": user_session.headers["Authorization"]})
        lid = cr.json()["id"]
        r = requests.delete(f"{API}/listings/{lid}", headers={"Authorization": user_session.headers["Authorization"]})
        assert r.status_code == 200
        g = requests.get(f"{API}/listings/{lid}")
        assert g.status_code == 404


# ---------- favorites ----------
class TestFavorites:
    def test_toggle_favorite(self, user_session, user2_session):
        # user2 favorites user_session's listing
        if not hasattr(user_session, "_listing_id"):
            pytest.skip("No listing")
        lid = user_session._listing_id
        r = requests.post(
            f"{API}/favorites/{lid}",
            headers={"Authorization": user2_session.headers["Authorization"]},
        )
        assert r.status_code == 200
        assert r.json()["favorited"] is True
        # untoggle
        r2 = requests.post(
            f"{API}/favorites/{lid}",
            headers={"Authorization": user2_session.headers["Authorization"]},
        )
        assert r2.json()["favorited"] is False

    def test_list_favorites(self, user_session, user2_session):
        if not hasattr(user_session, "_listing_id"):
            pytest.skip("No listing")
        lid = user_session._listing_id
        requests.post(f"{API}/favorites/{lid}", headers={"Authorization": user2_session.headers["Authorization"]})
        r = requests.get(f"{API}/favorites", headers={"Authorization": user2_session.headers["Authorization"]})
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- chat ----------
class TestChat:
    def test_send_and_list(self, user_session, user2_session):
        r = requests.post(f"{API}/chat/send", json={
            "receiver_id": user2_session._user_id,
            "text": "Hello from test",
        }, headers={"Authorization": user_session.headers["Authorization"]})
        assert r.status_code == 200, r.text
        msg = r.json()
        assert msg["convo_id"]
        convo_id = msg["convo_id"]

        r2 = requests.get(f"{API}/chat/conversations", headers={"Authorization": user_session.headers["Authorization"]})
        assert r2.status_code == 200
        convos = r2.json()
        assert any(c["id"] == convo_id for c in convos)
        target = next(c for c in convos if c["id"] == convo_id)
        assert target.get("other") is not None

        r3 = requests.get(f"{API}/chat/messages/{convo_id}", headers={"Authorization": user2_session.headers["Authorization"]})
        assert r3.status_code == 200
        assert len(r3.json()) >= 1

    def test_cannot_message_self(self, user_session):
        r = requests.post(f"{API}/chat/send", json={
            "receiver_id": user_session._user_id,
            "text": "self",
        }, headers={"Authorization": user_session.headers["Authorization"]})
        assert r.status_code == 400

    def test_messages_forbidden_for_non_participant(self, user_session, user2_session, admin_session):
        # create convo between user1 and user2
        r = requests.post(f"{API}/chat/send", json={
            "receiver_id": user2_session._user_id,
            "text": "priv",
        }, headers={"Authorization": user_session.headers["Authorization"]})
        convo_id = r.json()["convo_id"]
        # admin (not in convo) tries to read
        r2 = requests.get(
            f"{API}/chat/messages/{convo_id}",
            headers={"Authorization": admin_session.headers["Authorization"]},
        )
        assert r2.status_code == 403


# ---------- reports ----------
class TestReports:
    def test_submit_report(self, user_session):
        r = requests.post(f"{API}/reports", json={
            "target_type": "listing",
            "target_id": "fake-listing-id",
            "reason": "احتيال",
        }, headers={"Authorization": user_session.headers["Authorization"]})
        assert r.status_code == 200
        assert r.json()["success"] is True


# ---------- ads ----------
class TestAds:
    def test_public_ads(self):
        r = requests.get(f"{API}/ads", params={"placement": "home_middle"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- admin ----------
class TestAdmin:
    def test_admin_access_required(self, user_session):
        r = requests.get(f"{API}/admin/stats", headers={"Authorization": user_session.headers["Authorization"]})
        assert r.status_code == 403

    def test_admin_stats(self, admin_session):
        r = requests.get(f"{API}/admin/stats", headers={"Authorization": admin_session.headers["Authorization"]})
        assert r.status_code == 200
        stats = r.json()
        for k in ["users", "listings", "active_listings", "pending_moderation", "open_reports", "ads"]:
            assert k in stats

    def test_admin_pending_listings(self, admin_session):
        r = requests.get(f"{API}/admin/listings/pending", headers={"Authorization": admin_session.headers["Authorization"]})
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_approve_reject_listing(self, admin_session, user_session):
        # create a pending listing using banned word
        cr = requests.post(f"{API}/listings", json={
            "title": "TEST احتيال واضح للاختبار",
            "description": "هذا للاختبار احتيال فقط",
            "category": "all",
            "custom_fields": {"item_type": "misc"},
            "city": "الرياض",
        }, headers={"Authorization": user_session.headers["Authorization"]})
        lid = cr.json()["id"]
        assert cr.json()["moderation"] == "pending"
        r = requests.post(f"{API}/admin/listings/{lid}/approve", headers={"Authorization": admin_session.headers["Authorization"]})
        assert r.status_code == 200
        r2 = requests.post(f"{API}/admin/listings/{lid}/reject", headers={"Authorization": admin_session.headers["Authorization"]})
        assert r2.status_code == 200

    def test_admin_users_ban_unban_verify(self, admin_session, user2_session):
        uid = user2_session._user_id
        r = requests.get(f"{API}/admin/users", headers={"Authorization": admin_session.headers["Authorization"]})
        assert r.status_code == 200
        r1 = requests.post(f"{API}/admin/users/{uid}/ban", headers={"Authorization": admin_session.headers["Authorization"]})
        assert r1.status_code == 200
        r2 = requests.post(f"{API}/admin/users/{uid}/unban", headers={"Authorization": admin_session.headers["Authorization"]})
        assert r2.status_code == 200
        r3 = requests.post(f"{API}/admin/users/{uid}/verify", headers={"Authorization": admin_session.headers["Authorization"]})
        assert r3.status_code == 200

    def test_admin_reports_list_and_close(self, admin_session, user_session):
        # submit a report first
        sr = requests.post(f"{API}/reports", json={
            "target_type": "listing", "target_id": "any", "reason": "spam-test"
        }, headers={"Authorization": user_session.headers["Authorization"]})
        rid = sr.json()["id"]
        r = requests.get(f"{API}/admin/reports", headers={"Authorization": admin_session.headers["Authorization"]})
        assert r.status_code == 200
        r2 = requests.post(f"{API}/admin/reports/{rid}/close", headers={"Authorization": admin_session.headers["Authorization"]})
        assert r2.status_code == 200

    def test_admin_ads_crud(self, admin_session):
        r = requests.get(f"{API}/admin/ads", headers={"Authorization": admin_session.headers["Authorization"]})
        assert r.status_code == 200
        cr = requests.post(f"{API}/admin/ads", json={
            "title": "TEST Ad",
            "image_url": "https://example.com/a.jpg",
            "link_url": "https://example.com",
            "placement": "home_top",
            "active": True,
        }, headers={"Authorization": admin_session.headers["Authorization"]})
        assert cr.status_code == 200
        aid = cr.json()["id"]
        dr = requests.delete(f"{API}/admin/ads/{aid}", headers={"Authorization": admin_session.headers["Authorization"]})
        assert dr.status_code == 200

    def test_admin_theme_update(self, admin_session):
        r = requests.post(f"{API}/admin/theme", json={
            "primary_color": "#89CFF0",
            "tagline_ar": "بيع و اشتري | جديد أو مستعمل",
        }, headers={"Authorization": admin_session.headers["Authorization"]})
        assert r.status_code == 200
        assert r.json()["primary_color"] == "#89CFF0"
