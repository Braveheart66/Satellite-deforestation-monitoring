#!/usr/bin/env python3
"""
Demo NDVI Drone File Generator
Creates synthetic multispectral TIFF files for testing drone NDVI processing
"""

import numpy as np
import rasterio
from rasterio.transform import from_bounds
import os
from pathlib import Path

def create_demo_ndvi_tiff(
    output_path: str,
    width: int = 1000,
    height: int = 1000,
    bounds: tuple = (77.0, 12.8, 77.1, 12.9),  # Bangalore area
    crs: str = "EPSG:4326",
    pattern: str = "mixed"
):
    """
    Create a synthetic multispectral TIFF with realistic NDVI patterns

    Args:
        output_path: Path to save the TIFF
        width, height: Image dimensions
        bounds: (west, south, east, north) in degrees
        crs: Coordinate reference system
    """

    # Create synthetic multispectral data (4 bands: R, G, B, NIR)
    np.random.seed(42)  # For reproducible results

    # Base vegetation pattern
    x = np.linspace(0, 10, width)
    y = np.linspace(0, 10, height)
    X, Y = np.meshgrid(x, y)

    # Create realistic NDVI patterns with adjustable diversity by pattern
    if pattern == "healthy":
        base_ndvi = 0.4 + 0.25 * np.sin(X/2) * np.cos(Y/3) + 0.06 * np.random.randn(height, width)
    elif pattern == "deforestation":
        base_ndvi = 0.2 + 0.35 * np.sin(X/2) * np.cos(Y/3) + 0.12 * np.random.randn(height, width)
        deforestation_mask = np.random.random((height, width)) < 0.35
        base_ndvi[deforestation_mask] = -0.3 + 0.25 * np.random.randn(*deforestation_mask.sum().shape)
    elif pattern == "urban":
        base_ndvi = 0.0 + 0.25 * np.sin(X/1.5) * np.cos(Y/2) + 0.18 * np.random.randn(height, width)
        urban_mask = np.random.random((height, width)) < 0.45
        base_ndvi[urban_mask] = -0.25 + 0.15 * np.random.randn(*urban_mask.sum().shape)
    else:  # mixed
        base_ndvi = 0.3 + 0.4 * np.sin(X/2) * np.cos(Y/3) + 0.15 * np.random.randn(height, width)
        deforestation_mask = np.random.random((height, width)) < 0.20
        base_ndvi[deforestation_mask] = -0.25 + 0.2 * np.random.randn(*deforestation_mask.sum().shape)

    # Clip to valid NDVI range
    base_ndvi = np.clip(base_ndvi, -1, 1)

    # Convert NDVI to reflectance values
    # NDVI = (NIR - RED) / (NIR + RED)
    # Assume some realistic reflectance values
    red_reflectance = np.where(
        base_ndvi > 0,
        0.1 + 0.2 * (1 - base_ndvi),  # Healthy vegetation: low red
        0.3 + 0.2 * np.random.random((height, width))  # Non-vegetation: higher red
    )

    nir_reflectance = (red_reflectance * (1 + base_ndvi)) / (1 - base_ndvi + 1e-10)
    nir_reflectance = np.clip(nir_reflectance, 0, 1)

    # Green and blue bands (simplified)
    green_reflectance = red_reflectance * (0.8 + 0.4 * np.random.random((height, width)))
    blue_reflectance = red_reflectance * (0.6 + 0.3 * np.random.random((height, width)))

    # Add noise
    red_reflectance += 0.02 * np.random.randn(height, width)
    green_reflectance += 0.02 * np.random.randn(height, width)
    blue_reflectance += 0.02 * np.random.randn(height, width)
    nir_reflectance += 0.02 * np.random.randn(height, width)

    # Clip to 0-1 range
    red_reflectance = np.clip(red_reflectance, 0, 1)
    green_reflectance = np.clip(green_reflectance, 0, 1)
    blue_reflectance = np.clip(blue_reflectance, 0, 1)
    nir_reflectance = np.clip(nir_reflectance, 0, 1)

    # Convert to 16-bit integers (common for drone imagery)
    red = (red_reflectance * 65535).astype(np.uint16)
    green = (green_reflectance * 65535).astype(np.uint16)
    blue = (blue_reflectance * 65535).astype(np.uint16)
    nir = (nir_reflectance * 65535).astype(np.uint16)

    # Stack bands
    data = np.stack([red, green, blue, nir], axis=0)

    # Create transform
    transform = from_bounds(*bounds, width, height)

    # Create metadata
    metadata = {
        'driver': 'GTiff',
        'dtype': 'uint16',
        'width': width,
        'height': height,
        'count': 4,
        'crs': crs,
        'transform': transform,
        'compress': 'lzw',
        'tiled': True,
        'blockxsize': 256,
        'blockysize': 256
    }

    # Write the file
    with rasterio.open(output_path, 'w', **metadata) as dst:
        dst.write(data)

        # Add band descriptions
        dst.set_band_description(1, 'Red')
        dst.set_band_description(2, 'Green')
        dst.set_band_description(3, 'Blue')
        dst.set_band_description(4, 'NIR')

    print(f"Created demo NDVI TIFF: {output_path}")
    print(f"  Dimensions: {width}x{height}")
    print(f"  Bounds: {bounds}")
    print(f"  Mean NDVI: {base_ndvi.mean():.3f}")
    print(f"  NDVI range: {base_ndvi.min():.3f} to {base_ndvi.max():.3f}")
def create_demo_dataset(output_dir: str = "demo_drone_images"):
    """
    Create a set of demo drone images with different scenarios
    """
    os.makedirs(output_dir, exist_ok=True)

    # Demo 1: Healthy forest (more bright green but still some variance)
    create_demo_ndvi_tiff(
        os.path.join(output_dir, "healthy_forest.tif"),
        bounds=(77.0, 12.8, 77.05, 12.85),
        pattern="healthy"
    )

    # Demo 2: Deforestation area (mixed green + red patches)
    create_demo_ndvi_tiff(
        os.path.join(output_dir, "deforestation_area.tif"),
        bounds=(77.05, 12.8, 77.1, 12.85),
        pattern="deforestation"
    )

    # Demo 3: Mixed vegetation (diverse NDVI colors)
    create_demo_ndvi_tiff(
        os.path.join(output_dir, "mixed_vegetation.tif"),
        bounds=(77.1, 12.8, 77.15, 12.85),
        pattern="mixed"
    )

    # Demo 4: Urban area (lower NDVI, more red/brown)
    create_demo_ndvi_tiff(
        os.path.join(output_dir, "urban_area.tif"),
        bounds=(77.15, 12.8, 77.2, 12.85),
        pattern="urban"
    )

    print(f"\nDemo dataset created in: {output_dir}")
    print("Files:")
    for f in os.listdir(output_dir):
        if f.endswith('.tif'):
            print(f"  - {f}")

if __name__ == "__main__":
    create_demo_dataset()