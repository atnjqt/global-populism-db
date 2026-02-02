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

  const { data: summary, isLoading: summaryLoading } = useSummary();
  const { data: mapData, isLoading: mapLoading } = useMapData({
    year_start: yearStart,
    year_end: yearEnd,
    speech_type: speechType,
    ideology: ideology,
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {/* Stats Bar */}
        {summary && !summaryLoading && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex justify-center gap-12">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-500">{summary.total_records}</div>
                <div className="text-sm text-gray-600">Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-500">{summary.total_countries}</div>
                <div className="text-sm text-gray-600">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-500">{summary.total_leaders}</div>
                <div className="text-sm text-gray-600">Leaders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-500">
                  {summary.year_range.min} - {summary.year_range.max}
                </div>
                <div className="text-sm text-gray-600">Year Range</div>
              </div>
            </div>
          </div>
        )}

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
