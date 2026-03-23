"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { LatLngExpression } from "leaflet";
import { useEffect, useRef, useState } from "react";

// Dynamically import map components to disable SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

type Props = {
  onAOISelect: (coords: number[][][]) => void;
};

/* ✅ MUST be at component scope */
const mapCenter: LatLngExpression = [26.9124, 75.7873];

export default function MapAOIClient({ onAOISelect }: Props) {
  const mapRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Only run on client after component mounts
    if (typeof window === "undefined") return;

    const initializeMap = async () => {
      try {
        const L = (await import("leaflet")).default;
        // Import leaflet-draw to load CSS and initialize L.Control.Draw
        // @ts-ignore
        await import("leaflet-draw");

        // Fix Leaflet icon URLs
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
      } catch (error) {
        console.error("Map initialization error:", error);
      }
    };

    initializeMap();
  }, []);

  const handleMapCreated = (container: HTMLDivElement) => {
    if (!isReady || !container) return;

    // Dynamically import and initialize everything after render
    setTimeout(() => {
      const initDrawing = async () => {
        try {
          const L = (await import("leaflet")).default;

          if (!mapRef.current) return;

          // Add Leaflet Draw to the map
          const map = mapRef.current as any;
          const drawnItems = new L.FeatureGroup();
          map.addLayer(drawnItems);

          // @ts-ignore
          const drawControl = new L.Control.Draw({
            draw: {
              rectangle: false,
              circle: false,
              circlemarker: false,
              marker: false,
              polyline: false,
              polygon: true,
            },
            edit: {
              featureGroup: drawnItems,
            },
          });
          map.addControl(drawControl);

          map.on("draw:created", (e: any) => {
            const layer = e.layer;
            if (layer.getLatLngs) {
              const latLngs = layer.getLatLngs()[0];
              const coordinates = [
                latLngs.map((p: any) => [p.lng, p.lat]),
              ];
              onAOISelect(coordinates);
            }
          });
        } catch (error) {
          console.error("Drawing initialization error:", error);
        }
      };
      initDrawing();
    }, 100);
  };

  if (!isReady) return <div style={{ height: "420px", background: "#f0f0f0" }} />;

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
      ref={(mapInstance) => {
        if (mapInstance) {
          mapRef.current = mapInstance;
          const container = mapInstance.getContainer?.();
          if (container) {
            handleMapCreated(container as HTMLDivElement);
          }
        }
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
    </MapContainer>
  );
}
