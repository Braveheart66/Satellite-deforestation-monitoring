"use client";

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
          marginTop: "1.5rem",
          padding: "1.5rem",
          background: "rgba(239, 68, 68, 0.06)",
          border: "1px solid rgba(239, 68, 68, 0.15)",
          borderRadius: "14px",
          color: "#ef4444",
        }}
      >
        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>🗺️ NDVI Difference Map</div>
        <p style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "#9090b0" }}>Failed to load map component.</p>
      </div>
    );
  }

  if (!isReady || !MapContainerComponent || !TileLayerComponent || !GeoJSONComponent) {
    return (
      <div
        style={{
          marginTop: "1.5rem",
          height: "420px",
          background: "rgba(15, 15, 42, 0.5)",
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ color: "#555577", fontSize: "0.85rem" }}
        >
          Loading NDVI map...
        </motion.p>
      </div>
    );
  }

  const center = [aoi[0][0][1], aoi[0][0][0]] as [number, number];

  const geojsonAOI = {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: aoi },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      style={{
        marginTop: "1.5rem",
        padding: "1.25rem 1.5rem",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ fontSize: "0.75rem", color: "#555577", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "0.75rem" }}>
        🗺️ NDVI Difference Map (Present − Past)
      </div>

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
        {/* Satellite Base Map */}
        <TileLayerComponent
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles © Esri"
        />

        {/* NDVI Difference Layer */}
        <TileLayerComponent url={tileUrl} opacity={0.7} />

        {/* AOI Outline */}
        <GeoJSONComponent
          data={geojsonAOI as any}
          style={{ color: "#00d4aa", weight: 2, fillOpacity: 0, dashArray: "6 4" }}
        />
      </MapContainerComponent>

      {/* Legend */}
      <div
        style={{
          marginTop: "0.65rem",
          fontSize: "0.72rem",
          display: "flex",
          gap: "1.5rem",
          color: "#9090b0",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          NDVI Increase (vegetation gain)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
          NDVI Decrease (vegetation loss)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginLeft: "auto" }}>
          <span style={{ width: "12px", height: "0", borderTop: "2px dashed #00d4aa", display: "inline-block" }} />
          AOI Boundary
        </span>
      </div>
    </motion.div>
  );
}