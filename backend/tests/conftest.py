"""
Global pytest configuration and fixtures for the finance platform.
"""
import django
import pytest


@pytest.fixture(autouse=True)
def use_eager_celery(settings):
    """
    Make all Celery tasks run synchronously in tests (no Redis required).
    This fixture applies to every test automatically.
    """
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.CELERY_TASK_EAGER_PROPAGATES = True
