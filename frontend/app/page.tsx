"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import MapAOI from "../components/MapAOI";
import ResultsPanel from "@/components/ResultsPanel";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import StatsSection from "@/components/StatsSection";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Dynamic import for 3D hero (no SSR)
const HeroBackground = dynamic(() => import("../components/HeroBackground"), {
  ssr: false,
});

export default function DeforestationMonitor() {
  const [mounted, setMounted] = useState(false);

  // AOI selection state
  const [aoi, setAOI] = useState<number[][][] | null>(null);
  const [geojsonInput, setGeojsonInput] = useState("");
  const [aoiMode, setAOIMode] = useState<"map" | "geojson">("map");
  const [geojsonError, setGeojsonError] = useState<string | null>(null);

  // Time period
  const [pastYear, setPastYear] = useState(2016);
  const [presentYear, setPresentYear] = useState(2024);

  // Drone upload
  const [droneFile, setDroneFile] = useState<File | null>(null);
  const [droneFileId, setDroneFileId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");

  // Email notification
  const [notifyEmail, setNotifyEmail] = useState(
    "shivamsinghraghuvanshi1234@gmail.com"
  );

  // Analysis / Job
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleDroneUpload() {
    if (!droneFile) {
      setUploadStatus("Please select a file first");
      return;
    }

    setUploadStatus("📤 Uploading drone image...");

    const formData = new FormData();
    formData.append("file", droneFile);

    try {
      const response = await fetch(`${API_BASE}/upload-drone-image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Drone upload failed");
      }

      const data = await response.json();
      setDroneFileId(data.file_id);
      setUploadStatus(`✅ Successfully uploaded: ${data.filename}`);
    } catch (err: any) {
      setUploadStatus(`❌ Upload failed: ${err?.message ?? "Unknown error"}`);
    }
  }

  async function runAnalysis() {
    if (!aoi) {
      setError("Please select an Area of Interest first");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress("Submitting analysis job...");

    try {
      const payload = {
        geometry: {
          type: "Polygon",
          coordinates: aoi,
        },
        past_year: pastYear,
        present_year: presentYear,
        notify_email: notifyEmail || undefined,
      };

      const submitUrl = droneFileId
        ? `${API_BASE}/analyze?drone_image_id=${droneFileId}`
        : `${API_BASE}/analyze`;

      const submitResponse = await fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!submitResponse.ok) {
        throw new Error("Failed to submit analysis job");
      }

      const { job_id } = await submitResponse.json();
      setProgress(`Job submitted (ID: ${job_id.slice(0, 8)}...)`);

      const pollInterval = setInterval(async () => {
        const pollResponse = await fetch(`${API_BASE}/jobs/${job_id}`);
        const jobData = await pollResponse.json();

        if (jobData.status === "completed") {
          setResult(jobData.result);
          setLoading(false);
          setProgress("");
          clearInterval(pollInterval);
        } else if (jobData.status === "failed") {
          setError(jobData.error || "Analysis failed");
          setLoading(false);
          setProgress("");
          clearInterval(pollInterval);
        } else {
          setProgress("Processing satellite and drone data...");
        }
      }, 3000);
    } catch (err: any) {
      setError(err?.message ?? "Unexpected error");
      setLoading(false);
      setProgress("");
    }
  }

  if (!mounted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050510",
        }}
      >
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.2rem",
            color: "#00d4aa",
          }}
        >
          🌿 Loading DeforestWatch...
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* Background Mesh */}
      <div className="gradient-mesh" />

      {/* Navbar */}
      <Navbar />

      {/* ========== HERO SECTION ========== */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: "6rem 2rem 4rem",
        }}
      >
        <HeroBackground />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            maxWidth: "750px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#00d4aa",
                textTransform: "uppercase",
                letterSpacing: "4px",
                marginBottom: "1rem",
                padding: "0.4rem 1rem",
                background: "rgba(0,212,170,0.08)",
                border: "1px solid rgba(0,212,170,0.2)",
                borderRadius: "999px",
              }}
            >
              Satellite + Drone Analysis
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            style={{
              fontSize: "3.5rem",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: "1.25rem",
              fontFamily: "var(--font-heading)",
            }}
          >
            Monitor{" "}
            <span className="grad-text">Deforestation</span>
            <br />
            From Space
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{
              fontSize: "1.1rem",
              color: "#9090b0",
              lineHeight: 1.7,
              maxWidth: "550px",
              margin: "0 auto 2rem",
            }}
          >
            Track vegetation changes with Google Earth Engine, drone imagery
            NDVI analysis, and automated email alerts — all in real time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <motion.a
              href="#monitor"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "0.85rem 2rem",
                background: "linear-gradient(135deg, #00d4aa, #00a8e8)",
                color: "#000",
                fontWeight: 700,
                fontSize: "0.95rem",
                borderRadius: "12px",
                textDecoration: "none",
                boxShadow: "0 8px 32px rgba(0, 212, 170, 0.3)",
                cursor: "pointer",
              }}
            >
              Start Monitoring →
            </motion.a>
            <motion.a
              href="#features"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "0.85rem 2rem",
                background: "transparent",
                color: "#e8e8f0",
                fontWeight: 600,
                fontSize: "0.95rem",
                borderRadius: "12px",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.12)",
                cursor: "pointer",
              }}
            >
              Learn More
            </motion.a>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            style={{
              marginTop: "4rem",
            }}
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: "24px",
                height: "40px",
                border: "2px solid rgba(255,255,255,0.15)",
                borderRadius: "12px",
                margin: "0 auto",
                display: "flex",
                justifyContent: "center",
                paddingTop: "8px",
              }}
            >
              <motion.div
                animate={{ opacity: [1, 0], y: [0, 14] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                style={{
                  width: "3px",
                  height: "8px",
                  background: "#00d4aa",
                  borderRadius: "99px",
                }}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ========== STATS ========== */}
      <StatsSection />

      {/* ========== FEATURES ========== */}
      <FeaturesSection />

      {/* ========== HOW IT WORKS ========== */}
      <HowItWorksSection />

      {/* ========== MONITOR SECTION ========== */}
      <section
        id="monitor"
        style={{
          padding: "6rem 2rem",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: "3rem" }}
        >
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#00d4aa",
              textTransform: "uppercase",
              letterSpacing: "3px",
              display: "block",
              marginBottom: "0.75rem",
            }}
          >
            ANALYSIS DASHBOARD
          </span>
          <h2
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              marginBottom: "1rem",
            }}
          >
            Start <span className="grad-text">Monitoring</span>
          </h2>
          <p
            style={{
              color: "#9090b0",
              maxWidth: "500px",
              margin: "0 auto",
              fontSize: "1rem",
            }}
          >
            Select your area, upload drone data, and run the analysis
          </p>
        </motion.div>

        {/* --- AOI Section --- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="glass-card"
          style={{ padding: "2rem", marginBottom: "1.5rem" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(0,212,170,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
              }}
            >
              📍
            </span>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
              }}
            >
              Area of Interest
            </h3>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
            <button
              onClick={() => setAOIMode("map")}
              style={{
                padding: "0.55rem 1.2rem",
                fontSize: "0.85rem",
                background:
                  aoiMode === "map"
                    ? "linear-gradient(135deg, #00d4aa, #00a8e8)"
                    : "rgba(255,255,255,0.04)",
                color: aoiMode === "map" ? "#000" : "#9090b0",
                border: aoiMode === "map" ? "none" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: aoiMode === "map" ? "0 4px 16px rgba(0,212,170,0.2)" : "none",
              }}
            >
              Draw on Map
            </button>

            <button
              onClick={() => setAOIMode("geojson")}
              style={{
                padding: "0.55rem 1.2rem",
                fontSize: "0.85rem",
                background:
                  aoiMode === "geojson"
                    ? "linear-gradient(135deg, #00d4aa, #00a8e8)"
                    : "rgba(255,255,255,0.04)",
                color: aoiMode === "geojson" ? "#000" : "#9090b0",
                border: aoiMode === "geojson" ? "none" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: aoiMode === "geojson" ? "0 4px 16px rgba(0,212,170,0.2)" : "none",
              }}
            >
              Use GeoJSON
            </button>
          </div>

          {aoiMode === "map" && <MapAOI onAOISelect={setAOI} />}

          {aoiMode === "geojson" && (
            <>
              <textarea
                placeholder='Paste GeoJSON Polygon {"type":"Polygon","coordinates":[[[lng,lat],...]]}'
                value={geojsonInput}
                onChange={(e) => setGeojsonInput(e.target.value)}
                style={{
                  height: "140px",
                  resize: "vertical",
                }}
              />
              <button
                style={{ marginTop: "1rem" }}
                onClick={() => {
                  try {
                    setGeojsonError(null);
                    const parsed = JSON.parse(geojsonInput);
                    if (
                      parsed.type === "Polygon" &&
                      Array.isArray(parsed.coordinates)
                    ) {
                      setAOI(parsed.coordinates);
                    } else {
                      throw new Error("Invalid GeoJSON Polygon");
                    }
                  } catch (err: any) {
                    setGeojsonError(err.message || "Invalid GeoJSON");
                  }
                }}
              >
                Parse GeoJSON
              </button>
              {geojsonError && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    color: "#ef4444",
                    fontSize: "0.85rem",
                  }}
                >
                  {geojsonError}
                </div>
              )}
            </>
          )}

          <AnimatePresence>
            {aoi && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  marginTop: "1rem",
                  color: "#22c55e",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#22c55e",
                    display: "inline-block",
                  }}
                />
                AOI selected with {aoi[0].length} points
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* --- Drone Upload --- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="glass-card"
          style={{ padding: "2rem", marginBottom: "1.5rem" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(34,197,94,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
              }}
            >
              🚁
            </span>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              Drone Image{" "}
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "#555577",
                  marginLeft: "0.5rem",
                }}
              >
                optional
              </span>
            </h3>
          </div>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <label
              style={{
                flex: 1,
                minWidth: "200px",
                padding: "1.5rem",
                borderRadius: "12px",
                border: "2px dashed rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
                textAlign: "center",
                cursor: "pointer",
                transition: "border-color 0.2s ease",
                position: "relative",
              }}
            >
              <input
                type="file"
                accept=".tif,.tiff,.jpg,.jpeg"
                onChange={(e) => setDroneFile(e.target.files?.[0] ?? null)}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                }}
              />
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                {droneFile ? "📄" : "☁️"}
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: droneFile ? "#e8e8f0" : "#555577",
                }}
              >
                {droneFile
                  ? droneFile.name
                  : "Drop .tif / .jpg or click to browse"}
              </div>
            </label>

            <button
              onClick={handleDroneUpload}
              disabled={!droneFile}
              style={{
                padding: "0.65rem 1.5rem",
                fontSize: "0.85rem",
              }}
            >
              Upload
            </button>
          </div>

          <AnimatePresence>
            {uploadStatus && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  marginTop: "0.75rem",
                  fontSize: "0.85rem",
                  color: uploadStatus.includes("✅")
                    ? "#22c55e"
                    : uploadStatus.includes("❌")
                    ? "#ef4444"
                    : "#00a8e8",
                }}
              >
                {uploadStatus}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* --- Email Notification --- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          viewport={{ once: true }}
          className="glass-card"
          style={{ padding: "2rem", marginBottom: "1.5rem" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(245,158,11,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
              }}
            >
              📧
            </span>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              Email Notifications
            </h3>
          </div>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: "250px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  color: "#9090b0",
                  marginBottom: "0.5rem",
                  fontWeight: 500,
                }}
              >
                Send results to email
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                style={{
                  maxWidth: "400px",
                }}
              />
            </div>
          </div>
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.8rem",
              color: "#555577",
              lineHeight: 1.5,
            }}
          >
            📬 You&apos;ll receive a rich HTML email with vegetation statistics and
            change analysis upon completion.
          </p>
        </motion.div>

        {/* --- Time Period --- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="glass-card"
          style={{ padding: "2rem", marginBottom: "1.5rem" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(124,58,237,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
              }}
            >
              📅
            </span>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              Time Period
            </h3>
          </div>

          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "150px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.8rem",
                  color: "#9090b0",
                  fontWeight: 500,
                }}
              >
                Past Year
              </label>
              <select
                value={pastYear}
                onChange={(e) => setPastYear(Number(e.target.value))}
              >
                {[2010, 2012, 2014, 2016, 2018, 2020].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                paddingBottom: "0.6rem",
                color: "#555577",
                fontSize: "1.2rem",
              }}
            >
              →
            </div>

            <div style={{ flex: 1, minWidth: "150px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.8rem",
                  color: "#9090b0",
                  fontWeight: 500,
                }}
              >
                Present Year
              </label>
              <select
                value={presentYear}
                onChange={(e) => setPresentYear(Number(e.target.value))}
              >
                {[2020, 2021, 2022, 2023, 2024].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* --- Run Analysis --- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          viewport={{ once: true }}
          className="glass-card"
          style={{
            padding: "2rem",
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          <motion.button
            onClick={runAnalysis}
            disabled={!aoi || loading}
            whileHover={aoi && !loading ? { scale: 1.03 } : {}}
            whileTap={aoi && !loading ? { scale: 0.97 } : {}}
            style={{
              padding: "0.9rem 3rem",
              fontSize: "1rem",
              fontWeight: 700,
              borderRadius: "12px",
              background:
                loading
                  ? "#2a2a3e"
                  : aoi
                  ? "linear-gradient(135deg, #00d4aa, #00a8e8)"
                  : "#2a2a3e",
              color: loading || !aoi ? "#555577" : "#000",
              boxShadow: aoi && !loading ? "0 8px 32px rgba(0,212,170,0.3)" : "none",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{ display: "inline-block" }}
                >
                  ⏳
                </motion.span>
                Processing...
              </span>
            ) : (
              "🔍 Run Analysis"
            )}
          </motion.button>

          <AnimatePresence>
            {progress && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  marginTop: "1rem",
                  color: "#00a8e8",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                }}
              >
                {progress}
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  marginTop: "1rem",
                  color: "#ef4444",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                }}
              >
                ❌ {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* --- Results --- */}
        <AnimatePresence>
          {result && aoi && (
            <ResultsPanel result={result} aoi={aoi} apiBase={API_BASE} />
          )}
        </AnimatePresence>
      </section>

      {/* ========== FOOTER ========== */}
      <Footer />
    </>
  );
}
