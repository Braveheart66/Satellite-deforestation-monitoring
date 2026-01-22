from fastapi import APIRouter
import requests

router = APIRouter()

@router.get("/tiles/{mapid}/{z}/{x}/{y}")
def get_ee_tile(mapid: str, z: int, x: int, y: int, token: str):
    url = (
        f"https://earthengine.googleapis.com/map/{mapid}/{z}/{x}/{y}"
        f"?token={token}"
    )

    response = requests.get(url, stream=True)

    return Response(
        content=response.content,
        media_type="image/png"
    )
