"use client";

import { useState, useEffect } from "react";
import MapAOI from "../components/MapAOI";
import ResultsPanel from "@/components/ResultsPanel";

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

  // SMS
  const [phoneNumber, setPhoneNumber] = useState("");

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
      setUploadStatus(`Successfully uploaded: ${data.filename}`);
    } catch (err: any) {
      setUploadStatus(`Upload failed: ${err?.message ?? "Unknown error"}`);
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
        phone_number: phoneNumber || undefined,
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
      <div style={containerStyle}>
        <h1>Loading application...</h1>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={{ marginBottom: "0.5rem" }}>Drone-Based Deforestation Monitor</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Multi-source analysis: Past Satellite to Present Satellite to Drone
      </p>

      <div style={sectionStyle}>
        <h3 style={{ marginBottom: "1rem" }}>Area of Interest</h3>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <button
            onClick={() => setAOIMode("map")}
            style={{
              ...buttonStyle,
              background: aoiMode === "map" ? "#000" : "#ccc",
            }}
          >
            Draw on Map
          </button>

          <button
            onClick={() => setAOIMode("geojson")}
            style={{
              ...buttonStyle,
              background: aoiMode === "geojson" ? "#000" : "#ccc",
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
              style={geojsonStyle}
            />
            <button
              style={{ marginTop: "1rem", ...buttonStyle }}
              onClick={() => {
                try {
                  setGeojsonError(null);
                  const parsed = JSON.parse(geojsonInput);
                  if (parsed.type === "Polygon" && Array.isArray(parsed.coordinates)) {
                    setAOI(parsed.coordinates);
                  } else {
                    throw new Error("Invalid GeoJSON Polygon");
                  }
                } catch (err: any) {
                  setGeojsonError(err.message || "Invalid GeoJSON");
                }
              }}
            >
              Use GeoJSON
            </button>
            {geojsonError && (
              <div style={{ marginTop: "0.5rem", color: "red" }}>
                {geojsonError}
              </div>
            )}
          </>
        )}

        {aoi && (
          <div style={{ marginTop: "1rem", color: "green" }}>
            AOI selected with {aoi[0].length} points
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <h3 style={{ marginBottom: "1rem" }}>Upload Drone Image (optional)</h3>
        <input
          type="file"
          accept=".tif,.tiff"
          onChange={(e) => setDroneFile(e.target.files?.[0] ?? null)}
        />
        <button
          onClick={handleDroneUpload}
          disabled={!droneFile}
          style={{ ...buttonStyle, marginTop: "1rem" }}
        >
          Upload
        </button>
        {uploadStatus && <div style={{ marginTop: "1rem" }}>{uploadStatus}</div>}
      </div>

      <div style={sectionStyle}>
        <h3 style={{ marginBottom: "1rem" }}>SMS notifications (optional)</h3>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>Phone number</label>
        <input
          type="tel"
          placeholder="+1234567890"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
            maxWidth: "300px",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={sectionStyle}>
        <h3 style={{ marginBottom: "1rem" }}>Time period</h3>
        <div style={{ display: "flex", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Past year</label>
            <select
              value={pastYear}
              onChange={(e) => setPastYear(Number(e.target.value))}
              style={{ padding: "0.5rem" }}
            >
              {[2010, 2012, 2014, 2016, 2018, 2020].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Present year</label>
            <select
              value={presentYear}
              onChange={(e) => setPresentYear(Number(e.target.value))}
              style={{ padding: "0.5rem" }}
            >
              {[2020, 2021, 2022, 2023, 2024].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <button
          onClick={runAnalysis}
          disabled={!aoi || loading}
          style={{
            ...buttonStyle,
            background: loading ? "#666" : aoi ? "#000" : "#ccc",
            cursor: aoi && !loading ? "pointer" : "not-allowed",
          }}
        >
          {loading ? "Processing..." : "Run analysis"}
        </button>

        {progress && <div style={{ marginTop: "1rem", color: "#0066cc" }}>{progress}</div>}
        {error && <div style={{ marginTop: "1rem", color: "red" }}>{error}</div>}
      </div>

      {result && aoi && <ResultsPanel result={result} aoi={aoi} />}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  padding: "2rem",
  maxWidth: "1200px",
  margin: "0 auto",
  fontFamily: "system-ui, sans-serif",
};

const sectionStyle: React.CSSProperties = {
  marginBottom: "2rem",
  padding: "1.5rem",
  background: "#fff",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const buttonStyle: React.CSSProperties = {
  padding: "0.75rem 1.5rem",
  background: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const geojsonStyle: React.CSSProperties = {
  width: "100%",
  height: "140px",
  background: "#f7f7f7",
  color: "#111",
  padding: "1rem",
  borderRadius: "8px",
  border: "1px solid #ddd",
};
