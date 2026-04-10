"use client";

import "leaflet/dist/leaflet.css";
import { type LatLngTuple } from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Polygon, Polyline, useMapEvents } from "react-leaflet";

type Props = {
  onAOISelect: (coords: number[][][] | null) => void;
};

const mapCenter: LatLngTuple = [26.9124, 75.7873];

function AoiMapEvents({ isDrawing, onAddPoint }: { isDrawing: boolean; onAddPoint: (pt: LatLngTuple) => void; }) {
  useMapEvents({
    click(e) {
      if (!isDrawing) return;
      onAddPoint([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function MapAOIClient({ onAOISelect }: Props) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<LatLngTuple[]>([]);

  const aoiPolygon = useMemo(() => {
    return points.length >= 3 ? points : null;
  }, [points]);

  useEffect(() => {
    if (aoiPolygon) {
      const coords = [aoiPolygon.map(([lat, lng]) => [lng, lat])];
      onAOISelect(coords);
    } else {
      onAOISelect(null);
    }
  }, [aoiPolygon, onAOISelect]);

  const clearSelection = () => {
    setIsDrawing(false);
    setPoints([]);
    onAOISelect(null);
  };

  const completeSelection = () => {
    if (points.length < 3) {
      window.alert("Draw at least 3 points to complete the polygon.");
      return;
    }
    setIsDrawing(false);
  };

  return (
    <div>
      <div style={{ marginBottom: "0.75rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          onClick={() => setIsDrawing((v) => !v)}
          style={{
            padding: "0.5rem 0.85rem",
            fontSize: "0.82rem",
            background: isDrawing
              ? "linear-gradient(135deg, #ef4444, #dc2626)"
              : "linear-gradient(135deg, #00d4aa, #00a8e8)",
            color: "#000",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            boxShadow: isDrawing
              ? "0 4px 16px rgba(239, 68, 68, 0.25)"
              : "0 4px 16px rgba(0, 212, 170, 0.2)",
          }}
        >
          {isDrawing ? "✏️ Drawing active (click on map)" : "✏️ Start drawing"}
        </button>

        <button
          onClick={completeSelection}
          disabled={points.length < 3}
          style={{
            padding: "0.5rem 0.85rem",
            fontSize: "0.82rem",
            background:
              points.length >= 3
                ? "linear-gradient(135deg, #22c55e, #16a34a)"
                : "#2a2a3e",
            color: points.length >= 3 ? "#000" : "#555577",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            boxShadow:
              points.length >= 3
                ? "0 4px 16px rgba(34, 197, 94, 0.2)"
                : "none",
          }}
        >
          ✅ Complete Polygon
        </button>

        <button
          onClick={clearSelection}
          style={{
            padding: "0.5rem 0.85rem",
            fontSize: "0.82rem",
            background: "rgba(255,255,255,0.05)",
            color: "#9090b0",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            fontWeight: 600,
            boxShadow: "none",
          }}
        >
          🗑️ Clear
        </button>
      </div>

      <div
        style={{
          marginBottom: "0.75rem",
          color: "#555577",
          fontSize: "0.8rem",
        }}
      >
        Points in current draw: {points.length}
      </div>

      <MapContainer
        center={mapCenter}
        zoom={11}
        style={{
          width: "100%",
          height: "420px",
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='© <a href="https://carto.com/">CARTO</a>'
        />
        <AoiMapEvents isDrawing={isDrawing} onAddPoint={(pt) => setPoints((prev) => [...prev, pt])} />

        {points.length > 0 && <Polyline positions={points} pathOptions={{ color: "#00d4aa", dashArray: "6 6" }} />}

        {aoiPolygon && <Polygon positions={[aoiPolygon]} pathOptions={{ color: "#22c55e", fillOpacity: 0.15, weight: 2 }} />}
      </MapContainer>

      <div
        style={{
          marginTop: "10px",
          fontSize: "0.8rem",
          color: "#555577",
        }}
      >
        {aoiPolygon
          ? "✅ Polygon ready. Click Complete Polygon to lock your AOI."
          : "Start drawing to define your Area of Interest."}
      </div>
    </div>
  );
}
