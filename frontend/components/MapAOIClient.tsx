"use client";

import { MapContainer, TileLayer, FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";

type Props = {
  onAOISelect: (coords: number[][][]) => void;
};

export default function MapAOIClient({ onAOISelect }: Props) {
  const handleCreated = (e: any) => {
    const layer = e.layer as L.Polygon;
    const latLngs = layer.getLatLngs()[0] as L.LatLng[];

    const coordinates = [
      latLngs.map((p) => [p.lng, p.lat]),
    ];

    onAOISelect(coordinates);
  };

  return (
    <MapContainer
      center={[26.9124, 75.7873]}
      zoom={11}
      style={{
        height: "420px",
        width: "100%",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      {/* PURE BASE MAP — NO EE */}
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
