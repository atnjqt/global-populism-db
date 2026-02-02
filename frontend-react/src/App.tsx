import { useState } from 'react';
import Header from '@/components/Header';
import MapView from '@/components/MapView';
import Sidebar from '@/components/Sidebar';
import CountryPanel from '@/components/CountryPanel';
import { useSummary, useMapData } from '@/hooks/useApi';
import type { SpeechType, Ideology } from '@/types';

function App() {
  const [yearStart, setYearStart] = useState(1990);
  const [yearEnd, setYearEnd] = useState(2026);
  const [speechType, setSpeechType] = useState<SpeechType>('total');
  const [ideology, setIdeology] = useState<Ideology | null>(null);
  const [colorByIdeology, setColorByIdeology] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const { data: summary } = useSummary();
  const { data: mapData, isLoading: mapLoading } = useMapData({
    year_start: yearStart,
    year_end: yearEnd,
    speech_type: speechType,
    ideology: ideology,
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <Header summary={summary} />
      
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {/* Main Layout */}
        <div className="grid grid-cols-[240px_1fr_220px] gap-4">
          {/* Left Sidebar - Controls */}
          <Sidebar
            yearStart={yearStart}
            yearEnd={yearEnd}
            speechType={speechType}
            ideology={ideology}
            colorByIdeology={colorByIdeology}
            onYearStartChange={setYearStart}
            onYearEndChange={setYearEnd}
            onSpeechTypeChange={setSpeechType}
            onIdeologyChange={setIdeology}
            onColorByIdeologyChange={setColorByIdeology}
          />

          {/* Map */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <MapView
              data={mapData || []}
              isLoading={mapLoading}
              onCountryClick={setSelectedCountry}
              selectedCountry={selectedCountry}
              ideologyFilter={ideology}
              colorByIdeology={colorByIdeology}
            />
          </div>

          {/* Right Panel - Country Details */}
          <CountryPanel
            country={selectedCountry}
            onClose={() => setSelectedCountry(null)}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
