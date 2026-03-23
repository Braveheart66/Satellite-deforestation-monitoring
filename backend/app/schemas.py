from pydantic import BaseModel
from typing import List, Optional


class Geometry(BaseModel):
    type: str
    coordinates: List[List[List[float]]]


class NDVIRequest(BaseModel):
    geometry: Geometry
    past_year: int
    present_year: int
    phone_number: Optional[str] = None

class NDVIDifference(BaseModel):
    tile_url: str

