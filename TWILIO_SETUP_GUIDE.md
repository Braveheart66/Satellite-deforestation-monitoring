# Twilio SMS Integration - Step-by-Step Setup Guide

## Overview
This guide integrates Twilio SMS notifications to alert users when deforestation analysis jobs complete.

---

## STEP 1: Create Twilio Account & Get Credentials

1. **Sign up for Twilio**:
   - Go to https://www.twilio.com/console
   - Click "Sign Up"
   - Complete registration with email, password, and phone verification

2. **Verify your account**:
   - Enter the verification code sent to your phone
   - Answer questions about your use case (select "Other")

3. **Get your credentials** from Twilio Console:
   - Navigate to Dashboard → Account
   - Find: **Account SID** (starts with `AC...`)
   - Find: **Auth Token** (long alphanumeric string)
   - Note these down - you'll need them in Step 3

4. **Get a Twilio phone number**:
   - In Console, go to Phone Numbers → Manage Numbers → Buy a Number
   - Select a country/region, choose a number
   - Click "Buy" (trial accounts get free credits)
   - Note your Twilio phone number (format: +1234567890)

---

## STEP 2: Install Twilio Python Package

In the `backend/` directory, run:

```bash
pip install twilio
```

Or add to `requirements.txt`:
```
twilio==8.10.0
```

Then install:
```bash
pip install -r requirements.txt
```

---

## STEP 3: Add Environment Variables

Create or update `.env` file in the `backend/` folder:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# (Keep existing variables if any)
```

**Important**: 
- Replace values with your actual Twilio credentials
- Keep `.env` file in `.gitignore` (never commit secrets!)
- Add `.env` to `.gitignore` if not already there

---

## STEP 4: Create Twilio Integration Module

Backend already has file created: `backend/app/twilio_sms.py`

This module provides:
- `send_job_completion_sms()` - Sends SMS when job completes
- `get_twilio_client()` - Initializes Twilio client

---

## STEP 5: Update Backend Workflow

The `backend/app/worker.py` has been updated to send SMS notifications on job completion.

Webhook notifications are sent when:
- ✅ Job completes successfully (shows result summary)
- ❌ Job fails (shows error message)

---

## STEP 6: Add User Phone Number to API

### Frontend - Collect Phone Number

When running analysis, users should provide their phone number. Frontend already has UI for this in `page.tsx`.

### Backend - Store & Use Phone Number

Update analysis request:
```json
{
  "geometry": {...},
  "past_year": 2020,
  "present_year": 2024,
  "phone_number": "+1234567890"
}
```

---

## STEP 7: Testing

### Test SMS in Twilio Console

1. Go to Twilio Console → Messaging → Send SMS
2. Click "Send a test SMS"
3. Enter your phone number in "To"
4. Add test message in "Body"
5. Click "Send"

### Test via Backend

Run a test job and provide your phone number - you should receive an SMS when it completes!

---

## STEP 8: Production Deployment

When deploying (e.g., to Render, Heroku):

1. **Set environment variables** in your hosting platform:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_PHONE_NUMBER

2. **Update requirements.txt** with twilio package

3. **Test after deployment** to ensure SMS is sent

---

## Troubleshooting

### Issue: Module not found error for twilio
**Solution**: Run `pip install twilio` in backend

### Issue: "Invalid credentials" error
**Solution**: 
- Double-check Account SID and Auth Token copy/pasted correctly
- Check `.env` file syntax (no quotes around values)
- Verify environment variables are loaded by backend

### Issue: SMS not received
**Solution**:
- Confirm phone number format: +1234567890
- Check Twilio trial account status (may have limitations)
- Verify Twilio phone number is active in console
- Check spam/junk folder

### Issue: Rate limiting
**Solution**: Twilio allows ~100 SMS per hour on trial. Space out job submissions.

---

## Testing Checklist

- [ ] Twilio account created with credentials
- [ ] Python twilio package installed
- [ ] `.env` file created with credentials
- [ ] `backend/app/twilio_sms.py` exists
- [ ] `backend/app/worker.py` updated with SMS notification
- [ ] Phone number passed in analysis request
- [ ] Test SMS received from Twilio Console
- [ ] Test analysis job triggers SMS notification

---

## Code Integration Summary

### Files Modified:

1. **backend/app/twilio_sms.py** (NEW)
   - Twilio client initialization
   - SMS sending function

2. **backend/app/worker.py** (UPDATED)
   - Added SMS notification on job completion
   - Sends result or error summary via SMS

3. **backend/app/schemas.py** (UPDATED)
   - Added `phone_number` field to NDVIRequest

4. **backend/requirements.txt** (UPDATED)
   - Added twilio package

5. **frontend/app/page.tsx** (UPDATED)
   - Added phone number input field

---

## Next Steps

After setup:
1. Test SMS notifications with sample jobs
2. Monitor Twilio usage in Console
3. Configure SMS response rules (if desired)
4. Add error handling for SMS failures
5. Consider adding SMS templates for different scenarios
