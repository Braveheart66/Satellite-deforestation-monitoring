"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
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
  std_ndvi?: number;
  error?: string;
  ndvi_visualization_id?: string;
};

type ResultPayload = {
  satellite_comparison?: SatelliteComparison;
  drone_data?: DroneData;
  ndvi_difference?: { tile_url: string };
};

type ResultsPanelProps = {
  result: ResultPayload;
  aoi: number[][][];
  apiBase: string;
};

/* =========================================================
   CIRCULAR GAUGE
========================================================= */
function CircularGauge({
  value,
  max,
  label,
  unit,
  color,
  size = 120,
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
  size?: number;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.abs(value) / max, 1);

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="6"
        />
        {/* Value ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
        />
      </svg>
      {/* Center label */}
      <div
        style={{
          marginTop: -size / 2 - 18,
          position: "relative",
          zIndex: 1,
          height: size / 2 + 18,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            fontSize: size > 100 ? "1.3rem" : "1rem",
            fontWeight: 800,
            color,
            fontFamily: "var(--font-heading)",
          }}
        >
          {typeof value === "number" ? value.toFixed(1) : value}
        </motion.span>
        <span style={{ fontSize: "0.65rem", color: "#555577", marginTop: "2px" }}>{unit}</span>
      </div>
      <div style={{ fontSize: "0.72rem", color: "#9090b0", marginTop: "0.25rem", fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */
function StatusBadge({ isGain, isLoss, change }: { isGain: boolean; isLoss: boolean; change: number }) {
  const config = isLoss
    ? { label: "Deforestation Detected", icon: "🚨", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" }
    : isGain
    ? { label: "Vegetation Gain", icon: "🌱", color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)" }
    : { label: "Stable — No Change", icon: "➡️", color: "#9090b0", bg: "rgba(144,144,176,0.06)", border: "rgba(144,144,176,0.15)" };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.85rem",
        padding: "1rem 1.5rem",
        borderRadius: "12px",
        background: config.bg,
        border: `1px solid ${config.border}`,
        marginBottom: "1.5rem",
      }}
    >
      <span style={{ fontSize: "1.8rem" }}>{config.icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: config.color, fontFamily: "var(--font-heading)" }}>
          {config.label}
        </div>
        <div style={{ fontSize: "0.8rem", color: "#9090b0", marginTop: "2px" }}>
          {Math.abs(change).toFixed(2)} hectares {isLoss ? "lost" : isGain ? "gained" : "unchanged"}
        </div>
      </div>
      {(isLoss || isGain) && (
        <div
          style={{
            marginLeft: "auto",
            padding: "0.3rem 0.75rem",
            borderRadius: "99px",
            background: config.color,
            color: "#000",
            fontSize: "0.72rem",
            fontWeight: 700,
          }}
        >
          {isLoss ? "▼ LOSS" : "▲ GAIN"}
        </div>
      )}
    </motion.div>
  );
}

/* =========================================================
   METRIC ROW
========================================================= */
function MetricRow({
  label,
  value,
  color = "#e8e8f0",
  icon,
  suffix = "",
}: {
  label: string;
  value: string | number;
  color?: string;
  icon?: string;
  suffix?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.65rem 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {icon && <span style={{ fontSize: "0.85rem" }}>{icon}</span>}
        <span style={{ fontSize: "0.82rem", color: "#9090b0" }}>{label}</span>
      </div>
      <span style={{ fontSize: "0.9rem", fontWeight: 700, color, fontFamily: "var(--font-heading)" }}>
        {typeof value === "number" ? value.toFixed(2) : value}{suffix}
      </span>
    </div>
  );
}

function getNdviBand(meanNdvi: number) {
  if (meanNdvi < 0.1) return { label: "Bare / Built-up", color: "#ef4444" };
  if (meanNdvi < 0.25) return { label: "Sparse Vegetation", color: "#f59e0b" };
  if (meanNdvi < 0.45) return { label: "Moderate Vegetation", color: "#84cc16" };
  return { label: "Dense Healthy Vegetation", color: "#22c55e" };
}

/* =========================================================
   RESULTS PANEL
========================================================= */
export default function ResultsPanel({ result, aoi, apiBase }: ResultsPanelProps) {
  if (!result?.satellite_comparison) return null;

  const { past_year, present_year, past_cover_ha, present_cover_ha, change_ha } =
    result.satellite_comparison;

  const ndviTileUrl = result.ndvi_difference?.tile_url ?? null;

  const percentageChange = useMemo(() => {
    if (past_cover_ha <= 0) return 0;
    return ((present_cover_ha - past_cover_ha) / past_cover_ha) * 100;
  }, [past_cover_ha, present_cover_ha]);

  const isGain = present_cover_ha > past_cover_ha;
  const isLoss = present_cover_ha < past_cover_ha;
  const droneData = result.drone_data ?? null;
  const droneVegetation = droneData?.vegetation_area_ha ?? null;
  const satellitePresent = present_cover_ha;
  const droneDiffPct =
    droneVegetation !== null && satellitePresent > 0
      ? ((droneVegetation - satellitePresent) / satellitePresent) * 100
      : null;
  const meanNdvi = Number(droneData?.mean_ndvi ?? 0);
  const ndviBand = getNdviBand(meanNdvi);
  const ndviProgress = Math.max(0, Math.min(100, ((meanNdvi + 1) / 2) * 100));
  const maxHa = Math.max(past_cover_ha, present_cover_ha, 1);

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        marginTop: "2rem",
        borderRadius: "20px",
        background: "rgba(10, 10, 30, 0.7)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        overflow: "hidden",
      }}
    >
      {/* ===== HEADER ===== */}
      <div
        style={{
          padding: "1.5rem 2rem 1rem",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: "0.7rem", color: "#555577", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 600, marginBottom: "0.3rem" }}>
            Analysis Report
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, fontFamily: "var(--font-heading)" }}>
            Vegetation Assessment
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.7rem", color: "#555577" }}>Period</div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e8e8f0", fontFamily: "var(--font-heading)" }}>
              {past_year} → {present_year}
            </div>
          </div>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: isLoss ? "rgba(239,68,68,0.12)" : isGain ? "rgba(34,197,94,0.12)" : "rgba(144,144,176,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
            }}
          >
            {isLoss ? "📉" : isGain ? "📈" : "➡️"}
          </div>
        </div>
      </div>

      {/* ===== BODY ===== */}
      <div style={{ padding: "1.5rem 2rem 2rem" }}>

        {/* Status Badge */}
        <StatusBadge isGain={isGain} isLoss={isLoss} change={change_ha} />

        {/* Gauge Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              padding: "1.25rem",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <CircularGauge
              value={past_cover_ha}
              max={maxHa}
              label={`Past (${past_year})`}
              unit="hectares"
              color="#9090b0"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            style={{
              padding: "1.25rem",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <CircularGauge
              value={present_cover_ha}
              max={maxHa}
              label={`Present (${present_year})`}
              unit="hectares"
              color={isGain ? "#22c55e" : isLoss ? "#ef4444" : "#00d4aa"}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              padding: "1.25rem",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <CircularGauge
              value={percentageChange}
              max={10}
              label="Change"
              unit="percent"
              color={isGain ? "#22c55e" : isLoss ? "#ef4444" : "#9090b0"}
            />
          </motion.div>
        </div>

        {/* Comparison Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{
            padding: "1.25rem 1.5rem",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.04)",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#555577", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "1rem" }}>
            Satellite Comparison
          </div>

          {/* Stacked horizontal bar */}
          <div style={{ marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#9090b0", marginBottom: "0.35rem" }}>
              <span>Past ({past_year})</span>
              <span>{past_cover_ha.toFixed(2)} ha</span>
            </div>
            <div style={{ height: "8px", background: "rgba(255,255,255,0.04)", borderRadius: "99px", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(past_cover_ha / maxHa) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                style={{ height: "100%", background: "#9090b0", borderRadius: "99px" }}
              />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: isGain ? "#22c55e" : isLoss ? "#ef4444" : "#9090b0", marginBottom: "0.35rem" }}>
              <span>Present ({present_year})</span>
              <span>{present_cover_ha.toFixed(2)} ha</span>
            </div>
            <div style={{ height: "8px", background: "rgba(255,255,255,0.04)", borderRadius: "99px", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(present_cover_ha / maxHa) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
                style={{
                  height: "100%",
                  background: isGain ? "#22c55e" : isLoss ? "#ef4444" : "#00d4aa",
                  borderRadius: "99px",
                }}
              />
            </div>
          </div>

          {/* Net change */}
          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <MetricRow
              label="Net Change"
              value={`${change_ha > 0 ? "+" : ""}${change_ha.toFixed(2)}`}
              suffix=" ha"
              color={isGain ? "#22c55e" : isLoss ? "#ef4444" : "#9090b0"}
              icon={isLoss ? "📉" : isGain ? "📈" : "➡️"}
            />
            <MetricRow
              label="Percentage Change"
              value={`${percentageChange > 0 ? "+" : ""}${percentageChange.toFixed(2)}`}
              suffix="%"
              color={isGain ? "#22c55e" : isLoss ? "#ef4444" : "#9090b0"}
              icon="📊"
            />
          </div>
        </motion.div>

        {/* ===== DRONE ANALYSIS ===== */}
        {droneData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{
              padding: "1.25rem 1.5rem",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "#555577", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "0.75rem" }}>
              🚁 Drone Analysis
            </div>

            {droneData.error ? (
              <div
                style={{
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  padding: "1rem",
                  borderRadius: "10px",
                  color: "#f59e0b",
                  fontSize: "0.82rem",
                }}
              >
                ⚠️ {droneData.error}
              </div>
            ) : (
              <>
                <MetricRow label="Vegetation Area" value={droneData.vegetation_area_ha} suffix=" ha" icon="🌿" color="#22c55e" />
                <MetricRow label="Total Area" value={droneData.total_area_ha} suffix=" ha" icon="📐" />
                <MetricRow label="Vegetation Coverage" value={droneData.vegetation_percentage} suffix="%" icon="🎯" color="#22c55e" />

                <div
                  style={{
                    marginTop: "0.85rem",
                    padding: "0.9rem",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.55rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "#9090b0" }}>Mean NDVI</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#00d4aa", fontFamily: "var(--font-heading)" }}>
                        {Number.isFinite(meanNdvi) ? meanNdvi.toFixed(4) : "N/A"}
                      </span>
                      <span
                        style={{
                          padding: "0.2rem 0.55rem",
                          borderRadius: "99px",
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          color: ndviBand.color,
                          background: `${ndviBand.color}1A`,
                          border: `1px solid ${ndviBand.color}44`,
                        }}
                      >
                        {ndviBand.label}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      height: "8px",
                      borderRadius: "999px",
                      background:
                        "linear-gradient(90deg, #8b0000 0%, #dc2626 18%, #f59e0b 40%, #84cc16 66%, #15803d 100%)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "-2px",
                        left: `calc(${ndviProgress}% - 4px)`,
                        width: "8px",
                        height: "12px",
                        borderRadius: "4px",
                        background: "#f8fafc",
                        boxShadow: "0 0 0 2px rgba(15,23,42,0.9)",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.35rem", color: "#6b7280", fontSize: "0.68rem" }}>
                    <span>-1.0</span>
                    <span>0.0</span>
                    <span>+1.0</span>
                  </div>
                </div>

                {!!droneData.std_ndvi && (
                  <MetricRow label="NDVI Variability (Std Dev)" value={droneData.std_ndvi.toFixed(3)} icon="〰️" color="#94a3b8" />
                )}

                {droneData.ndvi_visualization_id && (
                  <div
                    style={{
                      marginTop: "1rem",
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(2,6,23,0.65)",
                    }}
                  >
                    <div style={{ padding: "0.55rem 0.8rem", borderBottom: "1px solid rgba(255,255,255,0.07)", fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.1px" }}>
                      Drone NDVI Render
                    </div>
                    <img
                      src={`${apiBase}/drone-ndvi/${droneData.ndvi_visualization_id}`}
                      alt="Drone NDVI"
                      style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: "520px" }}
                    />
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ===== DRONE vs SATELLITE ===== */}
        {droneVegetation !== null && !droneData?.error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            style={{
              padding: "1.25rem 1.5rem",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "#555577", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "0.75rem" }}>
              Drone vs Satellite Comparison
            </div>
            <MetricRow
              label="Satellite Vegetation"
              value={satellitePresent}
              suffix=" ha"
              icon="🛰️"
            />
            <MetricRow
              label="Drone Vegetation"
              value={droneVegetation}
              suffix=" ha"
              icon="🚁"
              color="#00d4aa"
            />
            <MetricRow
              label="Deviation"
              value={`${droneDiffPct !== null && droneDiffPct >= 0 ? "+" : ""}${droneDiffPct?.toFixed(2) ?? "N/A"}`}
              suffix="%"
              icon={droneDiffPct !== null && droneDiffPct >= 0 ? "↗️" : "↘️"}
              color={droneDiffPct !== null && droneDiffPct >= 0 ? "#22c55e" : "#ef4444"}
            />
          </motion.div>
        )}

        {/* ===== NDVI DIFFERENCE MAP ===== */}
        {ndviTileUrl && <NDVIDiffMap aoi={aoi} tileUrl={ndviTileUrl} />}
      </div>
    </motion.section>
  );
}
