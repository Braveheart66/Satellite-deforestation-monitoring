"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import "leaflet/dist/leaflet.css";

/* =========================================================
   DYNAMIC LEAFLET IMPORT (NO SSR)
========================================================= */
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);

/* =========================================================
   RESULTS PANEL — FULLY UPGRADED
========================================================= */
export default function ResultsPanel({ result }: { result: any }) {
  if (!result) return null;

  const tiles = result.ndvi_tiles || {};
  const histogram = result.ndvi_histogram || null;

  /* =======================================================
     VIEW / MODE STATE
  ======================================================= */
  const [mode, setMode] = useState<"ndvi" | "diff">("ndvi");
  const [opacity, setOpacity] = useState<number>(0.7);

  /* =======================================================
     STATIC MAP CENTER (PREVENT REINIT BUG)
  ======================================================= */
  const center = useMemo<[number, number]>(() => [0, 0], []);

  /* =======================================================
     TILE SELECTION LOGIC
  ======================================================= */
  const baseTile: string | null =
    mode === "ndvi"
      ? typeof tiles.present === "string"
        ? tiles.present
        : null
      : typeof tiles.diff === "string"
      ? tiles.diff
      : null;

  const overlayTile: string | null =
    mode === "ndvi" && typeof tiles.past === "string"
      ? tiles.past
      : null;

  /* =======================================================
     VEGETATION GAIN / LOSS CLASSIFICATION
  ======================================================= */
  const changeHa =
    result.satellite_comparison?.change_ha ?? null;

  let vegLabel = "Stable";
  let vegColor = "#7f8c8d";

  if (typeof changeHa === "number") {
    if (changeHa > 0) {
      vegLabel = "Vegetation Gain";
      vegColor = "#27ae60";
    } else if (changeHa < 0) {
      vegLabel = "Vegetation Loss";
      vegColor = "#c0392b";
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */
  return (
    <section
      style={{
        marginTop: "2rem",
        padding: "1.5rem",
        borderRadius: "16px",
        background: "#ffffff",
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
      }}
    >
      <h2 style={{ marginBottom: "1rem" }}>📊 Analysis Results</h2>

      {/* ================= STATS ================= */}
      {result.satellite_comparison && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <StatBox
            label={`Past (${result.satellite_comparison.past_year})`}
            value={`${result.satellite_comparison.past_cover_ha} ha`}
            color="#27ae60"
          />
          <StatBox
            label={`Present (${result.satellite_comparison.present_year})`}
            value={`${result.satellite_comparison.present_cover_ha} ha`}
            color="#e67e22"
          />
          <StatBox
            label="Vegetation Trend"
            value={vegLabel}
            color={vegColor}
          />
        </div>
      )}

      {/* ================= MODE TOGGLES ================= */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <button onClick={() => setMode("ndvi")}>🌿 NDVI</button>
        <button onClick={() => setMode("diff")}>🔥 ΔNDVI</button>
      </div>

      {/* ================= MAP ================= */}
      {typeof baseTile === "string" && (
        <div
          style={{
            position: "relative",
            height: "420px",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          <MapContainer
            center={center}
            zoom={5}
            style={{ height: "100%", width: "100%" }}
          >
            {/* BASE TILE (PRESENT NDVI OR ΔNDVI) */}
            <TileLayer url={baseTile} />

            {/* OVERLAY TILE (PAST NDVI WITH OPACITY SWIPE) */}
            {typeof overlayTile === "string" && (
              <TileLayer
                url={overlayTile}
                opacity={opacity}
              />
            )}
          </MapContainer>

          {/* ================= OPACITY SWIPE ================= */}
          {typeof overlayTile === "string" && (
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "80%",
                background: "rgba(0,0,0,0.6)",
                padding: "0.75rem",
                borderRadius: "12px",
              }}
            >
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={opacity}
                onChange={(e) =>
                  setOpacity(Number(e.target.value))
                }
                style={{ width: "100%" }}
              />
              <div
                style={{
                  color: "#fff",
                  textAlign: "center",
                  fontSize: "0.85rem",
                  marginTop: "0.25rem",
                }}
              >
                Past ↔ Present Opacity
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= HISTOGRAM ================= */}
      {Array.isArray(histogram) && histogram.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <h4 style={{ marginBottom: "0.5rem" }}>
            📊 NDVI Distribution
          </h4>
          <div
            style={{
              display: "flex",
              gap: "4px",
              alignItems: "flex-end",
              height: "120px",
            }}
          >
            {histogram.map((bin: any, i: number) => (
              <div
                key={i}
                title={`NDVI ${bin.bin}: ${bin.count}`}
                style={{
                  height: `${bin.count}px`,
                  width: "10px",
                  background:
                    bin.bin < 0
                      ? "#c0392b"
                      : bin.bin < 0.2
                      ? "#f1c40f"
                      : "#27ae60",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   STAT BOX
========================================================= */
function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: "12px",
        background: "#f9f9f9",
        border: "1px solid #ddd",
      }}
    >
      <div style={{ fontSize: "0.8rem", color: "#555" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "1.4rem",
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}
