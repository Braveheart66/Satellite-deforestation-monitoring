from pydantic import BaseModel
from typing import Dict

class NDVIRequest(BaseModel):
    aoi: Dict        # Accept GeoJSON
    past_year: int
    present_year: int
