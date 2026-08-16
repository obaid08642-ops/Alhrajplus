"""Shared test bootstrap.

Network regression suites intentionally target a running backend. This default
prevents module collection from crashing when the developer has not supplied a
URL; the test output will then clearly show connection failures until the local
mock/test server or staging URL is started.
"""
import os

os.environ.setdefault("REACT_APP_BACKEND_URL", "http://127.0.0.1:8000")
