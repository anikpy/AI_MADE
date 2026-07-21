import os

# Load settings based on DJANGO_ENV, defaulting to development
env = os.environ.get('DJANGO_ENV', 'development')

if env == 'production':
    from .prod import *
else:
    from .dev import *
