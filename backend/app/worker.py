import ee
import traceback
from typing import Dict

from app.ndvi_satellite import (
    compute_satellite_ndvi,
    compute_ndvi_difference_tile,
)
from app.ndvi_drone import process_drone_data_for_comparison
from app.twilio_sms import send_job_completion_sms, send_whatsapp_message


def calculate_deforestation_rate(past, present, years):
    if past <= 0 or years <= 0:
        return 0.0
    return round(((present - past) / past) / years * 100, 3)


def run_ndvi_job(job_id: str, payload: dict, job_store: Dict):
    try:
        geometry = payload["geometry"]["coordinates"]
        past_year = payload["past_year"]
        present_year = payload["present_year"]

        # =====================================================
        # SATELLITE NDVI AREA (NUMERIC — ALWAYS RUNS)
        # =====================================================
        past_area = compute_satellite_ndvi(
            geometry,
            f"{past_year}-01-01",
            f"{past_year}-12-31",
        ) or 0.0

        present_area = compute_satellite_ndvi(
            geometry,
            f"{present_year}-01-01",
            f"{present_year}-12-31",
        ) or 0.0

        past_ha = past_area / 10000
        present_ha = present_area / 10000

        result = {
            "satellite_comparison": {
                "past_year": past_year,
                "present_year": present_year,
                "past_cover_ha": round(past_ha, 2),
                "present_cover_ha": round(present_ha, 2),
                "change_ha": round(present_ha - past_ha, 2),
            }
        }

        # =====================================================
        # NDVI DIFFERENCE TILE (VISUAL — SATELLITE)
        # =====================================================
        try:
            ndvi_tile_url = compute_ndvi_difference_tile(
                aoi_coords=geometry,
                past_start_date=f"{past_year}-01-01",
                past_end_date=f"{past_year}-12-31",
                present_start_date=f"{present_year}-01-01",
                present_end_date=f"{present_year}-12-31",
            )

            result["ndvi_difference"] = {
                "tile_url": ndvi_tile_url
            }

        except Exception as tile_error:
            # Tile failure should NOT fail the job
            result["ndvi_difference"] = {
                "error": str(tile_error)
            }

        # =====================================================
        # DRONE DATA (OPTIONAL & SAFE)
        # =====================================================
        if "drone_image_path" in payload:
            try:
                result["drone_data"] = process_drone_data_for_comparison(
                    payload["drone_image_path"],
                    {"type": "Polygon", "coordinates": geometry},
                )
            except Exception as drone_error:
                error_msg = str(drone_error)
                print(f"❌ Drone processing error: {error_msg}")
                result["drone_data"] = {
                    "error": error_msg,
                    "vegetation_area_ha": None,
                    "total_area_ha": None,
                    "vegetation_percentage": None,
                    "mean_ndvi": None,
                }

        # =====================================================
        # JOB SUCCESS
        # =====================================================
        job_store[job_id]["status"] = "completed"

        # Evaluate drone TIFF usefulness
        drone_data = result.get("drone_data")
        useful = False
        if drone_data and not drone_data.get("error"):
            ndvi_pct = drone_data.get("vegetation_percentage")
            mean_ndvi = drone_data.get("mean_ndvi")
            if ndvi_pct is not None and mean_ndvi is not None:
                useful = ndvi_pct > 10 and mean_ndvi > 0.05

        # Ensure we store pure Python bool, not numpy.bool
        result["drone_tif_useful"] = bool(useful)
        if result["drone_tif_useful"]:
            print(f"✅ Drone TIFF for job {job_id} appears useful: vegetation {drone_data.get('vegetation_percentage')}%, mean NDVI {drone_data.get('mean_ndvi')}")
        else:
            print(f"⚠️ Drone TIFF for job {job_id} appears low-usefulness or missing. Data: {drone_data}")

        # Compare drone results against present satellite estimate (current-year reference)
        if drone_data and not drone_data.get("error"):
            present_veg_ha = present_ha
            drone_veg_ha = drone_data.get("vegetation_area_ha") or 0.0
            result["drone_vs_present_satellite"] = {
                "present_satellite_vegetation_ha": round(float(present_veg_ha), 2),
                "drone_vegetation_ha": round(float(drone_veg_ha), 2),
                "percent_of_satellite": round(
                    (drone_veg_ha / present_veg_ha * 100) if present_veg_ha > 0 else 0,
                    2
                )
            }

        job_store[job_id]["result"] = result

        # Send WhatsApp notification if deforestation detected
        change_ha = result["satellite_comparison"]["change_ha"]
        if change_ha > 0:
            personal_number = "+919555268266"
            coords_str = "\n".join([f"({lat:.4f}, {lng:.4f})" for lng, lat in geometry[0]])
            whatsapp_body = f"""🚨 DEFORESTATION DETECTED 🚨

Job ID: {job_id[:8]}...

📊 Report:
- Past year ({past_year}): {result["satellite_comparison"]["past_cover_ha"]} ha
- Present year ({present_year}): {result["satellite_comparison"]["present_cover_ha"]} ha
- Deforestation: {change_ha} ha lost

📍 AOI Coordinates:
{coords_str}

🚁 Drone TIFF usefulness: {'useful' if useful else 'low / not useful'}

Please review the results in the dashboard."""
            whatsapp_sent = send_whatsapp_message(personal_number, whatsapp_body)
            print(f"WhatsApp send status: {'sent' if whatsapp_sent else 'failed'}")

    except Exception as e:
        job_store[job_id]["status"] = "failed"
        job_store[job_id]["error"] = str(e)
        job_store[job_id]["traceback"] = traceback.format_exc()
