"use client";

import { LatLngExpression } from "leaflet";
import { useEffect, useState } from "react";

let MapContainerComponent: any = null;
let TileLayerComponent: any = null;
let GeoJSONComponent: any = null;

type Props = {
  aoi: number[][][];
  tileUrl: string;
};

export default function NDVIDiffMap({ aoi, tileUrl }: Props) {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initializeComponents = async () => {
      try {
        const { MapContainer: MC, TileLayer: TL, GeoJSON: GJ } =
          await import("react-leaflet");
        MapContainerComponent = MC;
        TileLayerComponent = TL;
        GeoJSONComponent = GJ;

        // Import Leaflet
        await import("leaflet");
        if (typeof window !== "undefined") {
          require("leaflet/dist/leaflet.css");
        }

        setIsReady(true);
      } catch (error) {
        console.error("NDVI map initialization failed:", error);
        setHasError(true);
      }
    };

    initializeComponents();
  }, []);

  if (hasError) {
    return (
      <div
        style={{
          marginTop: "2rem",
          padding: "2rem",
          background: "#fee",
          borderRadius: "12px",
          color: "#c33",
        }}
      >
        <h3>🗺️ NDVI Difference Map (Present − Past)</h3>
        <p>⚠️ Map failed to load</p>
      </div>
    );
  }

  if (!isReady || !MapContainerComponent || !TileLayerComponent || !GeoJSONComponent) {
    return (
      <div
        style={{
          marginTop: "2rem",
          height: "420px",
          background: "#f0f0f0",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p>Loading map...</p>
      </div>
    );
  }

  const center = [
    aoi[0][0][1], // lat
    aoi[0][0][0], // lng
  ] as [number, number];

  const geojsonAOI = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: aoi,
    },
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h3 style={{ marginBottom: "0.75rem" }}>
        🗺️ NDVI Difference Map (Present − Past)
      </h3>

      <MapContainerComponent
        center={center}
        zoom={12}
        style={{
          height: "420px",
          width: "100%",
          borderRadius: "12px",
        }}
      >
        {/* Base Map */}
        <TileLayerComponent
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* NDVI Difference Layer */}
        <TileLayerComponent
          url={tileUrl}
          opacity={0.75}
        />

        {/* AOI Outline */}
        <GeoJSONComponent
          data={geojsonAOI as any}
          style={{
            color: "#000",
            weight: 2,
            fillOpacity: 0,
          }}
        />
      </MapContainerComponent>

      {/* Legend */}
      <div
        style={{
          marginTop: "0.75rem",
          fontSize: "0.85rem",
          display: "flex",
          gap: "1.5rem",
        }}
      >
        <span style={{ color: "#27ae60" }}>⬤ NDVI Increase</span>
        <span style={{ color: "#c0392b" }}>⬤ NDVI Decrease</span>
      </div>
    </div>
  );
}