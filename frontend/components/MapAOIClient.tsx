"use client";

import { MapContainer, TileLayer, FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";

type Props = {
  onAOISelect: (coords: number[][][]) => void;
};

export default function MapAOIClient({ onAOISelect }: Props) {
  function handleCreated(e: any) {
    const geojson = e.layer.toGeoJSON();
    onAOISelect(geojson.geometry.coordinates);
  }

  return (
    <MapContainer
      center={[26.85, 80.95]}
      zoom={11}
      style={{ height: "400px", width: "100%", borderRadius: "8px" }}
    >
      <TileLayer
        attribution="© OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FeatureGroup>
        <EditControl
          position="topright"
          onCreated={handleCreated}
          draw={{
            rectangle: false,
            polyline: false,
            circle: false,
            marker: false,
            circlemarker: false,
          }}
        />
      </FeatureGroup>
    </MapContainer>
  );
}
