from fastapi import FastAPI, BackgroundTasks, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import Dict
import uuid
import shutil
from pathlib import Path
import threading

from app.worker import run_ndvi_job
from app.schemas import NDVIRequest
from app.ee_client import init_ee


# ================================
# CREATE FASTAPI APP
# ================================
app = FastAPI(
    title="Drone-Based Deforestation Monitor",
    version="1.0.0"
)

# ================================
# GLOBAL STORES
# ================================
JOB_STORE: Dict[str, dict] = {}
UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ================================
# MIDDLEWARE
# ================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================================
# EARTH ENGINE INIT
# ================================
def init_ee_background():
    try:
        init_ee()
        print("✅ Earth Engine initialized")
    except Exception as e:
        print(f"⚠️ Earth Engine init failed: {e}")

@app.on_event("startup")
def startup():
    threading.Thread(target=init_ee_background, daemon=True).start()


# ================================
# HEALTH CHECK
# ================================
@app.get("/")
def root():
    return {"status": "ok"}

# ================================
# DRONE IMAGE UPLOAD
# ================================
@app.post("/upload-drone-image")
async def upload_drone_image(
    file: UploadFile = File(...),
    bounds: str | None = Form(None),
    crs: str = Form("EPSG:4326")
):
    file_id = str(uuid.uuid4())
    original_path = UPLOAD_DIR / f"{file_id}_original{Path(file.filename).suffix}"
    tiff_path = UPLOAD_DIR / f"{file_id}.tif"

    # Save original file
    with original_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    bounds_tuple = None
    if bounds:
        try:
            parts = bounds.replace("[", "").replace("]", "").split(",")
            bounds_tuple = tuple(float(p.strip()) for p in parts)
            if len(bounds_tuple) != 4:
                raise ValueError
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="`bounds` must be provided as 'west,south,east,north' or [west,south,east,north]"
            )

    # Check if JPG and convert to NDVI-ready TIFF
    if file.filename.lower().endswith(('.jpg', '.jpeg')):
        from app.ndvi_drone import DroneNDVIProcessor
        processor = DroneNDVIProcessor()
        processor.convert_jpg_to_ndvi_tiff(
            str(original_path),
            str(tiff_path),
            bounds=bounds_tuple,
            crs=crs
        )
        # Remove original JPG after conversion
        original_path.unlink()
    else:
        # Assume it's already a TIFF, just rename
        original_path.rename(tiff_path)

    return {
        "file_id": file_id,
        "filename": file.filename,
        "converted": file.filename.lower().endswith(('.jpg', '.jpeg')),
        "bounds": bounds_tuple,
        "crs": crs
    }

# ================================
# ANALYZE ENDPOINT
# ================================
@app.post("/analyze")
async def analyze(
    req: NDVIRequest,
    bg: BackgroundTasks,
    drone_image_id: str | None = None
):
    job_id = str(uuid.uuid4())
    JOB_STORE[job_id] = {"status": "processing"}

    payload = req.dict()

    if drone_image_id:
        payload["drone_image_path"] = str(
            UPLOAD_DIR / f"{drone_image_id}.tif"
        )

    bg.add_task(run_ndvi_job, job_id, payload, JOB_STORE)

    return {"job_id": job_id}

# ================================
# JOB STATUS
# ================================
@app.get("/jobs/{job_id}")
def job_status(job_id: str):
    if job_id not in JOB_STORE:
        raise HTTPException(status_code=404, detail="Job not found")
    return JOB_STORE[job_id]

# ================================
# DRONE NDVI VISUALIZATION
# ================================
@app.get("/drone-ndvi/{file_id}")
def get_drone_ndvi_visualization(file_id: str):
    png_path = UPLOAD_DIR / f"{file_id}_ndvi.png"
    if not png_path.exists():
        raise HTTPException(status_code=404, detail="NDVI visualization not found")
    return FileResponse(png_path, media_type="image/png")
