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

    nir_band = "B8"
    red_band = "B4"
    scale = 10

    # --------------------------------------------------
    # IMAGE COLLECTION
    # --------------------------------------------------
    img_collection = (
        ee.ImageCollection(collection)
        .filterBounds(geometry)
        .filterDate(start_date, end_date)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 40))
        .select([nir_band, red_band])
    )

    if img_collection.size().getInfo() == 0:
        if return_map:
            return 0, None, []
        return 0

    # --------------------------------------------------
    # NDVI IMAGE
    # --------------------------------------------------
    median_image = img_collection.median()

    ndvi = median_image.normalizedDifference(
        [nir_band, red_band]
    ).rename("NDVI")

    # --------------------------------------------------
    # VEGETATION AREA (SQ METERS)
    # --------------------------------------------------
    vegetation = ndvi.gt(threshold)
    area_image = vegetation.multiply(ee.Image.pixelArea())

    area_stats = area_image.reduceRegion(
        reducer=ee.Reducer.sum(),
        geometry=geometry,
        scale=scale,
        maxPixels=1e13,
        bestEffort=True
    )

    area_sqm = ee.Number(area_stats.get("NDVI", 0))

    # --------------------------------------------------
    # HISTOGRAM (NDVI DISTRIBUTION)
    # --------------------------------------------------
    hist = ndvi.reduceRegion(
        reducer=ee.Reducer.histogram(20),
        geometry=geometry,
        scale=scale,
        maxPixels=1e13,
        bestEffort=True
    ).get("NDVI")

    histogram = ee.Dictionary(hist).getInfo() if hist else []

    # --------------------------------------------------
    # TILE MAP EXPORT
    # --------------------------------------------------
    if return_map:
        ndvi_vis = {
            "min": 0.0,
            "max": 0.8,
            "palette": [
                "#8c510a",  # brown
                "#d8b365",  # yellow
                "#5ab4ac",  # light green
                "#01665e"   # dark green
            ]
        }

        ndvi_map = ndvi.getMapId(ndvi_vis)
        tile_url = ndvi_map["tile_fetcher"].url_format

        return area_sqm, tile_url, histogram

    return area_sqm
