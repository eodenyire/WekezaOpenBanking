"""
Wekeza API Webhooks Module
Handles webhook signature verification and event processing
"""

import hmac
import hashlib
import json
from typing import Dict, Any, Callable


class WebhookVerificationError(Exception):
    """Raised when webhook signature verification fails"""
    pass


class InvalidWebhookPayloadError(Exception):
    """Raised when webhook payload is invalid"""
    pass


class WekezaWebhooks:
    """Handles webhook signature verification and event processing"""
    
    def __init__(self, webhook_secret: str):
        self.webhook_secret = webhook_secret
    
    def verify_signature(self, payload: str, signature: str) -> bool:
        """
        Verify webhook signature
        
        Args:
            payload: Raw request body
            signature: X-Wekeza-Signature header value
            
        Returns:
            bool: True if signature is valid
        """
        if not signature:
            return False
        
        expected_signature = hmac.new(
            self.webhook_secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Use timing-safe comparison to prevent timing attacks
        return hmac.compare_digest(signature, expected_signature)
    
    def parse_event(self, payload: str, signature: str) -> Dict[str, Any]:
        """
        Parse webhook event
        
        Args:
            payload: Raw request body
            signature: X-Wekeza-Signature header value
            
        Returns:
            Dict containing parsed event data
            
        Raises:
            WebhookVerificationError: If signature is invalid
            InvalidWebhookPayloadError: If payload is not valid JSON
        """
        if not self.verify_signature(payload, signature):
            raise WebhookVerificationError("Invalid webhook signature")
        
        try:
            return json.loads(payload)
        except json.JSONDecodeError as e:
            raise InvalidWebhookPayloadError(f"Invalid webhook payload: not valid JSON - {str(e)}")
    
    def handle_event(self, event: Dict[str, Any], handlers: Dict[str, Callable]) -> Any:
        """
        Handle webhook event based on type
        
        Args:
            event: Parsed event data
            handlers: Event handlers by type
            
        Returns:
            Handler result
            
        Raises:
            InvalidWebhookPayloadError: If event type is missing
        """
        event_type = event.get('type') or event.get('event_type')
        
        if not event_type:
            raise InvalidWebhookPayloadError("Event type not specified in webhook payload")
        
        handler = handlers.get(event_type)
        
        if not handler:
            print(f"Warning: No handler registered for event type: {event_type}")
            return None
        
        try:
            event_data = event.get('data') or event.get('payload')
            return handler(event_data)
        except Exception as e:
            print(f"Error handling {event_type} event: {str(e)}")
            raise
