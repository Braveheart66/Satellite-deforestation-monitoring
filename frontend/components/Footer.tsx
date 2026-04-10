"use client";

import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer
      style={{
        padding: "4rem 2rem 2rem",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(5,5,16,0.6)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "3rem",
          marginBottom: "3rem",
        }}
      >
        {/* Brand */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <span style={{ fontSize: "1.4rem" }}>🌿</span>
            <span
              className="grad-text"
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                fontSize: "1.1rem",
              }}
            >
              DeforestWatch
            </span>
          </div>
          <p
            style={{
              color: "#555577",
              fontSize: "0.85rem",
              lineHeight: 1.6,
              maxWidth: "280px",
            }}
          >
            AI-powered satellite deforestation monitoring. Protect our forests
            with real-time data analysis and alerts.
          </p>
        </div>

        {/* Technology */}
        <div>
          <h4
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#e8e8f0",
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "1rem",
            }}
          >
            Technology
          </h4>
          <ul
            style={{
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {[
              "Google Earth Engine",
              "Landsat & Sentinel",
              "NDVI Analysis",
              "Drone TIFF Processing",
            ].map((item) => (
              <li
                key={item}
                style={{ color: "#555577", fontSize: "0.85rem" }}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h4
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#e8e8f0",
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "1rem",
            }}
          >
            Resources
          </h4>
          <ul
            style={{
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {[
              "Documentation",
              "API Reference",
              "Setup Guide",
              "Email Configuration",
            ].map((item) => (
              <li
                key={item}
                style={{ color: "#555577", fontSize: "0.85rem" }}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#e8e8f0",
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "1rem",
            }}
          >
            Contact
          </h4>
          <p
            style={{
              color: "#555577",
              fontSize: "0.85rem",
              lineHeight: 1.8,
            }}
          >
            Alerts sent to:
            <br />
            <span style={{ color: "#00d4aa" }}>
              shivamsinghraghuvanshi1234@gmail.com
            </span>
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <p style={{ color: "#3a3a55", fontSize: "0.8rem" }}>
          © 2026 DeforestWatch. Powered by Earth Engine & Drone Imagery.
        </p>
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            fontSize: "0.8rem",
          }}
        >
          <span style={{ color: "#3a3a55" }}>Privacy</span>
          <span style={{ color: "#3a3a55" }}>Terms</span>
        </div>
      </motion.div>
    </footer>
  );
}
