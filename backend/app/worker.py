import ee
from app.jobs import jobs
from app.ndvi_satellite import compute_ndvi
from app.utils import sqm_to_hectares
import traceback

def run_ndvi_job(job_id, payload):
    try:
        jobs[job_id]["status"] = "processing"

        # -----------------------------
        # Extract geometry
        # -----------------------------
        geometry = payload["geometry"]
        coords = geometry["coordinates"]

        past_year = payload["past_year"]
        present_year = payload["present_year"]

        past_start = f"{past_year}-01-01"
        past_end = f"{past_year}-12-31"
        present_start = f"{present_year}-01-01"
        present_end = f"{present_year}-12-31"

        threshold = 0.4

        # -----------------------------
        # NDVI computation (EE objects)
        # -----------------------------
        past_area = compute_ndvi(coords, past_start, past_end, threshold)
        present_area = compute_ndvi(coords, present_start, present_end, threshold)

        # ⚠️ Force small scalar fetch only
        past_sqm = ee.Number(past_area).getInfo()
        present_sqm = ee.Number(present_area).getInfo()

        past_ha = sqm_to_hectares(past_sqm)
        present_ha = sqm_to_hectares(present_sqm)

        rate = (
            ((present_ha - past_ha) / past_ha)
            / (present_year - past_year) * 100
            if past_ha > 0 else 0
        )

        jobs[job_id] = {
            "status": "completed",
            "past_cover_ha": round(past_ha, 2),
            "present_cover_ha": round(present_ha, 2),
            "deforestation_rate_pct_per_year": round(rate, 2),
            "years": {
                "past": past_year,
                "present": present_year
            }
        }

    except Exception as e:
        jobs[job_id] = {
            "status": "failed",
            "error": str(e),
            "trace": traceback.format_exc()
        }
