"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const features = [
  {
    icon: "🛰️",
    title: "Satellite Analysis",
    description:
      "Leverage Google Earth Engine to compute NDVI vegetation indices across any region on Earth, comparing historical and present-day satellite imagery.",
    gradient: "linear-gradient(135deg, #00d4aa, #00a8e8)",
  },
  {
    icon: "🚁",
    title: "Drone Integration",
    description:
      "Upload high-resolution drone TIF imagery for precise vegetation mapping. Our system downscales and cross-references drone data against satellite baselines.",
    gradient: "linear-gradient(135deg, #22c55e, #16a34a)",
  },
  {
    icon: "📧",
    title: "Email Alerts",
    description:
      "Get instant email notifications when deforestation is detected. Rich HTML reports with vegetation statistics delivered to your inbox.",
    gradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
  },
  {
    icon: "🗺️",
    title: "NDVI Difference Maps",
    description:
      "Interactive visual overlay showing exactly where vegetation has increased (green) and decreased (red) between your selected time periods.",
    gradient: "linear-gradient(135deg, #7c3aed, #a855f7)",
  },
];

export default function FeaturesSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);

  return (
    <section
      ref={containerRef}
      id="features"
      style={{
        padding: "8rem 2rem",
        maxWidth: "1200px",
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* Section Title */}
      <motion.div
        style={{ textAlign: "center", marginBottom: "4rem" }}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
      >
        <motion.span
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
          CAPABILITIES
        </motion.span>
        <h2
          style={{
            fontSize: "2.8rem",
            fontWeight: 800,
            marginBottom: "1rem",
            lineHeight: 1.2,
          }}
        >
          Powerful{" "}
          <span className="grad-text">Monitoring Tools</span>
        </h2>
        <p
          style={{
            color: "#9090b0",
            maxWidth: "600px",
            margin: "0 auto",
            fontSize: "1.05rem",
            lineHeight: 1.7,
          }}
        >
          From satellite to drone, our platform provides comprehensive
          vegetation analysis with real-time alerts.
        </p>
      </motion.div>

      {/* Feature Cards Grid */}
      <motion.div
        style={{ y }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: idx * 0.12,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              viewport={{ once: true }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="glass-card"
              style={{
                padding: "2rem",
                cursor: "default",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Glow accent */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: feature.gradient,
                  borderRadius: "99px 99px 0 0",
                }}
              />

              {/* Icon */}
              <motion.div
                style={{
                  fontSize: "2.5rem",
                  marginBottom: "1rem",
                  display: "inline-block",
                }}
                whileHover={{ scale: 1.2, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {feature.icon}
              </motion.div>

              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  marginBottom: "0.75rem",
                  color: "#e8e8f0",
                }}
              >
                {feature.title}
              </h3>

              <p
                style={{
                  color: "#9090b0",
                  fontSize: "0.9rem",
                  lineHeight: 1.65,
                }}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
