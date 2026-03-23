import ee

# =========================================================
# NUMERIC NDVI (AREA CALCULATION)
# =========================================================
def compute_satellite_ndvi(
    aoi_coords,
    start_date,
    end_date,
    threshold=0.15,
    collection="COPERNICUS/S2_SR_HARMONIZED",
):
    """
    Computes vegetation area (square meters) using NDVI.
    RETURNS ONLY A NUMBER.
    """

    geometry = ee.Geometry.Polygon(aoi_coords)

    nir_band = "B8"
    red_band = "B4"
    scale = 10

    col = (
        ee.ImageCollection(collection)
        .filterBounds(geometry)
        .filterDate(start_date, end_date)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 40))
        .select([nir_band, red_band])
    )

    if col.size().getInfo() == 0:
        return 0.0

    median_image = col.median()

    ndvi = median_image.normalizedDifference(
        [nir_band, red_band]
    ).rename("NDVI")

    vegetation_mask = ndvi.gt(threshold)
    vegetation_area = vegetation_mask.multiply(
        ee.Image.pixelArea()
    )

    stats = vegetation_area.reduceRegion(
        reducer=ee.Reducer.sum(),
        geometry=geometry,
        scale=scale,
        maxPixels=1e13,
        bestEffort=True,
    )

    area_sqm = stats.get("NDVI")

    if area_sqm is None:
        return 0.0

    return ee.Number(area_sqm).getInfo()


# =========================================================
# NDVI DIFFERENCE TILE (VISUALIZATION)
# =========================================================
def compute_ndvi_difference_tile(
    aoi_coords,
    past_start_date,
    past_end_date,
    present_start_date,
    present_end_date,
    collection="COPERNICUS/S2_SR_HARMONIZED",
):
    """
    Computes NDVI difference (present - past)
    and returns an Earth Engine tile URL.
    """

    geometry = ee.Geometry.Polygon(aoi_coords)

    nir_band = "B8"
    red_band = "B4"

    def get_ndvi(start, end):
        col = (
            ee.ImageCollection(collection)
            .filterBounds(geometry)
            .filterDate(start, end)
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 40))
            .select([nir_band, red_band])
        )

        return col.median().normalizedDifference(
            [nir_band, red_band]
        ).rename("NDVI")

    ndvi_past = get_ndvi(past_start_date, past_end_date)
    ndvi_present = get_ndvi(present_start_date, present_end_date)

    ndvi_diff = ndvi_present.subtract(ndvi_past).clip(geometry)

    vis_params = {
        "min": -0.4,
        "max": 0.4,
        "palette": [
            "#8e0000",  # strong loss
            "#ff4d4d",  # moderate loss
            "#ffffff",  # no change
            "#7bed9f",  # moderate gain
            "#1e8449",  # strong gain
        ],
    }

    map_id = ndvi_diff.getMapId(vis_params)
    return map_id["tile_fetcher"].url_format
