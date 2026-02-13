"""
Wekeza API Python SDK
"""

from .client import WekezaClient
from .auth import WekezaAuth
from .accounts import WekezaAccounts
from .payments import WekezaPayments
from .webhooks import WekezaWebhooks

__version__ = "1.0.0"
__all__ = [
    "WekezaClient",
    "WekezaAuth",
    "WekezaAccounts",
    "WekezaPayments",
    "WekezaWebhooks"
]
