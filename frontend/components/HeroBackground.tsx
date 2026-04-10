"use client";

import { useRef, useEffect, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
}

interface GlobePoint {
  x: number;
  y: number;
  z: number;
  screenX: number;
  screenY: number;
  size: number;
  isTree: boolean;
}

export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  const initAndAnimate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    let width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    let height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const logicalW = canvas.offsetWidth;
    const logicalH = canvas.offsetHeight;

    // Floating particles
    const particles: Particle[] = [];
    const particleCount = 120;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * logicalW,
        y: Math.random() * logicalH,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        hue: Math.random() > 0.5 ? 160 : 195, // teal or blue
      });
    }

    // Globe wireframe points
    const globePoints: GlobePoint[] = [];
    const globeRadius = Math.min(logicalW, logicalH) * 0.22;
    const globeCx = logicalW / 2;
    const globeCy = logicalH / 2;

    // Latitude/longitude wireframe
    for (let lat = -80; lat <= 80; lat += 15) {
      for (let lon = 0; lon < 360; lon += 8) {
        const latRad = (lat * Math.PI) / 180;
        const lonRad = (lon * Math.PI) / 180;
        globePoints.push({
          x: Math.cos(latRad) * Math.cos(lonRad),
          y: Math.sin(latRad),
          z: Math.cos(latRad) * Math.sin(lonRad),
          screenX: 0,
          screenY: 0,
          size: 1.2,
          isTree: Math.random() > 0.7 && lat > -40 && lat < 60,
        });
      }
    }

    // Connection lines data
    const connectionDistance = 100;

    function animate() {
      timeRef.current += 0.008;
      const t = timeRef.current;

      ctx.clearRect(0, 0, logicalW, logicalH);

      // === DRAW GLOBE ===
      const rotY = t * 0.4;
      const rotX = Math.sin(t * 0.15) * 0.15;

      // Update globe point screen positions
      for (const pt of globePoints) {
        // Rotate Y
        const x1 = pt.x * Math.cos(rotY) + pt.z * Math.sin(rotY);
        const z1 = -pt.x * Math.sin(rotY) + pt.z * Math.cos(rotY);
        // Rotate X
        const y1 = pt.y * Math.cos(rotX) - z1 * Math.sin(rotX);
        const z2 = pt.y * Math.sin(rotX) + z1 * Math.cos(rotX);

        pt.screenX = globeCx + x1 * globeRadius;
        pt.screenY = globeCy - y1 * globeRadius;

        if (z2 > -0.05) {
          const alpha = Math.max(0, Math.min(1, (z2 + 0.5) * 0.8));

          if (pt.isTree) {
            ctx.beginPath();
            ctx.arc(pt.screenX, pt.screenY, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(34, 197, 94, ${alpha * 0.8})`;
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(pt.screenX, pt.screenY, pt.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 212, 170, ${alpha * 0.25})`;
            ctx.fill();
          }
        }
      }

      // Draw wireframe connections on globe
      ctx.strokeStyle = "rgba(0, 212, 170, 0.04)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < globePoints.length; i++) {
        for (let j = i + 1; j < globePoints.length; j++) {
          const dx = globePoints[i].screenX - globePoints[j].screenX;
          const dy = globePoints[i].screenY - globePoints[j].screenY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 25) {
            ctx.beginPath();
            ctx.moveTo(globePoints[i].screenX, globePoints[i].screenY);
            ctx.lineTo(globePoints[j].screenX, globePoints[j].screenY);
            ctx.stroke();
          }
        }
      }

      // === DRAW ORBIT RINGS ===
      for (let ring = 0; ring < 3; ring++) {
        const ringRadius = globeRadius * (1.3 + ring * 0.2);
        const ringAlpha = 0.04 - ring * 0.01;
        ctx.beginPath();
        ctx.ellipse(
          globeCx,
          globeCy,
          ringRadius,
          ringRadius * 0.3,
          ring * 0.3 + t * 0.1,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = `rgba(0, 168, 232, ${ringAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Satellite dot on each ring
        const satAngle = t * (0.5 + ring * 0.2);
        const satX = globeCx + Math.cos(satAngle) * ringRadius;
        const satY =
          globeCy + Math.sin(satAngle) * ringRadius * 0.3;
        ctx.beginPath();
        ctx.arc(satX, satY, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 168, 232, 0.7)`;
        ctx.fill();

        // Satellite glow
        ctx.beginPath();
        ctx.arc(satX, satY, 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 168, 232, 0.1)`;
        ctx.fill();
      }

      // === DRAW PARTICLES ===
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < 0) p.x = logicalW;
        if (p.x > logicalW) p.x = 0;
        if (p.y < 0) p.y = logicalH;
        if (p.y > logicalH) p.y = 0;

        // Slight mouse influence
        const mdx = mouseRef.current.x - p.x;
        const mdy = mouseRef.current.y - p.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 150) {
          p.vx -= mdx * 0.00003;
          p.vy -= mdy * 0.00003;
        }

        // Pulse opacity
        const pulseAlpha =
          p.opacity * (0.7 + 0.3 * Math.sin(t * 2 + p.x * 0.01));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${pulseAlpha})`;
        ctx.fill();
      }

      // Draw connection lines between nearby particles
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.08;
            ctx.strokeStyle = `rgba(0, 212, 170, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleMouse);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouse);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    const cleanup = initAndAnimate();
    return cleanup;
  }, [initAndAnimate]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "auto",
      }}
    />
  );
}
