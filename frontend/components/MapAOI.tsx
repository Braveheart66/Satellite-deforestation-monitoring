"use client";

import dynamic from "next/dynamic";

const MapAOIClient = dynamic(() => import("./MapAOIClient"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "420px",
        background: "rgba(15, 15, 42, 0.5)",
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <p style={{ color: "#555577" }}>Loading AOI selector...</p>
    </div>
  ),
});

type Props = {
  onAOISelect: (coords: number[][][] | null) => void;
};

export default function MapAOI(props: Props) {
  return <MapAOIClient {...props} />;
}
