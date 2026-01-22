"use client";

import { useState } from "react";
import MapAOI from "../components/MapAOI";

/* =========================================================
   MAIN PAGE COMPONENT
========================================================= */
export default function DeforestationMonitor() {
  /* ---------------- STATE ---------------- */
  const [aoi, setAOI] = useState<any>(null);
  const [geojsonInput, setGeojsonInput] = useState("");
  const [aoiMode, setAOIMode] = useState<"map" | "geojson">("map");
  const [geojsonError, setGeojsonError] = useState<string | null>(null);



  const [pastYear, setPastYear] = useState<number>(2016);
  const [presentYear, setPresentYear] = useState<number>(2024);

  const [droneFile, setDroneFile] = useState<File | null>(null);
  const [droneFileId, setDroneFileId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

  /* =========================================================
     DRONE FILE UPLOAD
  ========================================================= */
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
      setUploadStatus(
        `Uploaded: ${data.filename} (${data.size_mb} MB)`
      );
    } catch (err: any) {
      setUploadStatus(`Upload failed: ${err.message}`);
    }
  }

  /* =========================================================
     RUN ANALYSIS
  ========================================================= */
  async function runAnalysis() {
    if (!aoi) {
      setError("Please draw an area of interest on the map");
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
      setProgress(`Job submitted (ID: ${job_id.slice(0, 8)}…)`);

      const pollInterval = setInterval(async () => {
        const pollResponse = await fetch(`${API_BASE}/jobs/${job_id}`);
        const jobData = await pollResponse.json();

        if (jobData.status === "completed") {
          setResult(jobData);
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
      setError(err.message);
      setLoading(false);
      setProgress("");
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <div style={containerStyle}>
      <h1 style={{ marginBottom: "0.5rem" }}>
        🛰️ Drone-Based Deforestation Monitor
      </h1>

      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Multi-source analysis: Past Satellite → Present Satellite → Drone
      </p>

      {/* ================= STEP 1 ================= */}
      <section className="card fade-in" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
      <h2 className="section-title">Step 1: Select Area of Interest</h2>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <button onClick={() => setAOIMode("map")} className="btn">
          🗺️ Draw on Map
        </button>
        <button onClick={() => setAOIMode("geojson")} className="btn">
          🧾 Paste GeoJSON
        </button>
      </div>

      {aoiMode === "map" && (
        <MapAOI onAOISelect={setAOI} />
      )}

      {aoiMode === "geojson" && (
        <>
          <textarea
            placeholder="Paste GeoJSON Polygon coordinates here"
            value={geojsonInput}
            onChange={(e) => setGeojsonInput(e.target.value)}
            style={{
              width: "100%",
              height: "140px",
              background: "#000",
              color: "#fff",
              borderRadius: "8px",
              padding: "1rem",
              border: "1px solid #333",
            }}
          />
          
          <button
          style={{ marginTop: "1rem" }}
          onClick={() => {
            try {
              setGeojsonError(null);

              const parsed = JSON.parse(geojsonInput);

              // Accept both full GeoJSON and raw coordinates
              let coordinates: number[][][];

              if (parsed.type === "Polygon" && parsed.coordinates) {
                coordinates = parsed.coordinates;
              } else if (Array.isArray(parsed)) {
                coordinates = parsed;
              } else {
                throw new Error("Invalid GeoJSON format");
              }

              // Basic validation
              if (
                !Array.isArray(coordinates) ||
                !Array.isArray(coordinates[0]) ||
                coordinates[0].length < 3
              ) {
                throw new Error("Invalid polygon coordinates");
              }

              setAOI(coordinates);

            } catch (err: any) {
              setGeojsonError(err.message || "Invalid GeoJSON");
            }
          }}
        >
          ✅ Use GeoJSON AOI
        </button>
        {geojsonError && (
        <div style={{ marginTop: "0.5rem", color: "red" }}>
          ❌ {geojsonError}
        </div>
      )}


        </>
      )}

      {aoi && (
        <div style={{ marginTop: "1rem", color: "var(--accent)" }}>
          AOI selected with {aoi[0].length} points
        </div>
      )}
    </section>


      {/* ================= STEP 2 ================= */}
      <section style={sectionStyle}>
        <h2>Step 2: Upload Drone Image (Optional)</h2>

        <input
          type="file"
          accept=".tif,.tiff"
          onChange={(e) =>
            setDroneFile(e.target.files?.[0] || null)
          }
        />

        <button
          onClick={handleDroneUpload}
          disabled={!droneFile}
          style={buttonStyle}
        >
          Upload
        </button>

        {uploadStatus && (
          <div style={{ marginTop: "1rem" }}>{uploadStatus}</div>
        )}
      </section>

      {/* ================= STEP 3 ================= */}
      <section style={sectionStyle}>
        <h2>Step 3: Select Time Period</h2>

        <div style={{ display: "flex", gap: "1rem" }}>
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

          <select
            value={presentYear}
            onChange={(e) =>
              setPresentYear(Number(e.target.value))
            }
          >
            {[2020, 2021, 2022, 2023, 2024].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* ================= STEP 4 ================= */}
      <section style={sectionStyle}>
        <button
          onClick={runAnalysis}
          disabled={!aoi || loading}
          style={{
            ...buttonStyle,
            background: loading ? "#666" : "#000",
          }}
        >
          {loading ? "Processing…" : "Run Analysis"}
        </button>

        {progress && (
          <div style={{ marginTop: "1rem", color: "#0066cc" }}>
            {progress}
          </div>
        )}

        {error && (
          <div style={{ marginTop: "1rem", color: "red" }}>
            {error}
          </div>
        )}
      </section>

      {/* ================= RESULTS ================= */}
      {result && (
        <section style={{ ...sectionStyle, background: "#f9fafb" }}>
          <h2>📊 Analysis Results</h2>

          {result.satellite_comparison ? (
            <div style={resultCardStyle}>
              <StatBox
                label="Past Vegetation Cover"
                value={`${result.satellite_comparison.past_cover_ha} ha`}
                color="#27ae60"
              />
              <StatBox
                label="Present Vegetation Cover"
                value={`${result.satellite_comparison.present_cover_ha} ha`}
                color="#e67e22"
              />
            </div>
          ) : (
            <div style={infoBoxStyle}>
              No significant vegetation detected in this AOI.
            </div>
          )}

          {result.summary && (
            <div style={resultCardStyle}>
              <strong>Total Loss:</strong>{" "}
              {result.summary.total_loss_ha} ha (
              {result.summary.total_loss_pct}%)
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/* =========================================================
   HELPER COMPONENT
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
    <div style={statBoxStyle}>
      <div style={{ fontSize: "0.85rem", color: "#666" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color }}>
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */
const containerStyle: React.CSSProperties = {
  padding: "2rem",
  maxWidth: "1200px",
  margin: "0 auto",
  fontFamily: "system-ui",
};

const sectionStyle: React.CSSProperties = {
  marginBottom: "2rem",
  padding: "1.5rem",
  background: "#fff",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};

const buttonStyle: React.CSSProperties = {
  padding: "0.75rem 1.5rem",
  background: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const infoBoxStyle: React.CSSProperties = {
  marginTop: "1rem",
  padding: "1rem",
  background: "#f0f9ff",
  borderRadius: "6px",
};

const resultCardStyle: React.CSSProperties = {
  marginTop: "1rem",
  padding: "1rem",
  background: "#fff",
  borderRadius: "6px",
};

const statBoxStyle: React.CSSProperties = {
  padding: "1rem",
  background: "#fafafa",
  borderRadius: "6px",
  border: "1px solid #ddd",
};
