"""
Drone-Based NDVI Computation & Downscaling
Processes high-resolution drone imagery and aligns it with satellite resolution
"""

import numpy as np
import rasterio
from rasterio.mask import mask
from rasterio.warp import transform_geom, calculate_default_transform, reproject, Resampling
from rasterio.transform import from_bounds
from typing import Dict, Tuple
import cv2
import os
from PIL import Image
from matplotlib import pyplot as plt
from matplotlib.colors import LinearSegmentedColormap


class DroneNDVIProcessor:
    def __init__(self, satellite_resolution: float = 10.0):
        self.satellite_resolution = satellite_resolution

    def convert_jpg_to_ndvi_tiff(
        self,
        jpg_path: str,
        output_tiff_path: str,
        bounds: tuple = None,
        crs: str = "EPSG:4326"
    ) -> str:
        """
        Convert RGB JPG to multispectral TIFF ready for NDVI calculation.
        Creates NIR band by enhancing green channel (common approximation).

        Args:
            jpg_path: Path to input JPG file
            output_tiff_path: Path for output TIFF
            bounds: (west, south, east, north) geographic bounds
            crs: Coordinate reference system

        Returns:
            Path to created TIFF file
        """
        # Read JPG image
        img = Image.open(jpg_path)
        rgb = np.array(img)

        # Convert to float and normalize to 0-1
        rgb_float = rgb.astype(np.float32) / 255.0

        # Extract RGB bands
        red = rgb_float[:, :, 0]
        green = rgb_float[:, :, 1]
        blue = rgb_float[:, :, 2]

        # Create NIR approximation (enhanced green + some red contribution)
        # This is a simplified approximation - real multispectral would have true NIR
        nir = np.clip(green * 1.2 + red * 0.3, 0, 1)

        # Convert back to 16-bit
        red_16 = (red * 65535).astype(np.uint16)
        green_16 = (green * 65535).astype(np.uint16)
        blue_16 = (blue * 65535).astype(np.uint16)
        nir_16 = (nir * 65535).astype(np.uint16)

        # Stack bands (R, G, B, NIR)
        data = np.stack([red_16, green_16, blue_16, nir_16], axis=0)

        height, width = red.shape

        # Create default bounds if not provided
        if bounds is None:
            bounds = (0, 0, width, height)  # Pixel coordinates

        # Create transform
        transform = from_bounds(*bounds, width, height)

        # Create metadata
        metadata = {
            'driver': 'GTiff',
            'dtype': 'uint16',
            'width': width,
            'height': height,
            'count': 4,
            'crs': crs if bounds != (0, 0, width, height) else None,
            'transform': transform,
            'compress': 'lzw'
        }

        # Write TIFF
        with rasterio.open(output_tiff_path, 'w', **metadata) as dst:
            dst.write(data)
            dst.set_band_description(1, 'Red')
            dst.set_band_description(2, 'Green')
            dst.set_band_description(3, 'Blue')
            dst.set_band_description(4, 'NIR (approximated)')

    def create_ndvi_visualization(
        self,
        ndvi_array: np.ndarray,
        output_png_path: str,
        colormap: str = "RdYlGn"
    ) -> str:
        """
        Create a colorized PNG visualization of NDVI data

        Args:
            ndvi_array: NDVI values (-1 to 1)
            output_png_path: Path for output PNG
            colormap: Matplotlib colormap name

        Returns:
            Path to created PNG
        """
        # Mask nodata and invalid values so they don't skew color interpretation.
        masked = np.ma.masked_invalid(ndvi_array)
        masked = np.ma.masked_where(masked <= -999, masked)

        if colormap == "RdYlGn":
            # Tuned palette with stronger separation around low-positive NDVI values.
            cmap = LinearSegmentedColormap.from_list(
                "ndvi_prod",
                [
                    (0.55, 0.06, 0.06),
                    (0.85, 0.2, 0.15),
                    (0.98, 0.76, 0.18),
                    (0.56, 0.78, 0.34),
                    (0.14, 0.49, 0.20),
                ],
                N=512,
            )
        else:
            cmap = plt.get_cmap(colormap)

        fig, ax = plt.subplots(figsize=(8.2, 6.8), dpi=170)
        fig.patch.set_facecolor("#0b1220")
        ax.set_facecolor("#111827")

        image = ax.imshow(masked, cmap=cmap, vmin=-1, vmax=1, interpolation="bicubic")
        ax.set_title("Drone NDVI", color="#e5e7eb", fontsize=13, pad=12, fontweight="bold")
        ax.set_xticks([])
        ax.set_yticks([])

        cbar = fig.colorbar(image, ax=ax, fraction=0.046, pad=0.03)
        cbar.set_label("NDVI", color="#d1d5db", fontsize=10)
        cbar.ax.yaxis.set_tick_params(color="#9ca3af", labelcolor="#d1d5db")
        cbar.outline.set_edgecolor("#374151")

        mean_value = float(np.ma.mean(masked)) if masked.count() else 0.0
        ax.text(
            0.02,
            0.03,
            f"Mean NDVI: {mean_value:.3f}",
            transform=ax.transAxes,
            fontsize=9,
            color="#e5e7eb",
            bbox={"boxstyle": "round,pad=0.35", "facecolor": "#0f172a", "edgecolor": "#334155", "alpha": 0.9},
        )

        plt.tight_layout()
        fig.savefig(output_png_path, dpi=170, bbox_inches="tight", facecolor=fig.get_facecolor())
        plt.close(fig)

        return output_png_path

    def compute_drone_ndvi(
        self,
        drone_image_path: str,
        red_band_idx: int = 0,
        nir_band_idx: int = 3
    ) -> Tuple[np.ndarray, dict]:

        with rasterio.open(drone_image_path) as src:
            if src.count <= max(red_band_idx, nir_band_idx):
                raise ValueError("Drone image does not contain required bands")

            red = src.read(red_band_idx + 1).astype("float32")
            nir = src.read(nir_band_idx + 1).astype("float32")

            ndvi = np.where(
                (nir + red) == 0,
                0,
                (nir - red) / (nir + red)
            )

            ndvi = np.clip(ndvi, -1, 1)

            metadata = src.meta.copy()
            metadata.update({
                "count": 1,
                "dtype": "float32"
            })

        return ndvi, metadata

    def downscale_to_satellite_resolution(
        self,
        high_res_ndvi: np.ndarray,
        src_metadata: dict,
        target_resolution: float = None
    ) -> Tuple[np.ndarray, dict]:

        if target_resolution is None:
            target_resolution = self.satellite_resolution

        transform = src_metadata["transform"]
        crs = src_metadata["crs"]

        if not crs or not crs.is_projected:
            # Reproject to a projected CRS (Web Mercator) for processing
            target_crs = rasterio.crs.CRS.from_epsg(3857)
            print(f"⚙️ Reprojecting drone NDVI from {crs} to {target_crs}")

            # Determine source bounds from transform
            height = src_metadata["height"]
            width = src_metadata["width"]
            left, bottom, right, top = rasterio.transform.array_bounds(height, width, transform)

            dst_transform, dst_width, dst_height = calculate_default_transform(
                crs if crs else rasterio.crs.CRS.from_epsg(4326),
                target_crs,
                width,
                height,
                left,
                bottom,
                right,
                top
            )

            reprojected_ndvi = np.zeros((dst_height, dst_width), dtype=np.float32)

            reproject(
                source=high_res_ndvi,
                destination=reprojected_ndvi,
                src_transform=transform,
                src_crs=crs if crs else rasterio.crs.CRS.from_epsg(4326),
                dst_transform=dst_transform,
                dst_crs=target_crs,
                resampling=Resampling.bilinear
            )

            high_res_ndvi = reprojected_ndvi
            src_metadata = src_metadata.copy()
            src_metadata.update({
                "crs": target_crs,
                "transform": dst_transform,
                "width": dst_width,
                "height": dst_height
            })

            transform = dst_transform
            crs = target_crs

        current_resolution = abs(transform.a)

        if current_resolution > target_resolution:
            print(
                f"⚠️ Drone resolution ({current_resolution:.4f}m) is coarser than target "
                f"({target_resolution:.4f}m). Using source resolution with no upsampling."
            )
            return high_res_ndvi, src_metadata

        # Downscale: target is coarser than source, so factor < 1
        scale_factor = target_resolution / current_resolution

        if scale_factor <= 0:
            raise ValueError(
                f"Invalid scale factor {scale_factor}. "
                f"Check source resolution {current_resolution} and target {target_resolution}."
            )

        new_width = max(1, int(high_res_ndvi.shape[1] / scale_factor))
        new_height = max(1, int(high_res_ndvi.shape[0] / scale_factor))

        # Prevent ridiculously huge RAM use; if target resolution is extremely coarse vs image, do safe clamping.
        if new_width > 20000 or new_height > 20000:
            raise ValueError(
                f"Computed downscaled size is too large: {new_width}x{new_height}. "
                "Please verify raster metadata and target resolution."
            )

        downscaled = cv2.resize(
            high_res_ndvi,
            (new_width, new_height),
            interpolation=cv2.INTER_LINEAR
        )

        new_transform = rasterio.Affine(
            target_resolution,
            0,
            transform.c,
            0,
            -target_resolution,
            transform.f
        )

        new_metadata = src_metadata.copy()
        new_metadata.update({
            "height": new_height,
            "width": new_width,
            "transform": new_transform,
            "count": 1,
            "dtype": "float32"
        })

        return downscaled, new_metadata

    def align_with_aoi(
        self,
        ndvi_array: np.ndarray,
        metadata: dict,
        aoi_geojson: dict
    ) -> Tuple[np.ndarray, float]:

        from rasterio.io import MemoryFile

        if not metadata.get("crs"):
            raise ValueError(
                "Drone image is not georeferenced (missing CRS). "
                "Please upload a georeferenced GeoTIFF or provide bounds+CRS."
            )

        aoi_projected = transform_geom(
            "EPSG:4326",
            metadata["crs"],
            aoi_geojson
        )

        with MemoryFile() as memfile:
            with memfile.open(**metadata) as dataset:
                dataset.write(ndvi_array, 1)

                try:
                    cropped, transform = mask(
                        dataset,
                        [aoi_projected],
                        crop=True,
                        nodata=-999
                    )
                except ValueError as e:
                    if "Input shapes do not overlap raster" in str(e):
                        raise ValueError(
                            "AOI does not overlap the drone image. "
                            "Verify drone imagery bounds/CRS and AOI conversion."
                        )
                    raise

                if cropped.size == 0:
                    raise ValueError(
                        "After clipping, crop result is empty. "
                        "This indicates no overlap between AOI and drone image."
                    )

                pixel_area = abs(transform.a * transform.e)

        return cropped[0], pixel_area

    def calculate_vegetation_cover(
        self,
        ndvi: np.ndarray,
        pixel_area: float,
        threshold: float = 0.4
    ) -> Dict[str, float]:

        valid_mask = ndvi != -999
        valid_ndvi = ndvi[valid_mask]

        vegetation_pixels = (valid_ndvi > threshold).sum()
        total_pixels = valid_mask.sum()

        total_area_ha = (total_pixels * pixel_area) / 10000
        vegetation_area_ha = (vegetation_pixels * pixel_area) / 10000

        if valid_ndvi.size == 0:
            mean_ndvi = 0.0
            std_ndvi = 0.0
        else:
            mean_ndvi = float(np.mean(valid_ndvi))
            std_ndvi = float(np.std(valid_ndvi))

        # Keep values JSON-safe; non-finite floats can crash FastAPI JSON rendering.
        if not np.isfinite(total_area_ha):
            total_area_ha = 0.0
        if not np.isfinite(vegetation_area_ha):
            vegetation_area_ha = 0.0
        if not np.isfinite(mean_ndvi):
            mean_ndvi = 0.0
        if not np.isfinite(std_ndvi):
            std_ndvi = 0.0

        return {
            "total_area_ha": round(total_area_ha, 2),
            "vegetation_area_ha": round(vegetation_area_ha, 2),
            "vegetation_percentage": round(
                (vegetation_pixels / total_pixels * 100) if total_pixels else 0, 2
            ),
            "mean_ndvi": round(mean_ndvi, 3),
            "std_ndvi": round(std_ndvi, 3)
        }


def process_drone_data_for_comparison(
    drone_image_path: str,
    aoi_geojson: dict,
    red_band: int = 0,
    nir_band: int = 3
) -> Dict[str, any]:

    processor = DroneNDVIProcessor()

    ndvi, meta = processor.compute_drone_ndvi(
        drone_image_path,
        red_band,
        nir_band
    )

    if not meta.get("crs"):
        raise ValueError(
            "Drone image does not contain CRS. "
            "Cannot align to AOI in lat/lng. "
            "Please upload a georeferenced GeoTIFF or provide bounds + CRS."
        )

    downscaled, down_meta = processor.downscale_to_satellite_resolution(
        ndvi,
        meta
    )

    cropped, pixel_area = processor.align_with_aoi(
        downscaled,
        down_meta,
        aoi_geojson
    )

    stats = processor.calculate_vegetation_cover(cropped, pixel_area)

    # Generate NDVI visualization
    vis_path = drone_image_path.replace('.tif', '_ndvi.png')
    processor.create_ndvi_visualization(cropped, vis_path)

    return {
        "drone_stats": stats,
        "vegetation_area_ha": float(stats.get("vegetation_area_ha", 0)),
        "total_area_ha": float(stats.get("total_area_ha", 0)),
        "vegetation_percentage": float(stats.get("vegetation_percentage", 0)),
        "mean_ndvi": float(stats.get("mean_ndvi", 0)),
        "std_ndvi": float(stats.get("std_ndvi", 0)),
        "original_resolution_m": float(abs(meta["transform"].a)),
        "downscaled_resolution_m": float(processor.satellite_resolution),
        "ndvi_visualization_id": os.path.basename(drone_image_path).replace('.tif', '')
    }
