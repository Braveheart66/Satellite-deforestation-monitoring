"use client";

import { LatLngExpression } from "leaflet";
import { useEffect, useRef, useState } from "react";

let MapContainerComponent: any = null;
let TileLayerComponent: any = null;

type Props = {
  onAOISelect: (coords: number[][][]) => void;
};

const mapCenter: LatLngExpression = [26.9124, 75.7873];

export default function MapAOIClient({ onAOISelect }: Props) {
  const leafletRef = useRef<any>(null);
  const [leafletMap, setLeafletMap] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<Array<[number, number]>>([]);
  const [tempLayer, setTempLayer] = useState<any>(null);
  const [aoiLayer, setAoiLayer] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initializeComponents = async () => {
      try {
        const { MapContainer: MC, TileLayer: TL } = await import("react-leaflet");
        MapContainerComponent = MC;
        TileLayerComponent = TL;

        const L = (await import("leaflet")).default;
        leafletRef.current = L;

        require("leaflet/dist/leaflet.css");

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

  useEffect(() => {
    if (!leafletMap) return;

    const onMapClick = (event: any) => {
      if (!isDrawing || !leafletRef.current) return;

      const newPoint: [number, number] = [event.latlng.lat, event.latlng.lng];
      const newPoints = [...drawPoints, newPoint];
      setDrawPoints(newPoints);

      if (tempLayer) {
        leafletMap.removeLayer(tempLayer);
      }

      const line = leafletRef.current.polyline(newPoints, {
        color: "#007bff",
        dashArray: "6 6",
      }).addTo(leafletMap);
      setTempLayer(line);
    };

    leafletMap.on("click", onMapClick);
    return () => leafletMap.off("click", onMapClick);
  }, [leafletMap, isDrawing, drawPoints, tempLayer]);

  const completeDrawing = () => {
    if (!leafletMap || !leafletRef.current) return;

    if (drawPoints.length < 3) {
      alert("Please select at least 3 points to form a polygon.");
      return;
    }

    if (tempLayer) {
      leafletMap.removeLayer(tempLayer);
      setTempLayer(null);
    }

    if (aoiLayer) {
      leafletMap.removeLayer(aoiLayer);
    }

    const polygon = leafletRef.current.polygon(drawPoints, {
      color: "#28a745",
      fillOpacity: 0.2,
    }).addTo(leafletMap);

    setAoiLayer(polygon);

    const polygonCoords = [drawPoints.map((point) => [point[1], point[0]])];
    onAOISelect(polygonCoords);

    setIsDrawing(false);
    setDrawPoints([]);
  };

  const clearSelection = () => {
    if (tempLayer && leafletMap) {
      leafletMap.removeLayer(tempLayer);
      setTempLayer(null);
    }

    if (aoiLayer && leafletMap) {
      leafletMap.removeLayer(aoiLayer);
      setAoiLayer(null);
    }

    setDrawPoints([]);
    onAOISelect([] as unknown as number[][][]);
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
        <p>Map failed to load. Please refresh the page.</p>
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
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "0.75rem", display: "flex", gap: "0.75rem" }}>
        <button
          onClick={() => setIsDrawing(!isDrawing)}
          style={{
            padding: "0.5rem 0.75rem",
            backgroundColor: isDrawing ? "#d55376" : "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {isDrawing ? "Drawing active (click map)" : "Start drawing"}
        </button>
        <button
          onClick={completeDrawing}
          disabled={drawPoints.length < 3}
          style={{
            padding: "0.5rem 0.75rem",
            backgroundColor: drawPoints.length >= 3 ? "#28a745" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: drawPoints.length >= 3 ? "pointer" : "not-allowed",
          }}
        >
          Complete Polygon
        </button>
        <button
          onClick={clearSelection}
          style={{
            padding: "0.5rem 0.75rem",
            backgroundColor: "#555",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ marginBottom: "0.75rem", color: "#333" }}>
        Points in current draw: {drawPoints.length}
      </div>

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
        whenCreated={setLeafletMap}
      >
        <TileLayerComponent
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
      </MapContainerComponent>

      <div style={{ marginTop: "12px" }}>
        <p style={{ margin: 0 }}>
          If you prefer, paste GeoJSON in the main page to set AOI directly.
        </p>
      </div>
    </div>
  );
}
