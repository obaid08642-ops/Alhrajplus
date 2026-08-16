import asyncio
import server


class FakeCursor:
    def __init__(self, value):
        self.value = value

    async def to_list(self, length=None):
        return self.value


class FakeListings:
    async def find_one(self, *args, **kwargs):
        return {
            "id": "listing-1",
            "slug": "safe-listing-1",
            "status": "active",
            "title": 'عنوان "><script>alert(1)</script>',
            "description": 'وصف & "اختبار"',
            "price": 100,
            "currency": "ر.س",
            "currency_code": "SAR",
            "category": "cars",
            "city": "الرياض",
            "images": ["https://cdn.example/image.jpg?a=1&b=2"],
            "seller": {"name": "بائع"},
        }


class FakeDB:
    listings = FakeListings()


def test_model_validation_accepts_glb_gltf_and_cloudinary_raw():
    server._validate_model_3d({"model_3d_url": "https://cdn.example/item.glb"})
    server._validate_model_3d({"model_3d_url": "https://res.cloudinary.com/x/raw/upload/v1/listings/item"})
    server._validate_model_3d({})


def test_model_validation_rejects_unknown_extension():
    try:
        server._validate_model_3d({"model_3d_url": "https://cdn.example/item.obj"})
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 400
    else:
        raise AssertionError("unknown 3D extension was accepted")


def test_seo_html_escapes_attributes_and_uses_slug():
    previous = server.db
    server.db = FakeDB()
    try:
        response = asyncio.run(server.seo_listing_html("listing-1"))
        body = response.body.decode("utf-8")
        assert 'canonical" href="https://alhraj.online/listing/safe-listing-1"' in body
        assert "<script>alert(1)</script>" not in body
        assert "&lt;script&gt;alert(1)&lt;/script&gt;" in body
        assert "https://cdn.example/image.jpg?a=1&amp;b=2" in body
    finally:
        server.db = previous
