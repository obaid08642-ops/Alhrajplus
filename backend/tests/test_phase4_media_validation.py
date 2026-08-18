import os

import pytest
from fastapi import HTTPException

import server


USER = {"id": "user-1", "country_code": "SA", "role": "user"}


def test_listing_media_requires_https_and_cardinality_even_without_cloudinary(monkeypatch):
    monkeypatch.delenv("CLOUDINARY_CLOUD_NAME", raising=False)
    with pytest.raises(HTTPException) as insecure:
        server._validate_listing_media_for_user(USER, ["http://example.test/x.jpg"], [], {})
    assert insecure.value.status_code == 422
    with pytest.raises(HTTPException) as too_many_images:
        server._validate_listing_media_for_user(USER, ["https://example.test/x.jpg"] * 31, [], {})
    assert too_many_images.value.status_code == 422


def test_listing_media_requires_configured_cloudinary_user_folder(monkeypatch):
    monkeypatch.setenv("CLOUDINARY_CLOUD_NAME", "haraj-cloud")
    allowed_image = "https://res.cloudinary.com/haraj-cloud/image/upload/v1/listings/user-1/photo.jpg"
    allowed_video = "https://res.cloudinary.com/haraj-cloud/video/upload/v1/listings/user-1/video.mp4"
    allowed_model = "https://res.cloudinary.com/haraj-cloud/raw/upload/v1/listings/user-1/model.glb"
    server._validate_listing_media_for_user(USER, [allowed_image], [allowed_video], {"model_3d_url": allowed_model})

    with pytest.raises(HTTPException) as other_user:
        server._validate_listing_media_for_user(USER, ["https://res.cloudinary.com/haraj-cloud/image/upload/v1/listings/user-2/photo.jpg"], [], {})
    assert other_user.value.status_code == 403

    with pytest.raises(HTTPException) as wrong_resource:
        server._validate_listing_media_for_user(USER, ["https://res.cloudinary.com/haraj-cloud/video/upload/v1/listings/user-1/video.mp4"], [], {})
    assert wrong_resource.value.status_code == 403
