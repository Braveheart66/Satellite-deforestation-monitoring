import ee
import traceback
from typing import Dict
from pathlib import Path
import json
import math
import rasterio
from rasterio.warp import transform_bounds

from app.ndvi_satellite import (
    compute_satellite_ndvi,
    compute_ndvi_difference_tile,
)
from app.ndvi_drone import process_drone_data_for_comparison
from app.email_notify import send_job_completion_email


def calculate_deforestation_rate(past, present, years):
    if past <= 0 or years <= 0:
        return 0.0
    return round(((present - past) / past) / years * 100, 3)


def _build_location_summary(geometry: list) -> dict:
    """Build a compact AOI summary for logging, API response, and emails."""
    ring = geometry[0] if geometry else []
    if not ring:
        return {}

    lons = [pt[0] for pt in ring]
    lats = [pt[1] for pt in ring]
    west, east = min(lons), max(lons)
    south, north = min(lats), max(lats)

    # If polygon is explicitly closed, don't count the repeated last point as a vertex.
    closed = len(ring) > 1 and ring[0] == ring[-1]
    vertex_count = len(ring) - 1 if closed else len(ring)

    return {
        "centroid": {
            "lng": round((west + east) / 2, 6),
            "lat": round((south + north) / 2, 6),
        },
        "bbox": {
            "west": round(west, 6),
            "south": round(south, 6),
            "east": round(east, 6),
            "north": round(north, 6),
        },
        "aoi_vertices": int(vertex_count),
    }


def _load_demo_aoi_for_tif(tif_name: str) -> dict | None:
    """Return a known demo AOI polygon for a TIFF filename, if available."""
    root = Path(__file__).resolve().parents[1]
    candidate_files = [
        root / "demo_drone_images" / "demo_aoi_pairs.json",
        root / "demo_drone_images_lucknow" / "lucknow_demo_aoi_pairs.json",
    ]

    for pairs_file in candidate_files:
        if not pairs_file.exists():
            continue
        try:
            pairs = json.loads(pairs_file.read_text(encoding="utf-8"))
        except Exception:
            continue

        # Legacy format: { "file.tif": {"type": "Polygon", ...} }
        if isinstance(pairs, dict) and tif_name in pairs:
            return pairs[tif_name]

        # New format: { "aois": [{"title": "...", "tif": "file.tif", "type": "Polygon", ...}] }
        if isinstance(pairs, dict) and isinstance(pairs.get("aois"), list):
            for item in pairs["aois"]:
                if not isinstance(item, dict):
                    continue
                if item.get("tif") == tif_name and item.get("type") == "Polygon":
                    return {
                        "type": item.get("type"),
                        "coordinates": item.get("coordinates", []),
                    }

    return None


def _build_inner_aoi_from_raster_bounds(tif_path: str, margin_ratio: float = 0.10) -> dict | None:
    """Build a guaranteed-overlap AOI from raster bounds in EPSG:4326."""
    try:
        with rasterio.open(tif_path) as src:
            bounds = src.bounds
            src_crs = src.crs

            if src_crs:
                west, south, east, north = transform_bounds(
                    src_crs,
                    "EPSG:4326",
                    bounds.left,
                    bounds.bottom,
                    bounds.right,
                    bounds.top,
                    densify_pts=21,
                )
            else:
                west, south, east, north = bounds.left, bounds.bottom, bounds.right, bounds.top

            width = east - west
            height = north - south
            if width <= 0 or height <= 0:
                return None

            mx = width * margin_ratio
            my = height * margin_ratio

            return {
                "type": "Polygon",
                "coordinates": [[
                    [west + mx, south + my],
                    [east - mx, south + my],
                    [east - mx, north - my],
                    [west + mx, north - my],
                    [west + mx, south + my],
                ]],
            }
    except Exception:
        return None


def _json_safe_value(value):
    """Recursively convert non-finite floats to None for strict JSON compliance."""
    if isinstance(value, dict):
        return {k: _json_safe_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_json_safe_value(v) for v in value]
    if isinstance(value, tuple):
        return [_json_safe_value(v) for v in value]
    if isinstance(value, float):
        return value if math.isfinite(value) else None
    return value


def run_ndvi_job(job_id: str, payload: dict, job_store: Dict):
    notify_email = payload.get("notify_email")

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
            },
            "analysis_location": _build_location_summary(geometry),
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
            tif_name = payload.get("drone_original_filename") or Path(payload["drone_image_path"]).name
            result["drone_input"] = {
                "path": payload["drone_image_path"],
                "filename": tif_name,
            }
            try:
                result["drone_data"] = process_drone_data_for_comparison(
                    payload["drone_image_path"],
                    {"type": "Polygon", "coordinates": geometry},
                )
            except Exception as drone_error:
                error_msg = str(drone_error)
                fallback_ok = False

                if "does not overlap" in error_msg.lower():
                    demo_aoi = _load_demo_aoi_for_tif(tif_name)
                    if demo_aoi:
                        try:
                            result["drone_data"] = process_drone_data_for_comparison(
                                payload["drone_image_path"],
                                demo_aoi,
                            )
                            result["drone_data_aoi_fallback"] = {
                                "used": True,
                                "reason": "Provided AOI did not overlap the drone TIFF. Used matched demo AOI pair.",
                                "tif": tif_name,
                            }
                            fallback_ok = True
                            print(f"[WARN] Drone AOI mismatch for {tif_name}. Applied matched demo AOI fallback.")
                        except Exception as fallback_error:
                            error_msg = str(fallback_error)

                if (not fallback_ok) and ("does not overlap" in error_msg.lower()):
                    raster_aoi = _build_inner_aoi_from_raster_bounds(payload["drone_image_path"])
                    if raster_aoi:
                        try:
                            result["drone_data"] = process_drone_data_for_comparison(
                                payload["drone_image_path"],
                                raster_aoi,
                            )
                            result["drone_data_aoi_fallback"] = {
                                "used": True,
                                "reason": "Provided AOI did not overlap the drone TIFF. Used AOI derived from raster bounds.",
                                "tif": tif_name,
                            }
                            # Keep location summary and email details consistent with final AOI actually used.
                            result["analysis_location"] = _build_location_summary(raster_aoi["coordinates"])
                            fallback_ok = True
                            print(f"[WARN] Drone AOI mismatch for {tif_name}. Applied raster-bounds AOI fallback.")
                        except Exception as fallback_error:
                            error_msg = str(fallback_error)

                if not fallback_ok:
                    print(f"[ERROR] Drone processing error: {error_msg}")
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
            print(f"[OK] Drone TIFF for job {job_id} appears useful: vegetation {drone_data.get('vegetation_percentage')}%, mean NDVI {drone_data.get('mean_ndvi')}")
        else:
            print(f"[WARN] Drone TIFF for job {job_id} appears low-usefulness or missing. Data: {drone_data}")

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

        job_store[job_id]["result"] = _json_safe_value(result)

        # =====================================================
        # EMAIL NOTIFICATION — ONLY ON SUCCESSFUL COMPLETION
        # =====================================================
        # Always send to the default recipient on completion
        from app.email_notify import DEFAULT_RECIPIENT
        email_target = notify_email or DEFAULT_RECIPIENT
        email_sent = send_job_completion_email(
            recipient_email=email_target,
            job_id=job_id,
            result=result,
        )
        result["email_notification"] = {
            "attempted": True,
            "recipient": email_target,
            "sent": bool(email_sent),
        }
        print(f"[INFO] Completion email to {email_target}: {'sent' if email_sent else 'failed/skipped'}")

    except Exception as e:
        from app.email_notify import DEFAULT_RECIPIENT
        email_target = notify_email or DEFAULT_RECIPIENT

        email_sent = send_job_completion_email(
            recipient_email=email_target,
            job_id=job_id,
            result={},
            error=str(e),
        )

        job_store[job_id]["status"] = "failed"
        job_store[job_id]["error"] = str(e)
        job_store[job_id]["traceback"] = traceback.format_exc()
        job_store[job_id]["email_notification"] = {
            "attempted": True,
            "recipient": email_target,
            "sent": bool(email_sent),
        }
        print(f"[ERROR] Job {job_id} failed: {str(e)}")
