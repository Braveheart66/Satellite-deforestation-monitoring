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

// Dynamic import for canvas hero (needs window/document)
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

    setUploadStatus("Uploading drone image...");

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
      setUploadStatus(`[Done] Successfully uploaded: ${data.filename}`);
    } catch (err: any) {
      setUploadStatus(`[Error] Upload failed: ${err?.message ?? "Unknown error"}`);
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
          Loading DeforestWatch...
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
            Track vegetation changes with Google Earth Engine, drone imagery,
            NDVI analysis, and automated email alerts - all in real time.
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
              Start Monitoring -&gt;
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
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: "2.5rem" }}
        >
          <span
            style={{
              fontSize: "0.75rem",
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
          <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>
            Start <span className="grad-text">Monitoring</span>
          </h2>
          <p style={{ color: "#9090b0", maxWidth: "500px", margin: "0 auto", fontSize: "0.95rem" }}>
            Select your area, configure parameters, and run deforestation analysis
          </p>
        </motion.div>

        {/* ===== STEP INDICATOR BAR ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0",
            marginBottom: "2.5rem",
          }}
        >
          {[
            { num: 1, label: "Select AOI", done: !!aoi },
            { num: 2, label: "Configure", done: !!aoi },
            { num: 3, label: "Analyze", done: !!result },
            { num: 4, label: "Results", done: !!result },
          ].map((step, idx) => (
            <div key={step.num} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    background: step.done
                      ? "linear-gradient(135deg, #00d4aa, #00a8e8)"
                      : loading && step.num === 3
                      ? "rgba(0,168,232,0.15)"
                      : "rgba(255,255,255,0.04)",
                    color: step.done ? "#000" : loading && step.num === 3 ? "#00a8e8" : "#555577",
                    border: step.done
                      ? "none"
                      : loading && step.num === 3
                      ? "1px solid rgba(0,168,232,0.3)"
                      : "1px solid rgba(255,255,255,0.08)",
                    transition: "all 0.3s ease",
                  }}
                >
                  {step.done ? "OK" : step.num}
                </div>
                <span style={{ fontSize: "0.65rem", color: step.done ? "#e8e8f0" : "#555577", fontWeight: 500 }}>
                  {step.label}
                </span>
              </div>
              {idx < 3 && (
                <div
                  style={{
                    width: "60px",
                    height: "2px",
                    background: step.done
                      ? "linear-gradient(90deg, #00d4aa, #00a8e8)"
                      : "rgba(255,255,255,0.06)",
                    margin: "0 0.5rem",
                    marginBottom: "1.2rem",
                    borderRadius: "1px",
                    transition: "background 0.3s ease",
                  }}
                />
              )}
            </div>
          ))}
        </motion.div>

        {/* ===== AOI MAP - FULL WIDTH ===== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          style={{
            padding: "1.5rem",
            borderRadius: "16px",
            background: "rgba(10, 10, 30, 0.55)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #00d4aa22, #00a8e822)",
                  border: "1px solid rgba(0,212,170,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.85rem",
                }}
              >
                MAP
              </div>
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Area of Interest</h3>
                <p style={{ fontSize: "0.7rem", color: "#555577", margin: 0 }}>
                  Draw a polygon on the satellite map or paste GeoJSON
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button
                onClick={() => setAOIMode("map")}
                style={{
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.72rem",
                  borderRadius: "6px",
                  background: aoiMode === "map" ? "rgba(0,212,170,0.15)" : "rgba(255,255,255,0.03)",
                  color: aoiMode === "map" ? "#00d4aa" : "#555577",
                  border: aoiMode === "map" ? "1px solid rgba(0,212,170,0.25)" : "1px solid rgba(255,255,255,0.06)",
                  fontWeight: 600,
                  boxShadow: "none",
                }}
              >
                Map
              </button>
              <button
                onClick={() => setAOIMode("geojson")}
                style={{
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.72rem",
                  borderRadius: "6px",
                  background: aoiMode === "geojson" ? "rgba(0,212,170,0.15)" : "rgba(255,255,255,0.03)",
                  color: aoiMode === "geojson" ? "#00d4aa" : "#555577",
                  border: aoiMode === "geojson" ? "1px solid rgba(0,212,170,0.25)" : "1px solid rgba(255,255,255,0.06)",
                  fontWeight: 600,
                  boxShadow: "none",
                }}
              >
                {"{ }"} GeoJSON
              </button>
            </div>
          </div>

          {aoiMode === "map" && <MapAOI onAOISelect={setAOI} />}

          {aoiMode === "geojson" && (
            <div>
              <textarea
                placeholder='Paste GeoJSON: {"type":"Polygon","coordinates":[[[lng,lat],...]]}'
                value={geojsonInput}
                onChange={(e) => setGeojsonInput(e.target.value)}
                style={{ height: "120px", resize: "vertical", fontSize: "0.8rem", fontFamily: "monospace" }}
              />
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  onClick={() => {
                    try {
                      setGeojsonError(null);
                      const parsed = JSON.parse(geojsonInput);
                      if (parsed.type === "Polygon" && Array.isArray(parsed.coordinates)) {
                        setAOI(parsed.coordinates);
                      } else {
                        throw new Error("Must be a GeoJSON Polygon");
                      }
                    } catch (err: any) {
                      setGeojsonError(err.message || "Invalid GeoJSON");
                    }
                  }}
                  style={{ fontSize: "0.8rem", padding: "0.4rem 1rem" }}
                >
                  Parse & Apply
                </button>
              </div>
              {geojsonError && (
                <div style={{ marginTop: "0.4rem", color: "#ef4444", fontSize: "0.78rem" }}>
                  Warning: {geojsonError}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ===== CONFIG ROW - 2 COLUMNS ===== */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
          {/* Left: Time Period + Email */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            viewport={{ once: true }}
            style={{
              padding: "1.5rem",
              borderRadius: "16px",
              background: "rgba(10, 10, 30, 0.55)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            {/* Time Period */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.85rem" }}>Year</span>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#e8e8f0" }}>Time Period</span>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.7rem", color: "#555577", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
                    Baseline
                  </label>
                  <select
                    value={pastYear}
                    onChange={(e) => setPastYear(Number(e.target.value))}
                    style={{ fontSize: "0.82rem", padding: "0.5rem 0.75rem" }}
                  >
                    {[2010, 2012, 2014, 2016, 2018, 2020].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div style={{ color: "#555577", fontSize: "1rem", paddingTop: "1.2rem" }}>-&gt;</div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.7rem", color: "#555577", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
                    Current
                  </label>
                  <select
                    value={presentYear}
                    onChange={(e) => setPresentYear(Number(e.target.value))}
                    style={{ fontSize: "0.82rem", padding: "0.5rem 0.75rem" }}
                  >
                    {[2020, 2021, 2022, 2023, 2024].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: "0.5rem", fontSize: "0.7rem", color: "#555577" }}>
                Comparing {presentYear - pastYear} years of vegetation change
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "rgba(255,255,255,0.04)" }} />

            {/* Email */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
                <span style={{ fontSize: "0.85rem" }}>Email</span>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#e8e8f0" }}>Email Report</span>
              </div>
              <input
                type="email"
                placeholder="your@email.com"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                style={{ fontSize: "0.82rem", padding: "0.5rem 0.75rem" }}
              />
              <div style={{ marginTop: "0.4rem", fontSize: "0.68rem", color: "#555577", lineHeight: 1.5 }}>
                Receive a detailed HTML report with analysis results when processing completes.
              </div>
            </div>
          </motion.div>

          {/* Right: Drone Upload */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            style={{
              padding: "1.5rem",
              borderRadius: "16px",
              background: "rgba(10, 10, 30, 0.55)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem" }}>Drone</span>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#e8e8f0" }}>Drone Imagery</span>
              <span style={{ fontSize: "0.62rem", color: "#555577", background: "rgba(255,255,255,0.04)", padding: "0.15rem 0.5rem", borderRadius: "99px", marginLeft: "0.25rem" }}>
                Optional
              </span>
            </div>

            <label
              style={{
                flex: 1,
                padding: "2rem 1rem",
                borderRadius: "12px",
                border: droneFile
                  ? "2px solid rgba(34,197,94,0.3)"
                  : "2px dashed rgba(255,255,255,0.08)",
                background: droneFile
                  ? "rgba(34,197,94,0.04)"
                  : "rgba(255,255,255,0.01)",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              <input
                type="file"
                accept=".tif,.tiff,.jpg,.jpeg"
                onChange={(e) => setDroneFile(e.target.files?.[0] ?? null)}
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
              />
              <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{droneFile ? "[OK]" : "[+]"}</div>
              <div style={{ fontSize: "0.82rem", color: droneFile ? "#22c55e" : "#9090b0", fontWeight: droneFile ? 600 : 400 }}>
                {droneFile ? droneFile.name : "Click to upload .tif or .jpg"}
              </div>
              {droneFile && (
                <div style={{ fontSize: "0.68rem", color: "#555577" }}>
                  {(droneFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </label>

            <button
              onClick={handleDroneUpload}
              disabled={!droneFile}
              style={{
                marginTop: "0.75rem",
                padding: "0.5rem 1rem",
                fontSize: "0.8rem",
              }}
            >
              Upload to Server
            </button>

            <AnimatePresence>
              {uploadStatus && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.78rem",
                    textAlign: "center",
                    color: uploadStatus.includes("[Done]") ? "#22c55e" : uploadStatus.includes("[Error]") ? "#ef4444" : "#00a8e8",
                  }}
                >
                  {uploadStatus}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ===== RUN ANALYSIS ===== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          viewport={{ once: true }}
          style={{
            padding: "1.5rem 2rem",
            borderRadius: "16px",
            background: "rgba(10, 10, 30, 0.55)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            {/* Config Summary */}
            <div style={{ flex: 1, minWidth: "250px" }}>
              <div style={{ fontSize: "0.7rem", color: "#555577", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: "0.5rem" }}>
                Analysis Configuration
              </div>
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: aoi ? "#22c55e" : "#555577", display: "inline-block" }} />
                  <span style={{ color: aoi ? "#e8e8f0" : "#555577" }}>
                    AOI {aoi ? `(${aoi[0].length} pts)` : "-"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00d4aa", display: "inline-block" }} />
                  <span style={{ color: "#e8e8f0" }}>{pastYear} -&gt; {presentYear}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: droneFileId ? "#22c55e" : "#555577", display: "inline-block" }} />
                  <span style={{ color: droneFileId ? "#e8e8f0" : "#555577" }}>
                    Drone {droneFileId ? "Yes" : "-"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: notifyEmail ? "#00a8e8" : "#555577", display: "inline-block" }} />
                  <span style={{ color: notifyEmail ? "#e8e8f0" : "#555577" }}>
                    Email {notifyEmail ? "Yes" : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Run Button */}
            <motion.button
              onClick={runAnalysis}
              disabled={!aoi || loading}
              whileHover={aoi && !loading ? { scale: 1.03, y: -1 } : {}}
              whileTap={aoi && !loading ? { scale: 0.97 } : {}}
              style={{
                padding: "0.75rem 2.5rem",
                fontSize: "0.95rem",
                fontWeight: 700,
                borderRadius: "12px",
                background: loading
                  ? "rgba(0,168,232,0.12)"
                  : aoi
                  ? "linear-gradient(135deg, #00d4aa, #00a8e8)"
                  : "#1a1a2e",
                color: loading ? "#00a8e8" : !aoi ? "#3a3a55" : "#000",
                border: loading ? "1px solid rgba(0,168,232,0.3)" : "none",
                boxShadow: aoi && !loading ? "0 8px 32px rgba(0,212,170,0.3)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? (
                <>
                  <motion.svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </motion.svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  Run Analysis
                </>
              )}
            </motion.button>
          </div>

          {/* Progress / Error */}
          <AnimatePresence>
            {progress && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  background: "rgba(0,168,232,0.06)",
                  border: "1px solid rgba(0,168,232,0.12)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#00a8e8",
                  }}
                />
                <span style={{ fontSize: "0.82rem", color: "#00a8e8", fontWeight: 500 }}>{progress}</span>
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.82rem",
                  color: "#ef4444",
                  fontWeight: 500,
                }}
              >
                <span>Warning:</span> {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ===== RESULTS ===== */}
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

