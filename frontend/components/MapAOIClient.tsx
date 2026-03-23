"use client";

import { LatLngExpression } from "leaflet";
import { useEffect, useRef, useState } from "react";

// Don't import react-leaflet at module level - causes SSR issues
// Import them lazily inside useEffect

let MapContainerComponent: any = null;
let TileLayerComponent: any = null;

type Props = {
  onAOISelect: (coords: number[][][]) => void;
};

const mapCenter: LatLngExpression = [26.9124, 75.7873];

export default function MapAOIClient({ onAOISelect }: Props) {
  const mapRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [geoJsonInput, setGeoJsonInput] = useState("");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initializeComponents = async () => {
      try {
        // Import react-leaflet components
        const { MapContainer: MC, TileLayer: TL } =
          await import("react-leaflet");
        MapContainerComponent = MC;
        TileLayerComponent = TL;

        // Import and configure Leaflet
        const L = (await import("leaflet")).default;

        // Ensure CSS is loaded
        if (typeof window !== "undefined") {
          require("leaflet/dist/leaflet.css");
        }

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
        console.error("Map initialization failed:", error);
        setHasError(true);
      }
    };

    initializeComponents();
  }, []);

  const handleGeoJsonUpload = async () => {
    if (!geoJsonInput.trim() || !mapRef.current) return;

    try {
      const L = (await import("leaflet")).default;
      const geoJson = JSON.parse(geoJsonInput);
      const map = mapRef.current as any;

      // Remove existing layers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      // Handle both Feature and FeatureCollection
      const features =
        geoJson.type === "FeatureCollection"
          ? geoJson.features
          : [{ geometry: geoJson }];

      features.forEach((feature: any) => {
        const geom = feature.geometry || feature;
        if (geom.type === "Polygon") {
          const polygon = L.polygon(
            geom.coordinates[0].map((coord: any) => [coord[1], coord[0]])
          );
          polygon.addTo(map);

          // Send to parent
          const coords = [geom.coordinates];
          onAOISelect(coords);

          // Fit map bounds
          map.fitBounds(polygon.getBounds());
        }
      });
    } catch (error) {
      console.error("Error parsing GeoJSON:", error);
      alert("Invalid GeoJSON format. Please check your input.");
    }
  };

  if (hasError) {
    return (
      <div
        style={{
          height: "420px",
          background: "#fee",
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#c33",
        }}
      >
        <p>⚠️ Map failed to load. Please refresh the page.</p>
      </div>
    );
  }

  if (!isReady || !MapContainerComponent || !TileLayerComponent) {
    return (
      <div
        style={{
          height: "420px",
          background: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "14px",
        }}
      >
        <p>🗺️ Loading map...</p>
      </div>
    );
  }

  return (
    <div>
      <MapContainerComponent
        center={mapCenter}
        zoom={11}
        style={{
          height: "420px",
          width: "100%",
          borderRadius: "14px",
          overflow: "hidden",
          marginBottom: "12px",
        }}
        ref={(mapInstance: any) => {
          if (mapInstance) {
            mapRef.current = mapInstance;
          }
        }}
      >
        <TileLayerComponent
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
      </MapContainerComponent>

      <div style={{ marginTop: "12px" }}>
        <textarea
          placeholder='Paste GeoJSON polygon here (e.g., {"type":"Polygon","coordinates":[[[lng,lat],...]]}'
          value={geoJsonInput}
          onChange={(e) => setGeoJsonInput(e.target.value)}
          style={{
            width: "100%",
            height: "80px",
            padding: "8px",
            fontFamily: "monospace",
            fontSize: "12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={handleGeoJsonUpload}
          style={{
            marginTop: "8px",
            padding: "8px 16px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Load Polygon
        </button>
      </div>
    </div>
  );
}
