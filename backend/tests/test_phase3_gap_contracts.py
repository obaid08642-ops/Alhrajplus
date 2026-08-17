from server import BuyRequestIn, ResumeIn, JobApplicationIn, SupportTicketIn, _supported_country_or_default
from pydantic import ValidationError
import pytest


def test_buy_request_contract_and_country_fallback():
    body = BuyRequestIn(title="Need a phone", category="phones", country_code="UA")
    assert body.title == "Need a phone"
    assert _supported_country_or_default(body.country_code) == "SA"
    assert _supported_country_or_default("EG") == "EG"


def test_buy_request_rejects_short_title():
    with pytest.raises(ValidationError):
        BuyRequestIn(title="x", category="phones")


def test_resume_requires_absolute_length_url():
    body = ResumeIn(resume_url="https://cdn.example/resume.pdf")
    assert body.mime_type == "application/pdf"


def test_application_contract_allows_optional_resume():
    body = JobApplicationIn(cover_note="Please review my application", country_code="SA")
    assert body.resume_url is None


def test_support_ticket_priority_is_transport_safe():
    body = SupportTicketIn(subject="Listing problem", message="The listing does not open", priority="urgent")
    assert body.priority == "urgent"
