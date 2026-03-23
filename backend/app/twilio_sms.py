"""
Twilio SMS Integration Module
Handles sending SMS notifications for job completion/failure
"""

import os
from twilio.rest import Client
from typing import Optional, Dict, Any


def get_twilio_client() -> Optional[Client]:
    """
    Initialize and return Twilio client if credentials are available.
    Returns None if credentials are not configured.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    
    if not account_sid or not auth_token:
        print("⚠️ Twilio credentials not configured. SMS notifications disabled.")
        return None
    
    return Client(account_sid, auth_token)


def send_job_completion_sms(
    recipient_phone: str,
    job_id: str,
    result: Dict[str, Any],
    error: Optional[str] = None
) -> bool:
    """
    Send SMS notification when job completes.
    
    Args:
        recipient_phone: User's phone number (format: +1234567890)
        job_id: Analysis job ID
        result: Job result dictionary (if successful)
        error: Error message (if failed)
    
    Returns:
        bool: True if SMS sent successfully, False otherwise
    """
    client = get_twilio_client()
    if not client:
        return False
    
    from_phone = os.getenv("TWILIO_PHONE_NUMBER")
    if not from_phone:
        print("⚠️ TWILIO_PHONE_NUMBER not configured")
        return False
    
    try:
        if error:
            # Job failed - send error message
            message_body = f"""
🌍 Deforestation Analysis - FAILED

Job ID: {job_id[:8]}...

Error: {error}

Please try again or contact support.
            """.strip()
        else:
            # Job succeeded - send summary
            satellite_data = result.get("satellite_comparison", {})
            past_cover = satellite_data.get("past_cover_ha", 0)
            present_cover = satellite_data.get("present_cover_ha", 0)
            change = satellite_data.get("change_ha", 0)
            
            change_status = "📈 GAIN" if change > 0 else "📉 LOSS" if change < 0 else "➡️ STABLE"
            
            message_body = f"""
🌍 Deforestation Analysis - COMPLETE

Job ID: {job_id[:8]}...

📊 Satellite Data:
Past: {past_cover} ha
Present: {present_cover} ha
Change: {change} ha {change_status}

Drone data: {'✅ Included' if result.get('drone_data') else '⏭️ Skipped'}

Check results online for detailed map & metrics.
            """.strip()
        
        message = client.messages.create(
            body=message_body,
            from_=from_phone,
            to=recipient_phone
        )
        
        print(f"✅ SMS sent to {recipient_phone} (SID: {message.sid})")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send SMS: {str(e)}")
        return False


def send_job_started_sms(
    recipient_phone: str,
    job_id: str
) -> bool:
    """
    Optional: Send SMS when job starts processing.
    """
    client = get_twilio_client()
    if not client:
        return False
    
    from_phone = os.getenv("TWILIO_PHONE_NUMBER")
    if not from_phone:
        return False
    
    try:
        message_body = f"""
🌍 Deforestation Analysis - STARTED

Job ID: {job_id[:8]}...

Processing satellite and drone imagery...
We'll notify you when complete.
        """.strip()
        
        client.messages.create(
            body=message_body,
            from_=from_phone,
            to=recipient_phone
        )
        return True
    except Exception as e:
        print(f"⚠️ Failed to send job started SMS: {str(e)}")
        return False
