"use client";

import dynamic from "next/dynamic";

const MapAOIClient = dynamic(() => import("./MapAOIClient"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "420px",
        background: "#f0f0f0",
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <p>Loading AOI selector...</p>
    </div>
  ),
});

type Props = {
  onAOISelect: (coords: number[][][]) => void;
};

export default function MapAOI(props: Props) {
  return <MapAOIClient {...props} />;
}
