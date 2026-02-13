"""
Wekeza API Payments Module
Handles payment initiation and tracking
"""

import requests
import secrets
import time
from typing import Dict, Any, Optional


class WekezaPayments:
    """Handles payment-related API calls"""
    
    def __init__(self, config: Dict[str, str], auth):
        self.base_url = config['base_url']
        self.auth = auth
    
    def _get_headers(self, additional_headers: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """Get authenticated headers"""
        token = self.auth.get_access_token()
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        if additional_headers:
            headers.update(additional_headers)
        return headers
    
    @staticmethod
    def generate_idempotency_key() -> str:
        """Generate a unique idempotency key"""
        return f"payment_{int(time.time())}_{secrets.token_hex(8)}"
    
    def initiate_payment(self, payment_data: Dict[str, Any], idempotency_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Initiate a payment
        
        Args:
            payment_data: Payment details
            idempotency_key: Optional idempotency key
            
        Returns:
            Dict containing payment response
        """
        try:
            if not idempotency_key:
                idempotency_key = self.generate_idempotency_key()
            
            response = requests.post(
                f"{self.base_url}/payments",
                json=payment_data,
                headers=self._get_headers({'Idempotency-Key': idempotency_key})
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise self._handle_error(e)
    
    def get_payment(self, payment_id: str) -> Dict[str, Any]:
        """
        Get payment details
        
        Args:
            payment_id: Payment ID
            
        Returns:
            Dict containing payment details
        """
        try:
            response = requests.get(
                f"{self.base_url}/payments/{payment_id}",
                headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise self._handle_error(e)
    
    def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """
        Get payment status
        
        Args:
            payment_id: Payment ID
            
        Returns:
            Dict containing payment status
        """
        try:
            response = requests.get(
                f"{self.base_url}/payments/{payment_id}/status",
                headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise self._handle_error(e)
    
    def list_payments(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        List payments
        
        Args:
            params: Query parameters (status, fromDate, toDate, page, limit)
            
        Returns:
            Dict containing payment list
        """
        try:
            response = requests.get(
                f"{self.base_url}/payments",
                headers=self._get_headers(),
                params=params or {}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise self._handle_error(e)
    
    def cancel_payment(self, payment_id: str, reason: str) -> Dict[str, Any]:
        """
        Cancel a payment
        
        Args:
            payment_id: Payment ID
            reason: Cancellation reason
            
        Returns:
            Dict containing cancellation response
        """
        try:
            response = requests.post(
                f"{self.base_url}/payments/{payment_id}/cancel",
                json={'reason': reason},
                headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise self._handle_error(e)
    
    def mpesa_stk_push(self, mpesa_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Initiate M-Pesa STK Push
        
        Args:
            mpesa_data: M-Pesa payment details
            
        Returns:
            Dict containing M-Pesa response
        """
        try:
            response = requests.post(
                f"{self.base_url}/payments/mpesa/stk-push",
                json=mpesa_data,
                headers=self._get_headers()
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
            except:
                message = response.text or 'Unknown error'
            return Exception(f"API Error ({response.status_code}): {message}")
        elif isinstance(error, requests.RequestException):
            return Exception(f"Network error: {str(error)}")
        else:
            return Exception(f"Request error: {str(error)}")
