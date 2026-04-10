"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Monitor", href: "#monitor" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "0 2rem",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: scrolled
          ? "rgba(5, 5, 16, 0.85)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.06)"
          : "1px solid transparent",
        transition: "background 0.3s ease, backdrop-filter 0.3s ease, border-color 0.3s ease",
      }}
    >
      {/* Logo */}
      <motion.a
        href="#"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          textDecoration: "none",
        }}
        whileHover={{ scale: 1.03 }}
      >
        <span style={{ fontSize: "1.4rem" }}>🌿</span>
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            fontSize: "1.1rem",
            letterSpacing: "-0.02em",
          }}
          className="grad-text"
        >
          DeforestWatch
        </span>
      </motion.a>

      {/* Nav Links */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        {navLinks.map((link) => (
          <motion.a
            key={link.label}
            href={link.href}
            style={{
              color: "#9090b0",
              fontSize: "0.85rem",
              fontWeight: 500,
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            whileHover={{ color: "#00d4aa", y: -1 }}
          >
            {link.label}
          </motion.a>
        ))}

        <motion.a
          href="#monitor"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          style={{
            padding: "0.5rem 1.2rem",
            background: "linear-gradient(135deg, #00d4aa, #00a8e8)",
            color: "#000",
            fontWeight: 600,
            fontSize: "0.85rem",
            borderRadius: "8px",
            textDecoration: "none",
            boxShadow: "0 4px 16px rgba(0, 212, 170, 0.2)",
          }}
        >
          Start Monitoring
        </motion.a>
      </div>
    </motion.nav>
  );
}
