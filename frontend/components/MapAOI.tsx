import dynamic from "next/dynamic";

const MapAOIClient = dynamic(() => import("./MapAOIClient"), {
  ssr: false,
});

type Props = {
  onAOISelect: (coords: number[][][]) => void;
};

export default function MapAOI(props: Props) {
  return <MapAOIClient {...props} />;
}
