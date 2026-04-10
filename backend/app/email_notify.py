"""
Email Notification Module
Handles sending email notifications for job completion/failure
using SMTP (Gmail App Password or any SMTP provider).
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load backend .env if available (for local development)
env_path = Path(__file__).resolve().parents[1] / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=False)


# Default recipient
DEFAULT_RECIPIENT = "shivamsinghraghuvanshi1234@gmail.com"

# SMTP configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SENDER_NAME = os.getenv("SENDER_NAME", "Deforestation Monitor")


def _build_success_html(job_id: str, result: Dict[str, Any]) -> str:
    """Build rich HTML email for successful job."""
    satellite = result.get("satellite_comparison", {})
    past_cover = satellite.get("past_cover_ha", 0)
    present_cover = satellite.get("present_cover_ha", 0)
    change = satellite.get("change_ha", 0)
    past_year = satellite.get("past_year", "N/A")
    present_year = satellite.get("present_year", "N/A")

    change_color = "#27ae60" if change > 0 else "#e74c3c" if change < 0 else "#95a5a6"
    change_icon = "📈" if change > 0 else "📉" if change < 0 else "➡️"
    change_label = "VEGETATION GAIN" if change > 0 else "VEGETATION LOSS" if change < 0 else "STABLE"

    drone_section = ""
    drone_data = result.get("drone_data")
    if drone_data and not drone_data.get("error"):
        drone_section = f"""
        <tr>
          <td style="padding:16px 24px; border-top:1px solid #2a2a3e;">
            <h3 style="color:#00d4aa; margin:0 0 12px 0; font-size:16px;">🚁 Drone Analysis</h3>
            <table style="width:100%;">
              <tr>
                <td style="color:#a0a0b8; padding:4px 0;">Vegetation Area</td>
                <td style="color:#fff; text-align:right; font-weight:600;">{drone_data.get('vegetation_area_ha', 0):.2f} ha</td>
              </tr>
              <tr>
                <td style="color:#a0a0b8; padding:4px 0;">Mean NDVI</td>
                <td style="color:#fff; text-align:right; font-weight:600;">{drone_data.get('mean_ndvi', 0):.4f}</td>
              </tr>
              <tr>
                <td style="color:#a0a0b8; padding:4px 0;">Vegetation Coverage</td>
                <td style="color:#fff; text-align:right; font-weight:600;">{drone_data.get('vegetation_percentage', 0):.2f}%</td>
              </tr>
            </table>
          </td>
        </tr>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0; padding:0; background:#0a0a1a; font-family:'Segoe UI',Roboto,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a1a; padding:32px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#12122a; border-radius:16px; overflow:hidden; border:1px solid #1e1e3a;">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg, #00d4aa 0%, #00a8e8 100%); padding:32px 24px; text-align:center;">
                  <h1 style="color:#fff; margin:0; font-size:24px; text-shadow:0 2px 4px rgba(0,0,0,0.3);">
                    🌍 Deforestation Analysis Complete
                  </h1>
                  <p style="color:rgba(255,255,255,0.85); margin:8px 0 0; font-size:14px;">
                    Job ID: {job_id[:8]}...
                  </p>
                </td>
              </tr>

              <!-- Status Badge -->
              <tr>
                <td style="padding:24px 24px 0;">
                  <div style="background:{change_color}22; border:1px solid {change_color}44; border-radius:12px; padding:16px; text-align:center;">
                    <span style="font-size:28px;">{change_icon}</span>
                    <p style="color:{change_color}; font-weight:700; margin:8px 0 0; font-size:18px;">{change_label}</p>
                    <p style="color:{change_color}; margin:4px 0 0; font-size:14px;">{abs(change):.2f} hectares</p>
                  </div>
                </td>
              </tr>

              <!-- Satellite Data -->
              <tr>
                <td style="padding:24px;">
                  <h3 style="color:#00d4aa; margin:0 0 16px 0; font-size:16px;">🛰️ Satellite Comparison</h3>
                  <table style="width:100%; border-collapse:collapse;">
                    <tr>
                      <td style="background:#1a1a35; padding:12px 16px; border-radius:8px 8px 0 0; color:#a0a0b8; font-size:13px;">Past Vegetation ({past_year})</td>
                      <td style="background:#1a1a35; padding:12px 16px; border-radius:8px 8px 0 0; color:#fff; text-align:right; font-weight:700; font-size:16px;">{past_cover} ha</td>
                    </tr>
                    <tr>
                      <td style="background:#1e1e3a; padding:12px 16px; color:#a0a0b8; font-size:13px;">Present Vegetation ({present_year})</td>
                      <td style="background:#1e1e3a; padding:12px 16px; color:#fff; text-align:right; font-weight:700; font-size:16px;">{present_cover} ha</td>
                    </tr>
                    <tr>
                      <td style="background:#1a1a35; padding:12px 16px; border-radius:0 0 8px 8px; color:#a0a0b8; font-size:13px;">Net Change</td>
                      <td style="background:#1a1a35; padding:12px 16px; border-radius:0 0 8px 8px; color:{change_color}; text-align:right; font-weight:700; font-size:16px;">{'+' if change > 0 else ''}{change} ha</td>
                    </tr>
                  </table>
                </td>
              </tr>

              {drone_section}

              <!-- Footer -->
              <tr>
                <td style="padding:24px; border-top:1px solid #1e1e3a; text-align:center;">
                  <p style="color:#555580; font-size:12px; margin:0;">
                    🌿 Satellite Deforestation Monitoring System<br>
                    Powered by Google Earth Engine & Drone Imagery
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """


def _build_failure_html(job_id: str, error: str) -> str:
    """Build rich HTML email for failed job."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0; padding:0; background:#0a0a1a; font-family:'Segoe UI',Roboto,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a1a; padding:32px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#12122a; border-radius:16px; overflow:hidden; border:1px solid #1e1e3a;">
              <tr>
                <td style="background:linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding:32px 24px; text-align:center;">
                  <h1 style="color:#fff; margin:0; font-size:24px;">❌ Analysis Failed</h1>
                  <p style="color:rgba(255,255,255,0.85); margin:8px 0 0; font-size:14px;">Job ID: {job_id[:8]}...</p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <div style="background:#e74c3c22; border:1px solid #e74c3c44; border-radius:12px; padding:16px;">
                    <p style="color:#e74c3c; margin:0; font-weight:600;">Error Details:</p>
                    <p style="color:#a0a0b8; margin:8px 0 0; font-size:14px;">{error}</p>
                  </div>
                  <p style="color:#a0a0b8; margin:16px 0 0; font-size:14px;">Please try again or contact support.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px; border-top:1px solid #1e1e3a; text-align:center;">
                  <p style="color:#555580; font-size:12px; margin:0;">
                    🌿 Satellite Deforestation Monitoring System
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """


def send_job_completion_email(
    recipient_email: str,
    job_id: str,
    result: Dict[str, Any],
    error: Optional[str] = None,
) -> bool:
    """
    Send email notification when job completes.

    Args:
        recipient_email: Recipient email address
        job_id: Analysis job ID
        result: Job result dictionary (if successful)
        error: Error message (if failed)

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print("⚠️ SMTP credentials not configured. Email notifications disabled.")
        print("   Set SMTP_USER and SMTP_PASSWORD in .env to enable.")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"{SENDER_NAME} <{SMTP_USER}>"
        msg["To"] = recipient_email

        if error:
            msg["Subject"] = f"❌ Deforestation Analysis Failed — Job {job_id[:8]}"
            html_content = _build_failure_html(job_id, error)
            plain_text = f"Deforestation Analysis FAILED\n\nJob ID: {job_id[:8]}...\nError: {error}\n\nPlease try again."
        else:
            satellite = result.get("satellite_comparison", {})
            change = satellite.get("change_ha", 0)
            status = "Loss Detected" if change < 0 else "Gain Detected" if change > 0 else "Stable"
            msg["Subject"] = f"🌍 Deforestation Analysis Complete — {status}"
            html_content = _build_success_html(job_id, result)
            plain_text = (
                f"Deforestation Analysis COMPLETE\n\n"
                f"Job ID: {job_id[:8]}...\n"
                f"Past: {satellite.get('past_cover_ha', 0)} ha\n"
                f"Present: {satellite.get('present_cover_ha', 0)} ha\n"
                f"Change: {change} ha\n"
            )

        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, recipient_email, msg.as_string())

        print(f"✅ Email sent to {recipient_email}")
        return True

    except Exception as e:
        print(f"❌ Failed to send email: {str(e)}")
        return False


def send_deforestation_alert_email(
    job_id: str,
    result: Dict[str, Any],
    geometry: list,
    past_year: int,
    present_year: int,
) -> bool:
    """
    Send deforestation alert email to the default recipient.
    Called when vegetation loss is detected.
    """
    satellite = result.get("satellite_comparison", {})
    change_ha = satellite.get("change_ha", 0)
    drone_data = result.get("drone_data")
    useful = result.get("drone_tif_useful", False)

    coords_str = "\n".join([f"  ({lat:.4f}, {lng:.4f})" for lng, lat in geometry[0]])

    plain_text = (
        f"🚨 DEFORESTATION DETECTED 🚨\n\n"
        f"Job ID: {job_id[:8]}...\n\n"
        f"📊 Report:\n"
        f"- Past year ({past_year}): {satellite.get('past_cover_ha', 0)} ha\n"
        f"- Present year ({present_year}): {satellite.get('present_cover_ha', 0)} ha\n"
        f"- Deforestation: {abs(change_ha)} ha lost\n\n"
        f"📍 AOI Coordinates:\n{coords_str}\n\n"
        f"🚁 Drone TIFF usefulness: {'useful' if useful else 'low / not useful'}\n\n"
        f"Please review the results in the dashboard."
    )

    if not SMTP_USER or not SMTP_PASSWORD:
        print("⚠️ SMTP credentials not configured. Alert email skipped.")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"{SENDER_NAME} <{SMTP_USER}>"
        msg["To"] = DEFAULT_RECIPIENT
        msg["Subject"] = f"🚨 DEFORESTATION ALERT — {abs(change_ha):.2f} ha Lost"
        msg.attach(MIMEText(plain_text, "plain"))

        # Also attach the rich HTML version
        html_content = _build_success_html(job_id, result)
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, DEFAULT_RECIPIENT, msg.as_string())

        print(f"✅ Deforestation alert email sent to {DEFAULT_RECIPIENT}")
        return True

    except Exception as e:
        print(f"❌ Failed to send alert email: {str(e)}")
        return False
