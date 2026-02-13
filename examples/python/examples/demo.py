"""
Wekeza API Demo
Shows basic usage of the Python SDK
"""

import json
from wekeza_sdk import WekezaClient


def main():
    # Create client from environment variables
    client = WekezaClient.from_env()
    
    print("=== Wekeza API Demo ===\n")
    
    try:
        # 1. List Accounts
        print("1. Fetching accounts...")
        accounts = client.accounts.list_accounts()
        print(f"Found {len(accounts['data'])} accounts")
        print(json.dumps(accounts, indent=2))
        print()
        
        # 2. Get Account Balance
        if accounts['data']:
            first_account = accounts['data'][0]
            print(f"2. Getting balance for account {first_account['id']}...")
            balance = client.accounts.get_balance(first_account['id'])
            print(f"Balance: {balance['currency']} {balance['available']}")
            print()
            
            # 3. Get Transactions
            print(f"3. Getting transactions for account {first_account['id']}...")
            transactions = client.accounts.get_transactions(
                first_account['id'],
                params={'limit': 5}
            )
            print(f"Found {len(transactions['data'])} recent transactions")
            print(json.dumps(transactions, indent=2))
            print()
        
        # 4. Initiate Payment
        print("4. Initiating a payment...")
        payment = client.payments.initiate_payment({
            'sourceAccountId': 'acc_test_12345',
            'destinationAccountNumber': '1009876543',
            'amount': 1000.00,
            'currency': 'KES',
            'reference': 'TEST-PAYMENT-001',
            'description': 'Test payment from SDK'
        })
        print("Payment initiated successfully:")
        print(json.dumps(payment, indent=2))
        print()
        
        # 5. Check Payment Status
        print("5. Checking payment status...")
        payment_status = client.payments.get_payment_status(payment['id'])
        print(f"Payment Status: {payment_status['status']}")
        print()
        
        print("=== Demo Complete ===")
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
