import ee
import traceback
from typing import Dict
from app.ndvi_satellite import compute_satellite_ndvi
from app.ndvi_drone import process_drone_data_for_comparison


def calculate_deforestation_rate(past, present, years):
    if past <= 0 or years <= 0:
        return 0.0
    return round(((present - past) / past) / years * 100, 3)


def run_ndvi_job(job_id: str, payload: dict, job_store: Dict):
    try:
        geometry = payload["geometry"]["coordinates"]
        past_year = payload["past_year"]
        present_year = payload["present_year"]

        # --------------------------------------------------
        # SATELLITE NDVI (AREA + TILE MAPS)
        # --------------------------------------------------
        result = {}

        past_area, past_tile, past_hist = compute_satellite_ndvi(
            geometry,
            f"{past_year}-01-01",
            f"{past_year}-12-31",
            return_map=True
        )

        present_area, present_tile, present_hist = compute_satellite_ndvi(
            geometry,
            f"{present_year}-01-01",
            f"{present_year}-12-31",
            return_map=True
        )

        past_ha = ee.Number(past_area).getInfo() / 10000
        present_ha = ee.Number(present_area).getInfo() / 10000

        # ΔNDVI
        diff_ndvi = ee.Image(present_tile).subtract(ee.Image(past_tile))
        diff_vis = {
            "min": -0.4,
            "max": 0.4,
            "palette": ["red", "white", "green"]
        }
        diff_tile = diff_ndvi.getMapId(diff_vis)["tile_fetcher"].url_format

        result["ndvi_tiles"] = {
            "past": past_tile,
            "present": present_tile,
            "diff": diff_tile
        }

        result["ndvi_histogram"] = present_hist

        result["satellite_comparison"] = {
            "past_year": past_year,
            "present_year": present_year,
            "past_cover_ha": round(past_ha, 2),
            "present_cover_ha": round(present_ha, 2),
            "change_ha": round(present_ha - past_ha, 2)
        }

        # --------------------------------------------------
        # RESULT OBJECT (INITIALIZE ONCE)
        # --------------------------------------------------
        result = {}

        # --------------------------------------------------
        # SATELLITE COMPARISON
        # --------------------------------------------------
        if past_ha == 0 and present_ha == 0:
            result["satellite_comparison"] = None
        else:
            result["satellite_comparison"] = {
                "past_year": past_year,
                "past_cover_ha": round(past_ha, 2),
                "present_year": present_year,
                "present_cover_ha": round(present_ha, 2),
                "change_ha": round(present_ha - past_ha, 2),
                "deforestation_rate_pct_per_year": satellite_rate
            }

        # --------------------------------------------------
        # NDVI TILE MAPS (FOR FRONTEND VISUALIZATION)
        # --------------------------------------------------
        result["ndvi_tiles"] = {
            "past": past_tile,
            "present": present_tile,
            # diff will be added once you compute ΔNDVI in ndvi_satellite.py
        }

        # --------------------------------------------------
        # DRONE DATA (OPTIONAL)
        # --------------------------------------------------
        if "drone_image_path" in payload:
            aoi = {
                "type": "Polygon",
                "coordinates": geometry
            }
            result["drone_data"] = process_drone_data_for_comparison(
                payload["drone_image_path"],
                aoi
            )

        # --------------------------------------------------
        # JOB FINALIZE
        # --------------------------------------------------
        job_store[job_id]["status"] = "completed"
        job_store[job_id]["result"] = result

    except Exception as e:
        job_store[job_id]["status"] = "failed"
        job_store[job_id]["error"] = str(e)
        job_store[job_id]["trace"] = traceback.format_exc()
