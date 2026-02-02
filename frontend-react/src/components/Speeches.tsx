import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSpeeches, useSpeechContent, useCountries, useAnalyzeSpeech } from '@/hooks/useApi';
import type { Ideology, SpeechType, SpeechAnalysisResponse } from '@/types';

export default function Speeches() {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedIdeology, setSelectedIdeology] = useState<Ideology | null>(null);
  const [selectedSpeechType, setSelectedSpeechType] = useState<SpeechType>('total');
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<SpeechAnalysisResponse | null>(null);
  const speechListRef = useRef<HTMLDivElement>(null);

  const { data: countriesData } = useCountries();
  const { data: speechesData, isLoading: speechesLoading } = useSpeeches({
    country: selectedCountry || undefined,
    ideology: selectedIdeology ?? undefined,
    speech_type: selectedSpeechType,
  });
  const { data: speechContent, isLoading: contentLoading } = useSpeechContent(selectedFilename);
  const analyzeMutation = useAnalyzeSpeech();

  // Debug speech content
  useEffect(() => {
    console.log('Selected filename:', selectedFilename);
    console.log('Speech content:', speechContent);
    console.log('Content loading:', contentLoading);
  }, [selectedFilename, speechContent, contentLoading]);

  const rawSpeeches = speechesData?.speeches || [];
  const countries = countriesData?.countries || [];

  // Sort speeches by populism score
  const speeches = [...rawSpeeches].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.populism_score - b.populism_score;
    } else {
      return b.populism_score - a.populism_score;
    }
  });

  // Debug logging
  useEffect(() => {
    console.log('Filter state:', { selectedCountry, selectedIdeology, selectedSpeechType });
    console.log('Raw speechesData:', speechesData);
    console.log('Speeches count:', speeches.length);
    if (speeches.length > 0) {
      console.log('First speech:', speeches[0]);
    }
  }, [selectedCountry, selectedIdeology, selectedSpeechType, speeches, speechesData]);

  // Clear selected speech and scroll to top when filters change
  useEffect(() => {
    setSelectedFilename(null);
    setShowAnalysis(false);
    setAnalysisData(null);
    if (speechListRef.current) {
      speechListRef.current.scrollTop = 0;
    }
  }, [selectedCountry, selectedIdeology, selectedSpeechType]);

  const handleAnalyze = async () => {
    if (!selectedFilename) return;
    
    try {
      const result = await analyzeMutation.mutateAsync(selectedFilename);
      setAnalysisData(result);
      setShowAnalysis(true);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const getIdeologyColor = (ideology: number | null) => {
    if (ideology === -1) return 'bg-blue-500';
    if (ideology === 0) return 'bg-emerald-500';
    if (ideology === 1) return 'bg-red-500';
    return 'bg-gray-400'; // Unknown ideology
  };

  const getSpeechTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      campaign: 'Campaign',
      famous: 'Famous',
      international: 'International',
      ribbon: 'Ribbon-cutting',
    };
    return labels[type] || type;
  };

  const getScoreColor = (score: number) => {
    if (score >= 1.5) return 'text-red-700 font-bold';
    if (score >= 1.0) return 'text-red-600 font-semibold';
    if (score >= 0.5) return 'text-orange-500';
    if (score >= 0.2) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Filters & Speech List */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Speech Explorer</h3>
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Filters
            </h4>

            {/* Country Filter */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Countries</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {/* Ideology Filter */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Ideology</label>
              <div className="flex gap-1">
                {[
                  { value: -1 as Ideology, label: 'Left', color: 'bg-blue-500' },
                  { value: 0 as Ideology, label: 'Center', color: 'bg-emerald-500' },
                  { value: 1 as Ideology, label: 'Right', color: 'bg-red-500' },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setSelectedIdeology(selectedIdeology === item.value ? null : item.value)}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                      selectedIdeology === item.value
                        ? `${item.color} text-white shadow-md`
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Speech Type Filter */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Speech Type</label>
              <select
                value={selectedSpeechType}
                onChange={(e) => setSelectedSpeechType(e.target.value as SpeechType)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="total">All Types</option>
                <option value="campaign">Campaign</option>
                <option value="famous">Famous</option>
                <option value="international">International</option>
                <option value="ribbon">Ribbon-cutting</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Sort by Score</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="desc">High to Low</option>
                <option value="asc">Low to High</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(selectedCountry || selectedIdeology !== null || selectedSpeechType !== 'total') && (
              <button
                onClick={() => {
                  setSelectedCountry('');
                  setSelectedIdeology(null);
                  setSelectedSpeechType('total');
                }}
                className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Speech List */}
          <div ref={speechListRef} className="flex-1 overflow-y-auto">
            {speechesLoading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Loading speeches...
              </div>
            ) : speeches.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">No speeches found with current filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {speeches.map((speech, index) => (
                  <button
                    key={`${speech.filename}-${speech.term}-${index}`}
                    onClick={() => setSelectedFilename(speech.filename)}
                    className={`w-full text-left p-3 hover:bg-blue-50 transition-colors ${
                      selectedFilename === speech.filename ? 'bg-blue-100 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-800 truncate">
                          {speech.leader}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{speech.country}</div>
                      </div>
                      <div className={`ml-2 w-3 h-3 rounded-full ${getIdeologyColor(speech.ideology)} flex-shrink-0`}></div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {getSpeechTypeLabel(speech.speech_type)}
                      </span>
                      <span className={getScoreColor(speech.populism_score)}>
                        {speech.populism_score.toFixed(1)}
                      </span>
                    </div>
                    
                    {speech.party && (
                      <div className="text-xs text-gray-400 mt-1 truncate">{speech.party}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Speech Content */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {!selectedFilename ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="mt-2 text-sm">Select a speech to read its content</p>
              </div>
            </div>
          ) : contentLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading speech content...</p>
              </div>
            </div>
          ) : speechContent ? (
            <>
              {/* Speech Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {speeches.find((s) => s.filename === selectedFilename)?.leader}
                    </h2>
                    <div className="text-sm text-gray-600 mt-1">
                      {speeches.find((s) => s.filename === selectedFilename)?.country} •{' '}
                      {getSpeechTypeLabel(
                        speeches.find((s) => s.filename === selectedFilename)?.speech_type || ''
                      )}{' '}
                      Speech
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {speechContent.word_count.toLocaleString()} words
                    </div>
                  </div>
                  <div className="ml-4 flex items-start gap-2">
                    <div className="flex flex-col items-end">
                      <button
                        onClick={handleAnalyze}
                        disabled={analyzeMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      >
                        {analyzeMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            AI Analysis
                          </>
                        )}
                      </button>
                      <div className="text-xs text-gray-400 mt-1">
                        <code>us.anthropic.claude-sonnet-4-5-20250929-v1:0</code>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFilename(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Analysis Section */}
              {analysisData && (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-200">
                  <div className="p-4">
                    <button
                      onClick={() => setShowAnalysis(!showAnalysis)}
                      className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
                    >
                      <h3 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        AI Analysis
                      </h3>
                      <svg
                        className={`w-5 h-5 text-indigo-600 transition-transform ${showAnalysis ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showAnalysis && (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        <div>
                          <h4 className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">
                            Summary
                          </h4>
                          <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{analysisData.summary}</ReactMarkdown>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">
                            Populism Assessment
                          </h4>
                          <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{analysisData.populism_assessment}</ReactMarkdown>
                          </div>
                        </div>
                        
                        <div className="text-xs text-indigo-600 mt-2">
                          Analyzed {analysisData.analyzed_words.toLocaleString()} of {analysisData.total_words.toLocaleString()} words
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Speech Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="prose prose-sm prose-gray max-w-none">
                    <p className="whitespace-pre-wrap leading-relaxed text-gray-700">
                      {speechContent.content}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
