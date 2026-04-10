"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

function AnimatedCounter({
  end,
  duration = 2,
  suffix = "",
  prefix = "",
}: {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    const animate = (time: number) => {
      if (startTime === undefined) startTime = time;
      const progress = Math.min((time - startTime) / (duration * 1000), 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

const stats = [
  {
    value: 10000,
    suffix: "+",
    label: "Hectares Monitored",
    icon: "🌍",
    color: "#00d4aa",
  },
  {
    value: 15,
    suffix: "+",
    label: "Satellite Years",
    icon: "🛰️",
    color: "#00a8e8",
  },
  {
    value: 99,
    suffix: "%",
    label: "NDVI Accuracy",
    icon: "🎯",
    color: "#7c3aed",
  },
  {
    value: 5,
    suffix: "min",
    prefix: "<",
    label: "Alert Delivery",
    icon: "⚡",
    color: "#f59e0b",
  },
];

export default function StatsSection() {
  return (
    <section
      style={{
        padding: "6rem 2rem",
        background:
          "linear-gradient(180deg, rgba(0,212,170,0.02) 0%, transparent 100%)",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "2rem",
        }}
      >
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -6 }}
            style={{
              textAlign: "center",
              padding: "2rem 1.5rem",
              borderRadius: "16px",
              background: "rgba(15, 15, 42, 0.4)",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>
              {stat.icon}
            </div>
            <div
              style={{
                fontSize: "2.2rem",
                fontWeight: 800,
                fontFamily: "var(--font-heading)",
                color: stat.color,
                marginBottom: "0.25rem",
              }}
            >
              <AnimatedCounter
                end={stat.value}
                suffix={stat.suffix}
                prefix={stat.prefix || ""}
              />
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#9090b0",
                fontWeight: 500,
              }}
            >
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
