"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import { LatLngExpression } from "leaflet";
import { useEffect, useState } from "react";

// Dynamically import map components to disable SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const FeatureGroup = dynamic(
  () => import("react-leaflet").then((mod) => mod.FeatureGroup),
  { ssr: false }
);

const EditControl = dynamic(
  () => import("react-leaflet-draw").then((mod) => mod.EditControl),
  { ssr: false }
);

type Props = {
  onAOISelect: (coords: number[][][]) => void;
};

/* ✅ MUST be at component scope */
const mapCenter: LatLngExpression = [26.9124, 75.7873];

export default function MapAOIClient({ onAOISelect }: Props) {
  const [isReady, setIsReady] = useState(false);

  // Fix Leaflet icon URLs for Next.js/production
  useEffect(() => {
    // @ts-ignore
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });
    setIsReady(true);
  }, []);

  const handleCreated = (e: any) => {
    const layer = e.layer as L.Polygon;
    const latLngs = layer.getLatLngs()[0] as L.LatLng[];

    const coordinates = [
      latLngs.map((p) => [p.lng, p.lat]),
    ];

    onAOISelect(coordinates);
  };

  if (!isReady) return null;

  return (
    <MapContainer
      center={mapCenter}
      zoom={11}
      style={{
        height: "420px",
        width: "100%",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      <FeatureGroup>
        <EditControl
          position="topright"
          onCreated={handleCreated}
          draw={{
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: false,
            polyline: false,
          }}
        />
      </FeatureGroup>
    </MapContainer>
  );
}
