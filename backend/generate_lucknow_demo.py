import numpy as np
import rasterio
from rasterio.transform import from_origin
from pathlib import Path

OUTPUT_DIR = Path("demo_drone_images_lucknow")
OUTPUT_DIR.mkdir(exist_ok=True)

width = height = 256
pixel_size = 0.0001  # ~10m-ish scale

def create_tif(filename, lon, lat, red, green, blue, nir):
    transform = from_origin(lon, lat, pixel_size, pixel_size)

    with rasterio.open(
        OUTPUT_DIR / filename,
        "w",
        driver="GTiff",
        height=height,
        width=width,
        count=4,
        dtype="float32",
        crs="EPSG:4326",  # Use geographic CRS so AOI in lat/lon matches directly
        transform=transform,
    ) as dst:
        dst.write(red, 1)
        dst.write(green, 2)
        dst.write(blue, 3)
        dst.write(nir, 4)

    print(f"✅ Created {filename}")


# ============================================
# 1️⃣ Kukrail Healthy Forest
# ============================================
red = np.random.uniform(50, 100, (height, width)).astype("float32")
nir = np.random.uniform(180, 255, (height, width)).astype("float32")

green = red + np.random.uniform(5, 20, (height, width))
blue = red - np.random.uniform(5, 15, (height, width))

create_tif(
    "kukrail_healthy_lko.tif",
    80.995, 26.900,
    red, green, blue, nir
)


# ============================================
# 2️⃣ Kukrail Deforestation
# ============================================
red = np.random.uniform(120, 200, (height, width)).astype("float32")
nir = np.random.uniform(100, 160, (height, width)).astype("float32")

green = red * 0.8
blue = red * 0.7

create_tif(
    "kukrail_deforestation_lko.tif",
    81.020, 26.900,
    red, green, blue, nir
)


# ============================================
# 3️⃣ Gomti Mixed Vegetation
# ============================================
red = np.random.uniform(80, 150, (height, width)).astype("float32")
nir = np.random.uniform(120, 220, (height, width)).astype("float32")

mask = np.random.rand(height, width) > 0.7
nir[mask] *= 0.6  # simulate patches

green = red * 1.05
blue = red * 0.9

create_tif(
    "gomti_mixed_lko.tif",
    80.950, 26.860,
    red, green, blue, nir
)


# ============================================
# 4️⃣ Hazratganj Urban
# ============================================
red = np.random.uniform(150, 255, (height, width)).astype("float32")
nir = np.random.uniform(50, 120, (height, width)).astype("float32")

green = red * 0.9
blue = red * 0.85

create_tif(
    "hazratganj_urban_lko.tif",
    80.940, 26.870,
    red, green, blue, nir
)

# AOI examples in EPSG:4326 (lat/lon) suitable for these generated TIFFs:
lko_aois = {
    "kukrail_healthy_lko.tif": {
        "type": "Polygon",
        "coordinates": [[
            [80.996, 26.901],
            [81.001, 26.901],
            [81.001, 26.906],
            [80.996, 26.906],
            [80.996, 26.901]
        ]]
    },
    "kukrail_deforestation_lko.tif": {
        "type": "Polygon",
        "coordinates": [[
            [81.021, 26.901],
            [81.026, 26.901],
            [81.026, 26.906],
            [81.021, 26.906],
            [81.021, 26.901]
        ]]
    },
    "gomti_mixed_lko.tif": {
        "type": "Polygon",
        "coordinates": [[
            [80.951, 26.861],
            [80.956, 26.861],
            [80.956, 26.866],
            [80.951, 26.866],
            [80.951, 26.861]
        ]]
    },
    "hazratganj_urban_lko.tif": {
        "type": "Polygon",
        "coordinates": [[
            [80.941, 26.871],
            [80.946, 26.871],
            [80.946, 26.876],
            [80.941, 26.876],
            [80.941, 26.871]
        ]]
    }
}

print("\n🎯 All Lucknow demo GeoTIFFs created successfully!")
print("\nUse one of these AOIs with /analyze + drone_image_id to avoid overlap errors:")
for name, aoi in lko_aois.items():
    print(f"- {name}: {aoi}")

# Save AOI metadata to JSON so user has deterministic pairings
import json
with open(OUTPUT_DIR / "lucknow_demo_aoi_pairs.json", "w", encoding="utf-8") as f:
    json.dump(lko_aois, f, indent=2)

print(f"\n📄 Saved AOI pairs to: {OUTPUT_DIR / 'lucknow_demo_aoi_pairs.json'}")