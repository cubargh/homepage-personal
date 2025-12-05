"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";

interface TrackMapProps {
  circuitName: string;
  city: string;
  country: string;
}

interface GeoJSONFeature {
  type: "Feature";
  properties: {
    id: string;
    Location: string;
    Name: string;
  };
  geometry: {
    type: "LineString";
    coordinates: number[][];
  };
}

interface GeoJSON {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export function TrackMap({ circuitName, city, country }: TrackMapProps) {
  const [geoJson, setGeoJson] = useState<GeoJSON | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGeoJson() {
      try {
        const response = await fetch("/f1-circuits.geojson");
        if (!response.ok) throw new Error("Failed to load track data");
        const data = await response.json();
        setGeoJson(data);
      } catch (err) {
        setError("Failed to load track map");
      } finally {
        setIsLoading(false);
      }
    }

    fetchGeoJson();
  }, []);

  const trackFeature = useMemo(() => {
    if (!geoJson) return null;

    // Try matching by City (Location)
    const byCity = geoJson.features.find(
      (f) => f.properties.Location.toLowerCase() === city.toLowerCase()
    );
    if (byCity) return byCity;

    // Try matching by Name (fuzzy)
    const byName = geoJson.features.find(
      (f) =>
        f.properties.Name.toLowerCase().includes(circuitName.toLowerCase()) ||
        circuitName.toLowerCase().includes(f.properties.Name.toLowerCase())
    );
    if (byName) return byName;

    // Try matching by Country as last resort fallback (risky if multiple tracks, but usually 1 per country in calendar)
    // Ideally we don't do this unless we map countries manually, let's skip for now to be safe.
    
    return null;
  }, [geoJson, city, circuitName]);

  const pathData = useMemo(() => {
    if (!trackFeature) return null;

    const coords = trackFeature.geometry.coordinates;
    if (!coords || coords.length === 0) return null;

    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    coords.forEach(([x, y]) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    // Add some padding
    const width = maxX - minX;
    const height = maxY - minY;
    const paddingX = width * 0.1;
    const paddingY = height * 0.1;

    // Normalize and create path string
    // Flip Y axis because SVG Y goes down, Latitude goes up
    // But standard projection mapping:
    // x = (lon - minLon) / (maxLon - minLon) * viewWidth
    // y = (maxLat - lat) / (maxLat - minLat) * viewHeight (flipped)
    
    const svgWidth = 300;
    const svgHeight = 200; // Aspect ratio will depend on track, but we map to a square-ish box 

    const points = coords.map(([lon, lat]) => {
      const x = ((lon - minX) / width) * (svgWidth - 40) + 20; // 20px padding
      const y = ((maxY - lat) / height) * (svgHeight - 40) + 20;
      return `${x},${y}`;
    });

    return points.join(" L ");
  }, [trackFeature]);

  if (isLoading) return <div className="flex items-center justify-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (error || !trackFeature || !pathData) return <div className="flex items-center justify-center h-48 text-muted-foreground text-xs">Track map not available</div>;

  return (
    <div className="w-full h-48 flex items-center justify-center p-4">
      <svg
        viewBox="0 0 300 200"
        className="w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d={`M ${pathData} Z`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-primary"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}





