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
      <div style={{ marginBottom: "0.75rem", display: "flex", gap: "0.75rem" }}>
        <button
          onClick={() => setIsDrawing((v) => !v)}
          style={{
            padding: "0.5rem 0.75rem",
            backgroundColor: isDrawing ? "#d55376" : "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {isDrawing ? "Drawing active (click on map)" : "Start drawing"}
        </button>

        <button
          onClick={completeSelection}
          disabled={points.length < 3}
          style={{
            padding: "0.5rem 0.75rem",
            backgroundColor: points.length >= 3 ? "#28a745" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: points.length >= 3 ? "pointer" : "not-allowed",
          }}
        >
          Complete Polygon
        </button>

        <button
          onClick={clearSelection}
          style={{
            padding: "0.5rem 0.75rem",
            backgroundColor: "#555",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ marginBottom: "0.75rem", color: "#333" }}>
        Points in current draw: {points.length}
      </div>

      <MapContainer center={mapCenter} zoom={11} style={{ width: "100%", height: "420px", borderRadius: "14px" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
        <AoiMapEvents isDrawing={isDrawing} onAddPoint={(pt) => setPoints((prev) => [...prev, pt])} />

        {points.length > 0 && <Polyline positions={points} pathOptions={{ color: "#007bff", dashArray: "6 6" }} />}

        {aoiPolygon && <Polygon positions={[aoiPolygon]} pathOptions={{ color: "#28a745", fillOpacity: 0.2 }} />}
      </MapContainer>

      <div style={{ marginTop: "10px", fontSize: "0.9rem", color: "#444" }}>
        {aoiPolygon ? "Polygon ready. Click Complete Polygon to lock and send AOI." : "Start drawing to define your AOI."}
      </div>
    </div>
  );
}
