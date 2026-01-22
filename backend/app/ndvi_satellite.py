import ee

def compute_satellite_ndvi(
    aoi_coords,
    start_date,
    end_date,
    threshold=0.15,
    collection="COPERNICUS/S2_SR_HARMONIZED",
    return_map=False
):
    geometry = ee.Geometry.Polygon(aoi_coords)

    nir = "B8"
    red = "B4"

    images = (
        ee.ImageCollection(collection)
        .filterBounds(geometry)
        .filterDate(start_date, end_date)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 40))
        .select([nir, red])
    )

    if images.size().getInfo() == 0:
        return (0, None, None, None) if return_map else 0

    median = images.median()
    ndvi = median.normalizedDifference([nir, red]).rename("NDVI")

    vegetation = ndvi.gt(threshold)
    area_img = vegetation.multiply(ee.Image.pixelArea())

    area = area_img.reduceRegion(
        reducer=ee.Reducer.sum(),
        geometry=geometry,
        scale=10,
        maxPixels=1e13,
        bestEffort=True
    ).get("NDVI", 0)

    if not return_map:
        return area

    ndvi_vis = {
        "min": 0.0,
        "max": 0.8,
        "palette": ["brown", "yellow", "green"]
    }

    ndvi_tile = ndvi.getMapId(ndvi_vis)["tile_fetcher"].url_format

    histogram = ndvi.reduceRegion(
        reducer=ee.Reducer.histogram(20),
        geometry=geometry,
        scale=30,
        maxPixels=1e13
    ).get("NDVI")

    return area, ndvi_tile, histogram
