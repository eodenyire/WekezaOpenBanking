# Wekeza API - Python Examples

Complete examples for integrating with the Wekeza Open Banking Platform using Python 3.8+.

## Prerequisites

```bash
pip install requests python-dotenv
```

## Setup

Create a `.env` file:

```env
WEKEZA_CLIENT_ID=your_client_id
WEKEZA_CLIENT_SECRET=your_client_secret
WEKEZA_BASE_URL=https://sandbox.wekeza.com/api/v1
WEKEZA_OAUTH_URL=https://sandbox.wekeza.com/oauth
WEBHOOK_SECRET=your_webhook_secret
```

## Authentication

### Get Access Token

```python
# auth.py
import requests
import time
from typing import Dict, Optional
from dotenv import load_dotenv
import os

load_dotenv()

class WekezaAuth:
    def __init__(self):
        self.client_id = os.getenv('WEKEZA_CLIENT_ID')
        self.client_secret = os.getenv('WEKEZA_CLIENT_SECRET')
        self.oauth_url = os.getenv('WEKEZA_OAUTH_URL')
        self.access_token: Optional[str] = None
        self.token_expiry: Optional[float] = None
    
    def get_access_token(self) -> str:
        """Get access token, using cached token if still valid."""
        if self.access_token and self.token_expiry and self.token_expiry > time.time():
            return self.access_token
        
        try:
            response = requests.post(
                f'{self.oauth_url}/token',
                data={
                    'grant_type': 'client_credentials',
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'scope': 'accounts.read transactions.read payments.write'
                }
            )
            response.raise_for_status()
            
            data = response.json()
            self.access_token = data['access_token']
            self.token_expiry = time.time() + data['expires_in'] - 60  # 1 min buffer
            
            return self.access_token
        
        except requests.exceptions.RequestException as e:
            print(f'Authentication failed: {e}')
            raise
    
    def refresh_token(self, refresh_token: str) -> Dict:
        """Refresh access token using refresh token."""
        try:
            response = requests.post(
                f'{self.oauth_url}/token',
                data={
                    'grant_type': 'refresh_token',
                    'refresh_token': refresh_token,
                    'client_id': self.client_id,
                    'client_secret': self.client_secret
                }
            )
            response.raise_for_status()
            
            data = response.json()
            self.access_token = data['access_token']
            self.token_expiry = time.time() + data['expires_in'] - 60
            
            return {
                'access_token': data['access_token'],
                'refresh_token': data['refresh_token']
            }
        
        except requests.exceptions.RequestException as e:
            print(f'Token refresh failed: {e}')
            raise
```

## Accounts API

### Get Accounts

```python
# accounts.py
import requests
from typing import Dict, List, Optional
from auth import WekezaAuth
import os

class WekezaAccounts:
    def __init__(self):
        self.auth = WekezaAuth()
        self.base_url = os.getenv('WEKEZA_BASE_URL')
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with auth token."""
        token = self.auth.get_access_token()
        return {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def list_accounts(self, filters: Optional[Dict] = None) -> Dict:
        """List all accounts."""
        try:
            response = requests.get(
                f'{self.base_url}/accounts',
                headers=self._get_headers(),
                params=filters or {}
            )
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            self._handle_error(e)
    
    def get_account(self, account_id: str) -> Dict:
        """Get specific account details."""
        try:
            response = requests.get(
                f'{self.base_url}/accounts/{account_id}',
                headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            self._handle_error(e)
    
    def get_balance(self, account_id: str) -> Dict:
        """Get account balance."""
        try:
            response = requests.get(
                f'{self.base_url}/accounts/{account_id}/balance',
                headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            self._handle_error(e)
    
    def get_transactions(self, account_id: str, filters: Optional[Dict] = None) -> Dict:
        """Get account transactions."""
        try:
            response = requests.get(
                f'{self.base_url}/accounts/{account_id}/transactions',
                headers=self._get_headers(),
                params=filters or {}
            )
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            self._handle_error(e)
    
    def _handle_error(self, error: requests.exceptions.RequestException):
        """Handle API errors."""
        if hasattr(error, 'response') and error.response is not None:
            try:
                error_data = error.response.json()
                print(f"API Error: {error_data}")
                raise Exception(error_data.get('error', {}).get('message', 'API request failed'))
            except ValueError:
                print(f"HTTP Error {error.response.status_code}: {error.response.text}")
                raise Exception(f"API request failed with status {error.response.status_code}")
        else:
            print(f"Network Error: {error}")
            raise Exception("Network error occurred")
```

## Payments API

### Initiate Payment

```python
# payments.py
import requests
import uuid
from typing import Dict, Optional
from auth import WekezaAuth
import os

class WekezaPayments:
    def __init__(self):
        self.auth = WekezaAuth()
        self.base_url = os.getenv('WEKEZA_BASE_URL')
    
    def _get_headers(self, idempotency_key: Optional[str] = None) -> Dict[str, str]:
        """Get request headers with auth token."""
        token = self.auth.get_access_token()
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        if idempotency_key:
            headers['Idempotency-Key'] = idempotency_key
        
        return headers
    
    def initiate_payment(self, payment_data: Dict) -> Dict:
        """Initiate a new payment."""
        try:
            idempotency_key = str(uuid.uuid4())
            
            response = requests.post(
                f'{self.base_url}/payments',
                json=payment_data,
                headers=self._get_headers(idempotency_key)
            )
            
            if response.status_code == 409:
                print('Duplicate payment detected')
                return response.json()
            
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            self._handle_error(e)
    
    def get_payment_status(self, payment_id: str) -> Dict:
        """Get payment status."""
        try:
            response = requests.get(
                f'{self.base_url}/payments/{payment_id}',
                headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            self._handle_error(e)
    
    def list_payments(self, filters: Optional[Dict] = None) -> Dict:
        """List payments."""
        try:
            response = requests.get(
                f'{self.base_url}/payments',
                headers=self._get_headers(),
                params=filters or {}
            )
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            self._handle_error(e)
    
    def cancel_payment(self, payment_id: str, reason: str) -> Dict:
        """Cancel a payment."""
        try:
            response = requests.post(
                f'{self.base_url}/payments/{payment_id}/cancel',
                json={'reason': reason},
                headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            self._handle_error(e)
    
    def initiate_mpesa_payment(self, phone_number: str, amount: float, reference: str) -> Dict:
        """Initiate M-Pesa payment."""
        try:
            response = requests.post(
                f'{self.base_url}/payments/mpesa/stkpush',
                json={
                    'phoneNumber': phone_number,
                    'amount': amount,
                    'accountReference': reference,
                    'transactionDesc': 'Payment via M-Pesa'
                },
                headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            self._handle_error(e)
    
    def _handle_error(self, error: requests.exceptions.RequestException):
        """Handle API errors."""
        if hasattr(error, 'response') and error.response is not None:
            try:
                error_data = error.response.json()
                print(f"API Error: {error_data}")
                raise Exception(error_data.get('error', {}).get('message', 'API request failed'))
            except ValueError:
                print(f"HTTP Error {error.response.status_code}: {error.response.text}")
                raise Exception(f"API request failed with status {error.response.status_code}")
        else:
            print(f"Network Error: {error}")
            raise Exception("Network error occurred")
```

## Usage Examples

### Example 1: Get Account Balance

```python
# example_balance.py
from accounts import WekezaAccounts

def check_balance():
    accounts = WekezaAccounts()
    
    try:
        # Get all accounts
        account_list = accounts.list_accounts()
        print(f"Total accounts: {len(account_list['data'])}")
        
        # Get balance for first account
        if account_list['data']:
            account_id = account_list['data'][0]['id']
            balance = accounts.get_balance(account_id)
            
            print(f"Account: {balance['accountNumber']}")
            print(f"Available Balance: {balance['balance']['currency']} {balance['balance']['available']}")
            print(f"Current Balance: {balance['balance']['currency']} {balance['balance']['current']}")
    
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check_balance()
```

### Example 2: Make a Payment

```python
# example_payment.py
import time
from payments import WekezaPayments

def make_payment():
    payments = WekezaPayments()
    
    try:
        payment = payments.initiate_payment({
            'sourceAccountId': 'acc_1234567890',
            'destinationAccountNumber': '1009876543',
            'amount': 5000.00,
            'currency': 'KES',
            'description': 'Payment for services',
            'reference': 'INV-2026-001'
        })
        
        print(f"Payment initiated: {payment['id']}")
        print(f"Status: {payment['status']}")
        
        # Poll for status
        status = payment['status']
        attempts = 0
        max_attempts = 10
        
        while status in ['PENDING', 'PROCESSING'] and attempts < max_attempts:
            time.sleep(2)  # Wait 2 seconds
            
            updated = payments.get_payment_status(payment['id'])
            status = updated['status']
            attempts += 1
            
            print(f"Attempt {attempts}: Status = {status}")
        
        print(f"Final status: {status}")
    
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    make_payment()
```

### Example 3: Get Transaction History

```python
# example_transactions.py
from accounts import WekezaAccounts

def get_transaction_history():
    accounts = WekezaAccounts()
    
    try:
        transactions = accounts.get_transactions('acc_1234567890', {
            'fromDate': '2026-01-01',
            'toDate': '2026-02-13',
            'perPage': 50
        })
        
        summary = transactions['summary']
        print(f"Total transactions: {summary['totalTransactions']}")
        print(f"Total credits: {summary['totalCredits']}")
        print(f"Total debits: {summary['totalDebits']}")
        print(f"Net amount: {summary['netAmount']}")
        print("\nRecent transactions:")
        
        for txn in transactions['data'][:5]:
            sign = '+' if txn['type'] == 'CREDIT' else '-'
            print(f"{txn['transactionDate']} | {sign}{txn['amount']} {txn['currency']} | {txn['description']}")
    
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    get_transaction_history()
```

## Webhook Handler

### Flask Webhook Endpoint

```python
# webhook_server.py
from flask import Flask, request, jsonify
import hmac
import hashlib
import time
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

def verify_webhook_signature(payload: str, signature: str, secret: str) -> bool:
    """Verify webhook signature."""
    try:
        elements = dict(e.split('=') for e in signature.split(','))
        timestamp = int(elements['t'])
        sig = elements['v1']
        
        # Check timestamp is within 5 minutes
        now = int(time.time())
        if abs(now - timestamp) > 300:
            raise ValueError('Webhook timestamp too old')
        
        # Compute expected signature
        signed_payload = f"{timestamp}.{payload}"
        expected_sig = hmac.new(
            secret.encode(),
            signed_payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures
        if not hmac.compare_digest(sig, expected_sig):
            raise ValueError('Invalid webhook signature')
        
        return True
    
    except Exception as e:
        print(f"Signature verification failed: {e}")
        return False

@app.route('/webhooks/wekeza', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Wekeza-Signature')
    payload = request.get_data(as_text=True)
    event = request.get_json()
    
    try:
        # Verify signature
        if not verify_webhook_signature(payload, signature, os.getenv('WEBHOOK_SECRET')):
            return jsonify({'error': 'Invalid signature'}), 400
        
        # Acknowledge receipt
        response = jsonify({'received': True})
        
        # Process event asynchronously (in production, use task queue)
        process_webhook(event)
        
        return response, 200
    
    except Exception as e:
        print(f'Webhook error: {e}')
        return jsonify({'error': str(e)}), 400

def process_webhook(event: dict):
    """Process webhook event."""
    print(f"Processing webhook: {event['type']}")
    
    event_type = event['type']
    data = event['data']
    
    if event_type == 'payment.completed':
        handle_payment_completed(data)
    elif event_type == 'payment.failed':
        handle_payment_failed(data)
    elif event_type == 'transaction.posted':
        handle_transaction_posted(data)
    elif event_type == 'consent.revoked':
        handle_consent_revoked(data)
    else:
        print(f"Unknown event type: {event_type}")

def handle_payment_completed(data: dict):
    print(f"Payment completed: {data['paymentId']}")
    # Update database, notify user, etc.

def handle_payment_failed(data: dict):
    print(f"Payment failed: {data['paymentId']}")
    # Notify user, retry logic, etc.

def handle_transaction_posted(data: dict):
    print(f"Transaction posted: {data['transactionId']}")
    # Update records, trigger notifications, etc.

def handle_consent_revoked(data: dict):
    print(f"Consent revoked: {data['consentId']}")
    # Clean up tokens, disable features, etc.

if __name__ == '__main__':
    app.run(port=3000, debug=True)
```

## Error Handling

### Retry with Exponential Backoff

```python
# retry.py
import time
from typing import Callable, TypeVar, Any
import requests

T = TypeVar('T')

def retry_with_backoff(
    func: Callable[[], T],
    max_retries: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 10.0
) -> T:
    """Retry function with exponential backoff."""
    last_error = None
    
    for attempt in range(max_retries):
        try:
            return func()
        
        except requests.exceptions.HTTPError as e:
            last_error = e
            
            # Don't retry on 4xx errors (except 429)
            if 400 <= e.response.status_code < 500:
                if e.response.status_code != 429:
                    raise
            
            # Calculate backoff delay
            delay = min(initial_delay * (2 ** attempt), max_delay)
            print(f"Retry attempt {attempt + 1} after {delay}s")
            
            time.sleep(delay)
        
        except Exception as e:
            last_error = e
            raise
    
    raise last_error

# Usage
from accounts import WekezaAccounts

accounts = WekezaAccounts()
balance = retry_with_backoff(lambda: accounts.get_balance('acc_123'))
```

## Rate Limiting Handler

```python
# rate_limiter.py
import time
from collections import deque
from typing import Deque

class RateLimiter:
    def __init__(self, max_requests: int = 100, time_window: int = 60):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests: Deque[float] = deque()
    
    def throttle(self):
        """Throttle requests to stay within rate limit."""
        now = time.time()
        
        # Remove old requests outside time window
        while self.requests and now - self.requests[0] > self.time_window:
            self.requests.popleft()
        
        if len(self.requests) >= self.max_requests:
            oldest_request = self.requests[0]
            wait_time = self.time_window - (now - oldest_request)
            print(f"Rate limit reached. Waiting {wait_time:.2f}s")
            time.sleep(wait_time)
            return self.throttle()
        
        self.requests.append(now)

# Usage
limiter = RateLimiter(100, 60)  # 100 requests per minute

def make_api_call():
    limiter.throttle()
    # Make your API call
```

## Complete Integration Example

```python
# app.py
import time
from accounts import WekezaAccounts
from payments import WekezaPayments
from typing import Dict

class WekezaApp:
    def __init__(self):
        self.accounts = WekezaAccounts()
        self.payments = WekezaPayments()
    
    def transfer_money(
        self,
        from_account_id: str,
        to_account_number: str,
        amount: float,
        description: str
    ) -> Dict:
        """Transfer money between accounts."""
        try:
            # 1. Check balance
            balance = self.accounts.get_balance(from_account_id)
            
            if balance['balance']['available'] < amount:
                raise Exception('Insufficient funds')
            
            # 2. Initiate payment
            payment = self.payments.initiate_payment({
                'sourceAccountId': from_account_id,
                'destinationAccountNumber': to_account_number,
                'amount': amount,
                'currency': balance['balance']['currency'],
                'description': description,
                'reference': f"TRF-{int(time.time())}"
            })
            
            print(f"Payment initiated: {payment['id']}")
            
            # 3. Wait for completion
            status = self.wait_for_payment(payment['id'])
            
            return {
                'success': status == 'COMPLETED',
                'paymentId': payment['id'],
                'status': status
            }
        
        except Exception as e:
            print(f"Transfer failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def wait_for_payment(self, payment_id: str, max_wait_time: int = 30) -> str:
        """Wait for payment to complete."""
        start_time = time.time()
        
        while time.time() - start_time < max_wait_time:
            payment = self.payments.get_payment_status(payment_id)
            
            if payment['status'] in ['COMPLETED', 'FAILED']:
                return payment['status']
            
            time.sleep(2)
        
        return 'TIMEOUT'
    
    def get_account_summary(self, account_id: str) -> Dict:
        """Get comprehensive account summary."""
        try:
            from datetime import datetime, timedelta
            
            from_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            to_date = datetime.now().strftime('%Y-%m-%d')
            
            account = self.accounts.get_account(account_id)
            balance = self.accounts.get_balance(account_id)
            transactions = self.accounts.get_transactions(account_id, {
                'fromDate': from_date,
                'toDate': to_date,
                'perPage': 10
            })
            
            return {
                'account': account,
                'balance': balance,
                'recentTransactions': transactions['data']
            }
        
        except Exception as e:
            print(f"Error getting summary: {e}")
            raise

# Usage
if __name__ == '__main__':
    app = WekezaApp()
    
    # Get account summary
    summary = app.get_account_summary('acc_1234567890')
    print(f"Account: {summary['account']['accountNumber']}")
    print(f"Balance: {summary['balance']['balance']['available']}")
    
    # Transfer money
    result = app.transfer_money(
        'acc_1234567890',
        '1009876543',
        5000.00,
        'Payment for services'
    )
    
    if result['success']:
        print('Transfer successful!')
    else:
        print(f"Transfer failed: {result.get('error')}")
```

## Testing

### pytest Example

```python
# tests/test_accounts.py
import pytest
from unittest.mock import Mock, patch
from accounts import WekezaAccounts

@pytest.fixture
def accounts():
    return WekezaAccounts()

def test_get_account_balance(accounts):
    mock_balance = {
        'accountId': 'acc_123',
        'balance': {
            'available': 125000.00,
            'currency': 'KES'
        }
    }
    
    with patch('requests.get') as mock_get:
        mock_response = Mock()
        mock_response.json.return_value = mock_balance
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response
        
        balance = accounts.get_balance('acc_123')
        
        assert balance['balance']['available'] == 125000.00

def test_list_accounts(accounts):
    mock_accounts = {
        'data': [
            {'id': 'acc_1', 'accountNumber': '1001234567'},
            {'id': 'acc_2', 'accountNumber': '1009876543'}
        ]
    }
    
    with patch('requests.get') as mock_get:
        mock_response = Mock()
        mock_response.json.return_value = mock_accounts
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response
        
        accounts_list = accounts.list_accounts()
        
        assert len(accounts_list['data']) == 2
```

---

## Next Steps

- [JavaScript Examples](../javascript/) - Node.js integration
- **C# Examples** - Coming soon
- [API Reference](../../docs/api-reference/) - Complete API documentation
- [Authentication Guide](../../docs/authentication.md) - OAuth 2.0 setup

---

**Need Help?** Contact developers@wekeza.com or visit [Developer Community](https://wekeza-dev.slack.com).
