"use client";

import "leaflet/dist/leaflet.css";
import { type LatLngTuple } from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Polygon, Polyline, useMapEvents, CircleMarker } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  onAOISelect: (coords: number[][][] | null) => void;
};

const mapCenter: LatLngTuple = [26.9124, 75.7873];

function AoiMapEvents({ isDrawing, onAddPoint }: { isDrawing: boolean; onAddPoint: (pt: LatLngTuple) => void }) {
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
  const [isCompleted, setIsCompleted] = useState(false);

  const aoiPolygon = useMemo(() => {
    return points.length >= 3 ? points : null;
  }, [points]);

  useEffect(() => {
    if (aoiPolygon && isCompleted) {
      const coords = [aoiPolygon.map(([lat, lng]) => [lng, lat])];
      onAOISelect(coords);
    } else if (!isCompleted) {
      onAOISelect(null);
    }
  }, [aoiPolygon, isCompleted, onAOISelect]);

  const clearSelection = () => {
    setIsDrawing(false);
    setIsCompleted(false);
    setPoints([]);
    onAOISelect(null);
  };

  const undoLast = () => {
    if (points.length > 0) {
      setPoints((prev) => prev.slice(0, -1));
    }
  };

  const completeSelection = () => {
    if (points.length < 3) return;
    setIsDrawing(false);
    setIsCompleted(true);
  };

  const startDrawing = () => {
    setIsDrawing(true);
    setIsCompleted(false);
    setPoints([]);
    onAOISelect(null);
  };

  // Calculate approximate area
  const approxArea = useMemo(() => {
    if (points.length < 3) return 0;
    // Shoelace formula (approximate, works for small areas)
    let area = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i][1] * points[j][0];
      area -= points[j][1] * points[i][0];
    }
    area = Math.abs(area) / 2;
    // Convert degrees² to km² (very rough: 1° ≈ 111km)
    return area * 111 * 111;
  }, [points]);

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        {!isDrawing && !isCompleted && (
          <motion.button
            onClick={startDrawing}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "0.55rem 1rem",
              fontSize: "0.82rem",
              background: "linear-gradient(135deg, #00d4aa, #00a8e8)",
              color: "#000",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              boxShadow: "0 4px 16px rgba(0, 212, 170, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
            </svg>
            Draw AOI
          </motion.button>
        )}

        {isDrawing && (
          <>
            <div
              style={{
                padding: "0.45rem 0.85rem",
                fontSize: "0.78rem",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px",
                color: "#ef4444",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#ef4444",
                  display: "inline-block",
                }}
              />
              Click on map to place points
            </div>

            <button
              onClick={undoLast}
              disabled={points.length === 0}
              style={{
                padding: "0.45rem 0.75rem",
                fontSize: "0.78rem",
                background: points.length > 0 ? "rgba(255,255,255,0.06)" : "#1a1a2e",
                color: points.length > 0 ? "#9090b0" : "#3a3a55",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                fontWeight: 500,
                boxShadow: "none",
              }}
            >
              ↩ Undo
            </button>

            <button
              onClick={completeSelection}
              disabled={points.length < 3}
              style={{
                padding: "0.45rem 0.85rem",
                fontSize: "0.78rem",
                background: points.length >= 3
                  ? "linear-gradient(135deg, #22c55e, #16a34a)"
                  : "#1a1a2e",
                color: points.length >= 3 ? "#000" : "#3a3a55",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                boxShadow: points.length >= 3
                  ? "0 4px 16px rgba(34, 197, 94, 0.2)"
                  : "none",
              }}
            >
              ✓ Complete ({points.length} pts)
            </button>
          </>
        )}

        {isCompleted && (
          <>
            <div
              style={{
                padding: "0.45rem 0.85rem",
                fontSize: "0.78rem",
                background: "rgba(34, 197, 94, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.25)",
                borderRadius: "8px",
                color: "#22c55e",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              AOI Locked — {points.length} vertices
            </div>
          </>
        )}

        <button
          onClick={clearSelection}
          style={{
            padding: "0.45rem 0.75rem",
            fontSize: "0.78rem",
            background: "rgba(255,255,255,0.04)",
            color: "#9090b0",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            fontWeight: 500,
            boxShadow: "none",
            marginLeft: "auto",
          }}
        >
          ✕ Reset
        </button>
      </div>

      {/* Map Container */}
      <div style={{ position: "relative" }}>
        <MapContainer
          center={mapCenter}
          zoom={11}
          style={{
            width: "100%",
            height: "480px",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Satellite imagery base layer */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles © Esri"
            maxZoom={19}
          />
          {/* Labels overlay on top of satellite */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
            attribution='© <a href="https://carto.com/">CARTO</a>'
            maxZoom={19}
          />

          <AoiMapEvents isDrawing={isDrawing} onAddPoint={(pt) => setPoints((prev) => [...prev, pt])} />

          {/* Points as dots */}
          {points.map((pt, idx) => (
            <CircleMarker
              key={idx}
              center={pt}
              radius={isDrawing ? 5 : 4}
              pathOptions={{
                color: isCompleted ? "#22c55e" : "#00d4aa",
                fillColor: isCompleted ? "#22c55e" : "#00d4aa",
                fillOpacity: 1,
                weight: 2,
              }}
            />
          ))}

          {/* Drawing polyline (dashed) */}
          {points.length > 0 && !isCompleted && (
            <Polyline positions={points} pathOptions={{ color: "#00d4aa", dashArray: "8 6", weight: 2, opacity: 0.8 }} />
          )}

          {/* Completed polygon */}
          {aoiPolygon && isCompleted && (
            <Polygon
              positions={[aoiPolygon]}
              pathOptions={{
                color: "#22c55e",
                fillColor: "#22c55e",
                fillOpacity: 0.12,
                weight: 2,
              }}
            />
          )}
        </MapContainer>

        {/* Overlay info panel — area & coordinates */}
        <AnimatePresence>
          {points.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                position: "absolute",
                bottom: "12px",
                left: "12px",
                right: "12px",
                background: "rgba(5, 5, 16, 0.85)",
                backdropFilter: "blur(12px)",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "0.6rem 0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
                zIndex: 1000,
                fontSize: "0.75rem",
                color: "#9090b0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2">
                  <polygon points="12 2 22 22 2 22" />
                </svg>
                <span style={{ fontWeight: 600, color: "#e8e8f0" }}>{points.length}</span> vertices
              </div>
              {approxArea > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00a8e8" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                  <span style={{ fontWeight: 600, color: "#e8e8f0" }}>
                    {approxArea < 1 ? `${(approxArea * 100).toFixed(1)} ha` : `${approxArea.toFixed(2)} km²`}
                  </span>
                  approx area
                </div>
              )}
              {points.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginLeft: "auto" }}>
                  <span style={{ color: "#555577" }}>Last:</span>
                  <span style={{ fontFamily: "monospace", color: "#e8e8f0", fontSize: "0.72rem" }}>
                    {points[points.length - 1][0].toFixed(4)}, {points[points.length - 1][1].toFixed(4)}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map helper text */}
      <div
        style={{
          marginTop: "0.6rem",
          fontSize: "0.75rem",
          color: "#555577",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity={0.5}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        {isCompleted
          ? "Polygon locked. Click Reset to start over."
          : isDrawing
          ? "Click on the map to place vertices. Minimum 3 points required."
          : "Click \"Draw AOI\" to begin selecting your area of interest."
        }
      </div>
    </div>
  );
}
