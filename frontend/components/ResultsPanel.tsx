"use client";

import { useMemo } from "react";

/* =========================================================
   RESULTS PANEL (NO TILES • STABLE • PRODUCTION SAFE)
   - Removes all Earth Engine tiles
   - Adds Gain vs Loss bar chart
========================================================= */
export default function ResultsPanel({ result }: { result: any }) {
  if (!result || !result.satellite_comparison) return null;

  const {
    past_year,
    present_year,
    past_cover_ha,
    present_cover_ha,
    change_ha,
  } = result.satellite_comparison;

  /* =======================================================
     VEGETATION CLASSIFICATION
  ======================================================= */
  const trend =
    change_ha > 0
      ? { label: "Vegetation Gain", color: "#27ae60" }
      : change_ha < 0
      ? { label: "Vegetation Loss", color: "#c0392b" }
      : { label: "Stable", color: "#7f8c8d" };

  /* =======================================================
     GAIN / LOSS SPLIT (SIMPLE MODEL)
     You can refine this later with ΔNDVI bins
  ======================================================= */
  const gain = change_ha > 0 ? change_ha : 0;
  const loss = change_ha < 0 ? Math.abs(change_ha) : 0;
  const maxBar = Math.max(gain, loss, 1);

  /* =======================================================
     NDVI HISTOGRAM (OPTIONAL)
  ======================================================= */
  const histogram = Array.isArray(result.ndvi_histogram)
    ? result.ndvi_histogram
    : [];

  /* =======================================================
     RENDER
  ======================================================= */
  return (
    <section
      style={{
        marginTop: "2rem",
        padding: "1.5rem",
        borderRadius: "16px",
        background: "#fff",
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
      }}
    >
      <h2 style={{ marginBottom: "1.5rem" }}>📊 Analysis Results</h2>

      {/* ================= STATS ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <StatBox
          label={`Past Vegetation (${past_year})`}
          value={`${past_cover_ha} ha`}
          color="#27ae60"
        />
        <StatBox
          label={`Present Vegetation (${present_year})`}
          value={`${present_cover_ha} ha`}
          color="#e67e22"
        />
        <StatBox
          label="Vegetation Trend"
          value={trend.label}
          color={trend.color}
        />
      </div>

      {/* ================= GAIN vs LOSS BAR ================= */}
      <div style={{ marginBottom: "2rem" }}>
        <h4 style={{ marginBottom: "0.75rem" }}>🌿 Vegetation Gain vs Loss</h4>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "2rem",
            height: "160px",
          }}
        >
          <Bar
            label="Gain"
            value={gain}
            max={maxBar}
            color="#27ae60"
          />
          <Bar
            label="Loss"
            value={loss}
            max={maxBar}
            color="#c0392b"
          />
        </div>

        <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#555" }}>
          Values shown in hectares (ha)
        </div>
      </div>

      {/* ================= NDVI HISTOGRAM ================= */}
      {histogram.length > 0 && (
        <div>
          <h4 style={{ marginBottom: "0.5rem" }}>📊 NDVI Distribution</h4>

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
                title={`NDVI ≈ ${bin.mean?.toFixed(2)}`}
                style={{
                  width: "12px",
                  height: `${Math.max(2, bin.count / 10)}px`,
                  background:
                    bin.mean > 0.3
                      ? "#27ae60"
                      : bin.mean > 0.15
                      ? "#f1c40f"
                      : "#c0392b",
                }}
              />
            ))}
          </div>

          <div
            style={{
              fontSize: "0.75rem",
              color: "#555",
              marginTop: "0.25rem",
            }}
          >
            Red = Low NDVI | Yellow = Medium | Green = High
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   BAR COMPONENT
========================================================= */
function Bar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const heightPercent = useMemo(
    () => Math.round((value / max) * 100),
    [value, max]
  );

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: "60px",
          height: `${heightPercent}%`,
          background: color,
          borderRadius: "6px 6px 0 0",
          transition: "height 0.4s ease",
        }}
      />
      <div style={{ marginTop: "0.5rem", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: "0.8rem", color: "#555" }}>
        {value.toFixed(2)} ha
      </div>
    </div>
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
      <div style={{ fontSize: "0.8rem", color: "#555" }}>{label}</div>
      <div style={{ fontSize: "1.4rem", fontWeight: 700, color }}>
        {value}
      </div>
    </div>
  );
}
