import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import MapView from '@/components/MapView';
import Sidebar from '@/components/Sidebar';
import CountryPanel from '@/components/CountryPanel';
import About from '@/components/About';
import Speeches from '@/components/Speeches';
import PasswordPrompt from '@/components/PasswordPrompt';
import { useSummary, useMapData } from '@/hooks/useApi';
import type { SpeechType, Ideology } from '@/types';

type TabType = 'map' | 'speeches' | 'about';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [yearStart, setYearStart] = useState(1990);
  const [yearEnd, setYearEnd] = useState(2026);
  const [speechType, setSpeechType] = useState<SpeechType>('total');
  const [ideology, setIdeology] = useState<Ideology | null>(null);
  const [colorByIdeology, setColorByIdeology] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Always call hooks before any conditional returns
  const { data: summary } = useSummary();
  const { data: mapData, isLoading: mapLoading } = useMapData({
    year_start: yearStart,
    year_end: yearEnd,
    speech_type: speechType,
    ideology: ideology,
  });

  // Check if already authenticated
  useEffect(() => {
    const authStatus = sessionStorage.getItem('gpd_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthenticated = () => {
    sessionStorage.setItem('gpd_authenticated', 'true');
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <PasswordPrompt onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <Header summary={summary} activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 max-w-[1400px] max-h-[90vh] mx-auto px-4 pb-4 w-full overflow-hidden">
        {activeTab === 'about' ? (
          <About />
        ) : activeTab === 'speeches' ? (
          <Speeches />
        ) : (
          /* Main Layout */
          <div className="grid grid-cols-[240px_1fr_220px] gap-3 h-full">
          {/* Left Sidebar - Controls */}
          <div className="overflow-y-auto">
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
          </div>

          {/* Map */}
          <div className="bg-white rounded-lg shadow-md p-2 h-full">
            <MapView
              data={mapData || []}
              isLoading={mapLoading}
              onCountryClick={setSelectedCountry}
              selectedCountry={selectedCountry}
              ideologyFilter={ideology}
              colorByIdeology={colorByIdeology}
            />
          </div>

          {/* Right Panel - Legend and Country Details */}
          <div className="flex flex-col gap-3 h-full overflow-y-auto">
            <CountryPanel
              country={selectedCountry}
              onClose={() => setSelectedCountry(null)}
              colorByIdeology={colorByIdeology}
            />
          </div>
        </div>
        )}
      </main>
    </div>
  );
}

export default App;
