"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NDVIDiffMap from "./NDVIDiffMap";

/* =========================================================
   TYPES
========================================================= */
type SatelliteComparison = {
  past_year: number;
  present_year: number;
  past_cover_ha: number;
  present_cover_ha: number;
  change_ha: number;
};

type DroneData = {
  vegetation_area_ha: number;
  total_area_ha: number;
  vegetation_percentage: number;
  mean_ndvi: number;
  error?: string;
  ndvi_visualization_id?: string;
};

type ResultPayload = {
  satellite_comparison?: SatelliteComparison;
  drone_data?: DroneData;
  ndvi_difference?: {
    tile_url: string;
  };
};

type ResultsPanelProps = {
  result: ResultPayload;
  aoi: number[][][];
  apiBase: string;
};

/* =========================================================
   RESULTS PANEL
========================================================= */
export default function ResultsPanel({ result, aoi, apiBase }: ResultsPanelProps) {
  if (!result?.satellite_comparison) return null;

  const {
    past_year,
    present_year,
    past_cover_ha,
    present_cover_ha,
    change_ha,
  } = result.satellite_comparison;

  const ndviTileUrl = result.ndvi_difference?.tile_url ?? null;

  const percentageChange = useMemo(() => {
    if (past_cover_ha <= 0) return 0;
    return ((present_cover_ha - past_cover_ha) / past_cover_ha) * 100;
  }, [past_cover_ha, present_cover_ha]);

  const isGain = present_cover_ha > past_cover_ha;
  const isLoss = present_cover_ha < past_cover_ha;
  const absChange = Math.abs(change_ha);

  const MAX_VISUAL_PERCENT = 5;
  const visualPercent = Math.min(
    Math.abs(percentageChange),
    MAX_VISUAL_PERCENT
  );

  const droneData = result.drone_data ?? null;
  const satellitePresent = present_cover_ha;
  const droneVegetation = droneData?.vegetation_area_ha ?? null;

  const droneDiffPct =
    droneVegetation !== null && satellitePresent > 0
      ? ((droneVegetation - satellitePresent) / satellitePresent) * 100
      : null;

  const aoiPoints = aoi?.[0]?.length ?? 0;

  const COLORS = {
    gain: "#22c55e",
    loss: "#ef4444",
    neutral: "#9090b0",
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        marginTop: "2rem",
        padding: "2rem",
        borderRadius: "16px",
        background: "rgba(15, 15, 42, 0.65)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
      }}
    >
      <h2
        style={{
          marginBottom: "1.25rem",
          fontSize: "1.5rem",
          fontWeight: 700,
          fontFamily: "var(--font-heading)",
        }}
      >
        📊 Analysis Results
      </h2>

      <p style={{ fontSize: "0.8rem", color: "#555577", marginBottom: "1rem" }}>
        AOI Points: {aoiPoints}
      </p>

      {/* ================= STATS ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <StatBox
          label={`Past Vegetation (${past_year})`}
          value={`${past_cover_ha.toFixed(2)} ha`}
          color={COLORS.neutral}
        />

        <StatBox
          label={`Present Vegetation (${present_year})`}
          value={`${present_cover_ha.toFixed(2)} ha`}
          color={
            isGain
              ? COLORS.gain
              : isLoss
              ? COLORS.loss
              : COLORS.neutral
          }
        />

        <StatBox
          label="Percentage Change"
          value={`${percentageChange.toFixed(2)}%`}
          color={
            isGain
              ? COLORS.gain
              : isLoss
              ? COLORS.loss
              : COLORS.neutral
          }
        />
      </div>

      {/* ================= GAIN VS LOSS ================= */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h4 style={{ marginBottom: "0.75rem", fontSize: "1rem", fontWeight: 600 }}>
          🌿 Vegetation Gain vs Loss
        </h4>

        <div
          style={{
            position: "relative",
            height: "18px",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: 0,
              width: "2px",
              background: "rgba(255,255,255,0.15)",
            }}
          />

          {isGain && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(visualPercent / MAX_VISUAL_PERCENT) * 50}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{
                position: "absolute",
                left: "50%",
                height: "100%",
                background: `linear-gradient(90deg, ${COLORS.gain}, ${COLORS.gain}88)`,
                borderRadius: "0 99px 99px 0",
              }}
            />
          )}

          {isLoss && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(visualPercent / MAX_VISUAL_PERCENT) * 50}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{
                position: "absolute",
                right: "50%",
                height: "100%",
                background: `linear-gradient(270deg, ${COLORS.loss}, ${COLORS.loss}88)`,
                borderRadius: "99px 0 0 99px",
              }}
            />
          )}
        </div>

        <div
          style={{
            marginTop: "0.5rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: isGain
              ? COLORS.gain
              : isLoss
              ? COLORS.loss
              : COLORS.neutral,
          }}
        >
          {change_ha === 0
            ? "No detectable change"
            : isGain
            ? `Gain of ${absChange.toFixed(2)} ha`
            : `Loss of ${absChange.toFixed(2)} ha`}
        </div>
      </div>

      {/* ================= DRONE ANALYSIS ================= */}
      {droneData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ marginTop: "1.5rem" }}
        >
          <h4 style={{ marginBottom: "0.75rem", fontSize: "1rem", fontWeight: 600 }}>
            🚁 Drone Analysis
          </h4>

          {droneData.error ? (
            <div
              style={{
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                padding: "1rem",
                borderRadius: "12px",
                color: "#f59e0b",
                fontSize: "0.85rem",
              }}
            >
              ⚠️ Drone processing error: {droneData.error}
            </div>
          ) : (
            <>
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  padding: "1rem",
                  borderRadius: "12px",
                  fontSize: "0.85rem",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <span style={{ color: "#555577" }}>Vegetation Area</span>
                  <div style={{ fontWeight: 600, color: "#e8e8f0" }}>
                    {droneData.vegetation_area_ha?.toFixed(2)} ha
                  </div>
                </div>
                <div>
                  <span style={{ color: "#555577" }}>Total Area</span>
                  <div style={{ fontWeight: 600, color: "#e8e8f0" }}>
                    {droneData.total_area_ha?.toFixed(2)} ha
                  </div>
                </div>
                <div>
                  <span style={{ color: "#555577" }}>Vegetation</span>
                  <div style={{ fontWeight: 600, color: "#22c55e" }}>
                    {droneData.vegetation_percentage?.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <span style={{ color: "#555577" }}>Mean NDVI</span>
                  <div style={{ fontWeight: 600, color: "#00d4aa" }}>
                    {droneData.mean_ndvi?.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Drone NDVI Visualization */}
              {droneData.ndvi_visualization_id && (
                <div style={{ marginTop: "1rem" }}>
                  <h5 style={{ marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>
                    NDVI Visualization
                  </h5>
                  <img
                    src={`${apiBase}/drone-ndvi/${droneData.ndvi_visualization_id}`}
                    alt="Drone NDVI"
                    style={{
                      maxWidth: "100%",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  />
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* ================= DRONE vs SATELLITE ================= */}
      {droneVegetation !== null && !droneData?.error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{ marginTop: "1.5rem" }}
        >
          <h4 style={{ marginBottom: "0.75rem", fontSize: "1rem", fontWeight: 600 }}>
            🚁 Drone vs 🛰 Satellite
          </h4>

          <div style={{ color: "#9090b0", fontSize: "0.9rem" }}>
            Difference:{" "}
            <strong
              style={{
                color:
                  droneDiffPct !== null && droneDiffPct >= 0
                    ? COLORS.gain
                    : COLORS.loss,
              }}
            >
              {droneDiffPct?.toFixed(2)}%
            </strong>
            {droneDiffPct !== null && droneDiffPct > 0
              ? " (drone detected more vegetation)"
              : droneDiffPct !== null && droneDiffPct < 0
              ? " (satellite detected more vegetation)"
              : " (comparable vegetation levels)"}
          </div>
        </motion.div>
      )}

      {/* ================= NDVI DIFFERENCE MAP ================= */}
      {ndviTileUrl && (
        <NDVIDiffMap aoi={aoi} tileUrl={ndviTileUrl} />
      )}
    </motion.section>
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
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      style={{
        padding: "1.25rem",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ fontSize: "0.75rem", color: "#555577", marginBottom: "0.4rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.4rem", fontWeight: 700, color, fontFamily: "var(--font-heading)" }}>
        {value}
      </div>
    </motion.div>
  );
}
