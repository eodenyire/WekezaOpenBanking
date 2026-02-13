"""
Wekeza API Accounts Module
Handles account information and transaction queries
"""

import requests
from typing import Dict, Any, Optional


class WekezaAccounts:
    """Handles account-related API calls"""
    
    def __init__(self, config: Dict[str, str], auth):
        self.base_url = config['base_url']
        self.auth = auth
    
    def _get_headers(self) -> Dict[str, str]:
        """Get authenticated headers"""
        token = self.auth.get_access_token()
        return {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def list_accounts(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        List all accounts for the authenticated user
        
        Args:
            params: Query parameters
            
        Returns:
            Dict containing account list
        """
        try:
            response = requests.get(
                f"{self.base_url}/accounts",
                headers=self._get_headers(),
                params=params or {}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise self._handle_error(e)
    
    def get_account(self, account_id: str) -> Dict[str, Any]:
        """
        Get account details by ID
        
        Args:
            account_id: Account ID
            
        Returns:
            Dict containing account details
        """
        try:
            response = requests.get(
                f"{self.base_url}/accounts/{account_id}",
                headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise self._handle_error(e)
    
    def get_balance(self, account_id: str) -> Dict[str, Any]:
        """
        Get account balance
        
        Args:
            account_id: Account ID
            
        Returns:
            Dict containing balance information
        """
        try:
            response = requests.get(
                f"{self.base_url}/accounts/{account_id}/balance",
                headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise self._handle_error(e)
    
    def get_transactions(self, account_id: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Get account transactions
        
        Args:
            account_id: Account ID
            params: Query parameters (fromDate, toDate, page, limit)
            
        Returns:
            Dict containing transaction list
        """
        try:
            response = requests.get(
                f"{self.base_url}/accounts/{account_id}/transactions",
                headers=self._get_headers(),
                params=params or {}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise self._handle_error(e)
    
    def _handle_error(self, error: Exception) -> Exception:
        """Handle API errors"""
        if isinstance(error, requests.HTTPError):
            response = error.response
            try:
                data = response.json()
                message = data.get('message') or data.get('error') or 'Unknown error'
            except Exception:
                message = response.text or 'Unknown error'
            return Exception(f"API Error ({response.status_code}): {message}")
        elif isinstance(error, requests.RequestException):
            return Exception(f"Network error: {str(error)}")
        else:
            return Exception(f"Request error: {str(error)}")
