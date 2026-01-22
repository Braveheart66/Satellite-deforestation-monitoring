from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/tiles/{path:path}")
def tiles_disabled(path: str):
    raise HTTPException(
        status_code=410,
        detail="Tile rendering has been disabled. Use numeric visualizations instead."
    )
