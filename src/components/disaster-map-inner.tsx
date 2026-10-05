"use client";

// Inner Leaflet map — loaded client-side only via next/dynamic in index.tsx
import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap, LayersControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { DISASTER_META, SEVERITY_META, type DisasterType } from "@/lib/constants";
import { timeAgo } from "@/lib/fetcher";

export interface MapAlert {
  id: string;
  disasterType: string;
  title: string;
  severity: string;
  status: string;
  locationName: string;
  region?: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  startTime: string;
  isSimulated?: boolean;
  recommendedActions?: string[];
}
export interface MapShelter {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentLoad: number;
  facilities: string[];
  contactPhone?: string | null;
}

function disasterIcon(type: string, severity: string) {
  const meta = DISASTER_META[(type as DisasterType)] ?? DISASTER_META.OTHER;
  const pulse = severity === "CRITICAL" || severity === "HIGH";
  return L.divIcon({
    className: "dg-marker",
    html: `<span style="position:relative;display:grid;place-items:center;width:34px;height:34px">
      ${pulse ? `<span style="position:absolute;inset:-6px;border-radius:9999px;border:2px solid ${meta.color};opacity:.6;animation:pulse-ring 2s cubic-bezier(.215,.61,.355,1) infinite"></span>` : ""}
      <span style="position:relative;display:grid;place-items:center;width:30px;height:30px;border-radius:10px;background:${meta.bg};border:1.5px solid ${meta.color}88;box-shadow:0 2px 10px rgba(0,0,0,.45);font-size:15px">${meta.emoji}</span>
    </span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  });
}

function shelterIcon() {
  return L.divIcon({
    className: "dg-marker",
    html: `<span style="display:grid;place-items:center;width:26px;height:26px;border-radius:8px;background:rgba(34,197,94,.15);border:1.5px solid rgba(34,197,94,.6);box-shadow:0 2px 8px rgba(0,0,0,.4);font-size:13px">🏠</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -12],
  });
}

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center[0], center[1], zoom]);
  return null;
}

export interface DisasterMapProps {
  alerts: MapAlert[];
  shelters?: MapShelter[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  activeId?: string | null;
  onAlertClick?: (a: MapAlert) => void;
  showShelters?: boolean;
  showSafeZones?: boolean;
}

export default function DisasterMapInner({
  alerts,
  shelters = [],
  center = [22.8, 79],
  zoom = 5,
  height = "100%",
  activeId,
  onAlertClick,
  showShelters = true,
  showSafeZones = true,
}: DisasterMapProps) {
  const severityColor = (s: string) => SEVERITY_META[(s as keyof typeof SEVERITY_META)]?.color ?? "#eab308";

  const markers = useMemo(() => alerts, [alerts]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: "100%", borderRadius: "0.75rem" }}
      scrollWheelZoom
      preferCanvas
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} zoom={zoom} />

      {markers.map((a) => {
        const color = severityColor(a.severity);
        const isActive = a.id === activeId;
        return (
          <div key={a.id}>
            {/* affected / warning zone */}
            <Circle
              center={[a.latitude, a.longitude]}
              radius={a.radiusKm * 1000}
              pathOptions={{ color, weight: isActive ? 2.5 : 1.5, fillColor: color, fillOpacity: a.status === "ACTIVE" ? 0.13 : 0.05, dashArray: a.status === "ACTIVE" ? undefined : "6 8", opacity: a.status === "ACTIVE" ? 0.8 : 0.4 }}
            />
            {showSafeZones && a.status === "ACTIVE" && (
              <Circle
                center={[a.latitude, a.longitude]}
                radius={a.radiusKm * 1600}
                pathOptions={{ color: "#22c55e", weight: 1.2, fillOpacity: 0.02, dashArray: "4 10", opacity: 0.55 }}
              />
            )}
            <Marker
              position={[a.latitude, a.longitude]}
              icon={disasterIcon(a.disasterType, a.severity)}
              eventHandlers={{ click: () => onAlertClick?.(a) }}
              zIndexOffset={isActive ? 1000 : 0}
            >
              <Popup maxWidth={280}>
                <div style={{ minWidth: 220 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", color: color }}>
                      {a.severity} · {a.disasterType.replace("_", " ")}
                    </span>
                    {a.isSimulated !== false && (
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#f59e0b", border: "1px dashed #f59e0b88", borderRadius: 4, padding: "1px 4px" }}>DEMO</span>
                    )}
                  </div>
                  <p style={{ fontWeight: 700, margin: "0 0 4px", lineHeight: 1.3 }}>{a.title}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#8ba0bd" }}>📍 {a.locationName} · {a.radiusKm} km radius</p>
                  <p style={{ margin: "2px 0 4px", fontSize: 12, color: "#8ba0bd" }}>🕒 Detected {timeAgo(a.startTime)} · Status: {a.status}</p>
                  {a.recommendedActions?.[0] && (
                    <p style={{ margin: "4px 0", fontSize: 12, lineHeight: 1.4 }}>
                      ✅ <b>Do:</b> {a.recommendedActions[0]}
                    </p>
                  )}
                  <Link href={`/dashboard/alerts/${a.id}`} style={{ display: "inline-block", marginTop: 6, fontSize: 12, fontWeight: 700, color: "#22d3ee" }}>
                    View full details →
                  </Link>
                </div>
              </Popup>
            </Marker>
          </div>
        );
      })}

      {showShelters &&
        shelters.map((s) => (
          <Marker key={s.id} position={[s.latitude, s.longitude]} icon={shelterIcon()}>
            <Popup maxWidth={240}>
              <div style={{ minWidth: 190 }}>
                <p style={{ fontWeight: 700, margin: "0 0 3px" }}>🏠 {s.name}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#8ba0bd" }}>{s.address}, {s.city}</p>
                <p style={{ margin: "4px 0", fontSize: 12 }}>
                  Capacity {s.currentLoad}/{s.capacity} ({Math.round((s.currentLoad / Math.max(1, s.capacity)) * 100)}% full)
                </p>
                {s.facilities.length > 0 && <p style={{ margin: 0, fontSize: 11, color: "#8ba0bd" }}>{s.facilities.join(" · ")}</p>}
              </div>
            </Popup>
          </Marker>
        ))}

      <LayersControl position="topright" collapsed>
        <LayersControl.BaseLayer checked name="Dark">
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        </LayersControl.BaseLayer>
      </LayersControl>
    </MapContainer>
  );
}
