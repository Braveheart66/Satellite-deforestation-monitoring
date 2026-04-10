"use client";

import { LatLngExpression } from "leaflet";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

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
          background: "rgba(239, 68, 68, 0.08)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          borderRadius: "12px",
          color: "#ef4444",
        }}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>🗺️ NDVI Difference Map (Present − Past)</h3>
        <p style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>⚠️ Map failed to load</p>
      </div>
    );
  }

  if (!isReady || !MapContainerComponent || !TileLayerComponent || !GeoJSONComponent) {
    return (
      <div
        style={{
          marginTop: "2rem",
          height: "420px",
          background: "rgba(15, 15, 42, 0.5)",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p style={{ color: "#555577" }}>Loading map...</p>
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      style={{ marginTop: "2rem" }}
    >
      <h3
        style={{
          marginBottom: "0.75rem",
          fontSize: "1rem",
          fontWeight: 600,
        }}
      >
        🗺️ NDVI Difference Map (Present − Past)
      </h3>

      <MapContainerComponent
        center={center}
        zoom={12}
        style={{
          height: "420px",
          width: "100%",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Dark Base Map */}
        <TileLayerComponent
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='© <a href="https://carto.com/">CARTO</a>'
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
            color: "#00d4aa",
            weight: 2,
            fillOpacity: 0,
          }}
        />
      </MapContainerComponent>

      {/* Legend */}
      <div
        style={{
          marginTop: "0.75rem",
          fontSize: "0.82rem",
          display: "flex",
          gap: "1.5rem",
        }}
      >
        <span style={{ color: "#22c55e", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          NDVI Increase
        </span>
        <span style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
          NDVI Decrease
        </span>
      </div>
    </motion.div>
  );
}