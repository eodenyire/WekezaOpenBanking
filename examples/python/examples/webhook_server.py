"""
Wekeza API Webhook Server Example
Shows how to receive and handle webhooks using Flask
"""

import os
from flask import Flask, request, jsonify
from wekeza_sdk import WekezaClient

app = Flask(__name__)
PORT = int(os.getenv('WEBHOOK_PORT', 5000))

# Create Wekeza client
client = WekezaClient.from_env()


@app.route('/webhooks/wekeza', methods=['POST'])
def handle_webhook():
    """Handle incoming webhook from Wekeza"""
    try:
        signature = request.headers.get('X-Wekeza-Signature')
        raw_body = request.get_data(as_text=True)
        
        print('\n=== Webhook Received ===')
        print(f'Signature: {signature}')
        
        # Verify and parse webhook
        event = client.webhooks.parse_event(raw_body, signature)
        print(f'Event Type: {event["type"]}')
        print(f'Event Data: {event["data"]}')
        
        # Define event handlers
        def handle_transaction_posted(data):
            print(f"New transaction posted: {data['id']}")
            print(f"Amount: {data['currency']} {data['amount']}")
            # Add your logic here
        
        def handle_payment_completed(data):
            print(f"Payment completed: {data['id']}")
            print(f"Status: {data['status']}")
            # Add your logic here
        
        def handle_payment_failed(data):
            print(f"Payment failed: {data['id']}")
            print(f"Reason: {data.get('failureReason', 'Unknown')}")
            # Add your logic here
        
        def handle_balance_low(data):
            print(f"Low balance alert for account: {data['accountId']}")
            print(f"Balance: {data['currentBalance']}")
            # Add your logic here
        
        handlers = {
            'transaction.posted': handle_transaction_posted,
            'payment.completed': handle_payment_completed,
            'payment.failed': handle_payment_failed,
            'account.balance_low': handle_balance_low
        }
        
        # Process the event
        client.webhooks.handle_event(event, handlers)
        
        # Return success response
        print('Webhook processed successfully')
        return jsonify({'received': True}), 200
        
    except Exception as e:
        print(f'Webhook error: {str(e)}')
        return jsonify({'error': str(e)}), 400


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'wekeza-webhook-server'
    })


if __name__ == '__main__':
    print(f'Wekeza Webhook Server running on port {PORT}')
    print(f'Webhook endpoint: http://localhost:{PORT}/webhooks/wekeza')
    print('\nTo test with a local tunnel (e.g., ngrok):')
    print(f'  ngrok http {PORT}')
    print('  Then configure the ngrok URL in your Wekeza developer dashboard\n')
    
    app.run(host='0.0.0.0', port=PORT, debug=True)
