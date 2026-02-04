import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { useEffect, useState } from 'react';
import type { MapDataItem, Ideology } from '@/types';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { Layer, PathOptions } from 'leaflet';

interface MapViewProps {
  data: MapDataItem[];
  isLoading: boolean;
  onCountryClick: (country: string) => void;
  selectedCountry: string | null;
  ideologyFilter: Ideology | null;
  colorByIdeology: boolean;
}

// Country name mappings for matching GeoJSON to API data
const COUNTRY_NAME_MAP: Record<string, string> = {
  'United States of America': 'United States',
  'United Kingdom': 'UK',
  'Czech Republic': 'Czechia',
  'Russian Federation': 'Russia',
  'Korea, Republic of': 'South Korea',
  'Republic of Korea': 'South Korea',
};

// Get color based on ideology and populism score
// Higher populism = darker shade
function getIdeologyColor(ideology: number, populism: number): string {
  // Normalize populism to 0-1 range (max is 2)
  const intensity = Math.min(populism / 2, 1);
  
  // Calculate lightness: low populism = light (70%), high populism = dark (25%)
  const lightness = 70 - (intensity * 45);
  
  if (ideology === -1) {
    // Left = Blue (hue 220)
    return `hsl(220, 70%, ${lightness}%)`;
  } else if (ideology === 0) {
    // Center = Green (hue 160)
    return `hsl(160, 70%, ${lightness}%)`;
  } else if (ideology === 1) {
    // Right = Red (hue 0)
    return `hsl(0, 70%, ${lightness}%)`;
  }
  
  // Unknown ideology - gray
  return `hsl(0, 0%, ${lightness + 20}%)`;
}

// Colorblind-friendly populism color scheme: Blue to Purple to Orange
function getPopulismColor(score: number | undefined): string {
  if (score === undefined || score === null) return '#e5e7eb';
  if (score >= 1.5) return '#991b1b'; // red-800 - very high
  if (score >= 1.0) return '#dc2626'; // red-600 - high
  if (score >= 0.5) return '#f97316'; // orange-500 - medium
  if (score >= 0.2) return '#facc15'; // yellow-400 - low
  return '#86efac'; // green-300 - very low
}

export default function MapView({ data, isLoading, onCountryClick, selectedCountry, ideologyFilter, colorByIdeology }: MapViewProps) {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);

  // Load GeoJSON data
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch(console.error);
  }, []);

  // Create a lookup map for country data
  const dataLookup = new Map<string, MapDataItem>();
  data.forEach((item) => {
    dataLookup.set(item.country, item);
    dataLookup.set(item.country.toLowerCase(), item);
  });

  const getCountryData = (name: string): MapDataItem | undefined => {
    // Try direct match
    let result = dataLookup.get(name);
    if (result) return result;

    // Try lowercase
    result = dataLookup.get(name.toLowerCase());
    if (result) return result;

    // Try mapped name
    const mappedName = COUNTRY_NAME_MAP[name];
    if (mappedName) {
      result = dataLookup.get(mappedName);
      if (result) return result;
    }

    return undefined;
  };

  const style = (feature: Feature<Geometry> | undefined): PathOptions => {
    const countryName = feature?.properties?.ADMIN || feature?.properties?.name || '';
    const countryData = getCountryData(countryName);
    const isSelected = countryName === selectedCountry || 
      COUNTRY_NAME_MAP[countryName] === selectedCountry;

    let fillColor = '#e5e7eb'; // gray-200 for no data
    let fillOpacity = 0.7;
    
    if (countryData) {
      if (colorByIdeology) {
        // Filter by ideology if set
        const matchesFilter = ideologyFilter === null || countryData.ideology === ideologyFilter;
        
        if (matchesFilter) {
          fillColor = getIdeologyColor(countryData.ideology, countryData.avg_populism);
        } else {
          // Dim countries that don't match the filter
          fillColor = '#e5e7eb';
          fillOpacity = 0.3;
        }
      } else {
        // Populism-only coloring
        fillColor = getPopulismColor(countryData.avg_populism);
      }
    }

    return {
      fillColor,
      weight: isSelected ? 3 : 1,
      opacity: 1,
      color: isSelected ? '#1e40af' : '#999',
      fillOpacity,
    };
  };

  const onEachFeature = (feature: Feature<Geometry>, layer: Layer) => {
    const countryName = feature.properties?.ADMIN || feature.properties?.name || '';
    const countryData = getCountryData(countryName);
    
    // Use the API country name if found, otherwise the GeoJSON name
    const displayName = countryData?.country || countryName;
    const score = countryData?.avg_populism;
    const ideologyLabel = countryData?.ideology === -1 ? 'Left' 
      : countryData?.ideology === 0 ? 'Center' 
      : countryData?.ideology === 1 ? 'Right' : null;

    layer.bindTooltip(
      `<strong>${displayName}</strong><br/>` +
      (score !== undefined 
        ? `Populism: ${score.toFixed(2)}${ideologyLabel ? ` · ${ideologyLabel}` : ''}`
        : 'No data available'),
      { sticky: true }
    );

    layer.on({
      click: () => {
        if (countryData) {
          onCountryClick(countryData.country);
        }
      },
      mouseover: (e) => {
        const target = e.target;
        target.setStyle({
          weight: 2,
          opacity: 1,
        });
      },
      mouseout: (e) => {
        const target = e.target;
        const isSelected = displayName === selectedCountry;
        target.setStyle({
          weight: isSelected ? 3 : 1,
        });
      },
    });
  };

  if (isLoading || !geoData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p>Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[500px] rounded-lg overflow-hidden">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          key={JSON.stringify(data) + selectedCountry + ideologyFilter + colorByIdeology}
          data={geoData}
          style={style}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  );
}
