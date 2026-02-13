"""
Wekeza API Python SDK
Main client class
"""

import os
from dotenv import load_dotenv
from typing import Dict, Optional

from .auth import WekezaAuth
from .accounts import WekezaAccounts
from .payments import WekezaPayments
from .webhooks import WekezaWebhooks


class WekezaClient:
    """Main Wekeza API client"""
    
    def __init__(self, config: Dict[str, str]):
        """
        Initialize Wekeza client
        
        Args:
            config: Configuration dictionary with:
                - client_id: OAuth client ID
                - client_secret: OAuth client secret
                - base_url: API base URL (optional)
                - oauth_url: OAuth server URL (optional)
                - webhook_secret: Webhook secret (optional)
        """
        # Validate required config
        if not config.get('client_id') or not config.get('client_secret'):
            raise ValueError("client_id and client_secret are required")
        
        self.config = {
            'client_id': config['client_id'],
            'client_secret': config['client_secret'],
            'base_url': config.get('base_url', 'https://sandbox.wekeza.com/api/v1'),
            'oauth_url': config.get('oauth_url', 'https://sandbox.wekeza.com/oauth'),
            'webhook_secret': config.get('webhook_secret')
        }
        
        # Initialize modules
        self.auth = WekezaAuth(self.config)
        self.accounts = WekezaAccounts(self.config, self.auth)
        self.payments = WekezaPayments(self.config, self.auth)
        
        if self.config['webhook_secret']:
            self.webhooks = WekezaWebhooks(self.config['webhook_secret'])
    
    @classmethod
    def from_env(cls):
        """
        Create client from environment variables
        
        Returns:
            WekezaClient: Configured client instance
        """
        load_dotenv()
        
        return cls({
            'client_id': os.getenv('WEKEZA_CLIENT_ID'),
            'client_secret': os.getenv('WEKEZA_CLIENT_SECRET'),
            'base_url': os.getenv('WEKEZA_BASE_URL'),
            'oauth_url': os.getenv('WEKEZA_OAUTH_URL'),
            'webhook_secret': os.getenv('WEBHOOK_SECRET')
        })
