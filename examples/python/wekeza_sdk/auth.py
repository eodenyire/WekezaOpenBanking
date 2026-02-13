"""
Wekeza API Authentication Module
Handles OAuth 2.0 token management with caching
"""

import requests
import time
from typing import Dict, Optional


class WekezaAuth:
    """Handles authentication and token management for Wekeza API"""
    
    def __init__(self, config: Dict[str, str]):
        self.client_id = config['client_id']
        self.client_secret = config['client_secret']
        self.oauth_url = config['oauth_url']
        self.access_token: Optional[str] = None
        self.token_expiry: Optional[float] = None
        self.refresh_token: Optional[str] = None
    
    def get_access_token(self) -> str:
        """
        Get access token, using cached token if still valid
        
        Returns:
            str: Valid access token
        """
        # Return cached token if still valid (with 60s buffer)
        if self.access_token and self.token_expiry and self.token_expiry > time.time() + 60:
            return self.access_token
        
        # Try refresh token first if available
        if self.refresh_token:
            try:
                return self._refresh_access_token()
            except Exception as e:
                print(f"Token refresh failed: {e}, requesting new token")
        
        # Request new token
        return self._request_new_token()
    
    def _request_new_token(self) -> str:
        """
        Request new access token using client credentials
        
        Returns:
            str: Access token
        """
        try:
            response = requests.post(
                f"{self.oauth_url}/token",
                data={
                    'grant_type': 'client_credentials',
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'scope': 'accounts.read transactions.read payments.write'
                },
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            )
            response.raise_for_status()
            
            data = response.json()
            self.access_token = data['access_token']
            self.refresh_token = data.get('refresh_token')
            
            # Set expiry time (typically 3600 seconds)
            expires_in = data.get('expires_in', 3600)
            self.token_expiry = time.time() + expires_in
            
            return self.access_token
        except Exception as e:
            raise Exception(f"Authentication failed: {str(e)}")
    
    def _refresh_access_token(self) -> str:
        """
        Refresh access token using refresh token
        
        Returns:
            str: Access token
        """
        try:
            response = requests.post(
                f"{self.oauth_url}/token",
                data={
                    'grant_type': 'refresh_token',
                    'refresh_token': self.refresh_token,
                    'client_id': self.client_id,
                    'client_secret': self.client_secret
                },
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            )
            response.raise_for_status()
            
            data = response.json()
            self.access_token = data['access_token']
            if 'refresh_token' in data:
                self.refresh_token = data['refresh_token']
            
            expires_in = data.get('expires_in', 3600)
            self.token_expiry = time.time() + expires_in
            
            return self.access_token
        except Exception as e:
            raise Exception(f"Token refresh failed: {str(e)}")
    
    def clear_tokens(self):
        """Clear cached tokens"""
        self.access_token = None
        self.refresh_token = None
        self.token_expiry = None
