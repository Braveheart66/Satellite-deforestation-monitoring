import ee
from typing import List


def compute_satellite_ndvi(
    aoi_coords,
    start_date,
    end_date,
    threshold=0.02,
    collection="COPERNICUS/S2_SR_HARMONIZED"
):
    geometry = ee.Geometry.Polygon(aoi_coords)

    if "COPERNICUS/S2" in collection:
        nir_band = "B8"
        red_band = "B4"
        cloud_property = "CLOUDY_PIXEL_PERCENTAGE"
        scale = 10
    else:
        nir_band = "SR_B5"
        red_band = "SR_B4"
        cloud_property = "CLOUD_COVER"
        scale = 30

    img_collection = (
        ee.ImageCollection(collection)
        .filterBounds(geometry)
        .filterDate(start_date, end_date)
        .filter(ee.Filter.lt(cloud_property, 40))
        .select([nir_band, red_band])   # 🔥 CRITICAL FIX
    )

    if img_collection.size().getInfo() == 0:
        return ee.Number(0)

    median_image = img_collection.median()

    ndvi = median_image.normalizedDifference([nir_band, red_band]).rename("NDVI")

    vegetation = ndvi.gt(threshold)

    area_image = vegetation.multiply(ee.Image.pixelArea())

    area_stats = area_image.reduceRegion(
        reducer=ee.Reducer.sum(),
        geometry=geometry,
        scale=scale,
        maxPixels=1e13,
        bestEffort=True
    )

    return ee.Number(area_stats.get("NDVI", 0))
