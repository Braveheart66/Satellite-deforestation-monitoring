"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    num: "01",
    title: "Define Area of Interest",
    description:
      "Draw a polygon on the interactive map or paste GeoJSON coordinates to pinpoint the exact region you want to monitor for deforestation.",
    icon: "📍",
    color: "#00d4aa",
  },
  {
    num: "02",
    title: "Upload Drone Imagery",
    description:
      "Optionally upload high-resolution .tif drone images for centimeter-level vegetation analysis, cross-referenced with satellite data.",
    icon: "🚁",
    color: "#00a8e8",
  },
  {
    num: "03",
    title: "Select Time Period",
    description:
      "Choose past and present years to compare. Our engine fetches Landsat/Sentinel data and computes NDVI vegetation indices for each period.",
    icon: "📅",
    color: "#7c3aed",
  },
  {
    num: "04",
    title: "Get Results & Alerts",
    description:
      "View detailed vegetation change maps, receive email reports, and monitor deforestation trends with interactive data visualizations.",
    icon: "📊",
    color: "#f59e0b",
  },
];

export default function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const lineHeight = useTransform(scrollYProgress, [0.1, 0.8], ["0%", "100%"]);

  return (
    <section
      ref={containerRef}
      id="how-it-works"
      style={{
        padding: "8rem 2rem",
        maxWidth: "900px",
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* Section Title */}
      <motion.div
        style={{ textAlign: "center", marginBottom: "5rem" }}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
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
          WORKFLOW
        </span>
        <h2
          style={{
            fontSize: "2.8rem",
            fontWeight: 800,
            marginBottom: "1rem",
          }}
        >
          How It <span className="grad-text">Works</span>
        </h2>
        <p
          style={{
            color: "#9090b0",
            maxWidth: "500px",
            margin: "0 auto",
            fontSize: "1.05rem",
            lineHeight: 1.7,
          }}
        >
          Four simple steps to monitor deforestation anywhere on Earth
        </p>
      </motion.div>

      {/* Timeline */}
      <div style={{ position: "relative" }}>
        {/* Timeline Line */}
        <div
          style={{
            position: "absolute",
            left: "28px",
            top: 0,
            bottom: 0,
            width: "2px",
            background: "rgba(255,255,255,0.06)",
          }}
        >
          <motion.div
            style={{
              width: "100%",
              height: lineHeight,
              background:
                "linear-gradient(180deg, #00d4aa, #00a8e8, #7c3aed, #f59e0b)",
              borderRadius: "99px",
            }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, idx) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.6,
              delay: idx * 0.15,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            viewport={{ once: true, margin: "-50px" }}
            style={{
              display: "flex",
              gap: "1.5rem",
              marginBottom: idx < steps.length - 1 ? "3rem" : 0,
              alignItems: "flex-start",
            }}
          >
            {/* Step Number Dot */}
            <motion.div
              whileHover={{ scale: 1.2 }}
              style={{
                minWidth: "56px",
                height: "56px",
                borderRadius: "50%",
                background: `${step.color}18`,
                border: `2px solid ${step.color}44`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                position: "relative",
                zIndex: 1,
                flexShrink: 0,
              }}
            >
              {step.icon}
            </motion.div>

            {/* Step Content */}
            <div
              className="glass-card"
              style={{
                padding: "1.5rem 2rem",
                flex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: step.color,
                    fontFamily: "var(--font-heading)",
                  }}
                >
                  STEP {step.num}
                </span>
              </div>
              <h3
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  marginBottom: "0.5rem",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  color: "#9090b0",
                  fontSize: "0.9rem",
                  lineHeight: 1.65,
                }}
              >
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
