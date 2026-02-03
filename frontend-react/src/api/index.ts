import type { 
  CountriesResponse, 
  DataResponse, 
  SummaryResponse, 
  MapDataItem,
  TimelineResponse,
  SpeechType,
  SpeechesResponse,
  SpeechContentResponse,
  SpeechAnalysisResponse,
  BedrockModel
} from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || 'https://global-populism-db.ejacquot.com/api';

export async function fetchSummary(): Promise<SummaryResponse> {
  const response = await fetch(`${API_BASE}/summary`);
  if (!response.ok) throw new Error('Failed to fetch summary');
  return response.json();
}

export async function fetchCountries(): Promise<CountriesResponse> {
  const response = await fetch(`${API_BASE}/countries`);
  if (!response.ok) throw new Error('Failed to fetch countries');
  return response.json();
}

export async function fetchData(params?: {
  country?: string;
  leader?: string;
  year_start?: number;
  year_end?: number;
  min_populism?: number;
}): Promise<DataResponse> {
  const searchParams = new URLSearchParams();
  if (params?.country) searchParams.set('country', params.country);
  if (params?.leader) searchParams.set('leader', params.leader);
  if (params?.year_start) searchParams.set('year_start', params.year_start.toString());
  if (params?.year_end) searchParams.set('year_end', params.year_end.toString());
  if (params?.min_populism) searchParams.set('min_populism', params.min_populism.toString());

  const response = await fetch(`${API_BASE}/data?${searchParams}`);
  if (!response.ok) throw new Error('Failed to fetch data');
  return response.json();
}

export async function fetchMapData(params?: {
  year_start?: number;
  year_end?: number;
  speech_type?: SpeechType;
  time_weighted?: boolean;
  ideology?: number | null;
}): Promise<MapDataItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.year_start) searchParams.set('year_start', params.year_start.toString());
  if (params?.year_end) searchParams.set('year_end', params.year_end.toString());
  if (params?.speech_type) searchParams.set('speech_type', params.speech_type);
  if (params?.time_weighted) searchParams.set('time_weighted', 'true');
  if (params?.ideology !== undefined && params?.ideology !== null) {
    searchParams.set('ideology', params.ideology.toString());
  }

  const response = await fetch(`${API_BASE}/map-data?${searchParams}`);
  if (!response.ok) throw new Error('Failed to fetch map data');
  const data = await response.json();
  return data.map_data;  // Extract the array from the response object
}

export async function fetchTimeline(country: string): Promise<TimelineResponse> {
  const response = await fetch(`${API_BASE}/timeline/${encodeURIComponent(country)}`);
  if (!response.ok) throw new Error('Failed to fetch timeline');
  return response.json();
}

export async function fetchSpeeches(params?: {
  country?: string;
  ideology?: number;
  speech_type?: string;
}): Promise<SpeechesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.country) searchParams.set('country', params.country);
  if (params?.ideology !== undefined) searchParams.set('ideology', params.ideology.toString());
  if (params?.speech_type && params.speech_type !== 'total') {
    searchParams.set('speech_type', params.speech_type);
  }

  const response = await fetch(`${API_BASE}/speeches?${searchParams}`);
  if (!response.ok) throw new Error('Failed to fetch speeches');
  return response.json();
}

export async function fetchSpeechContent(filename: string): Promise<SpeechContentResponse> {
  const response = await fetch(`${API_BASE}/speeches/${encodeURIComponent(filename)}`);
  if (!response.ok) throw new Error('Failed to fetch speech content');
  return response.json();
}

export async function analyzeSpeech(filename: string, model_id?: string): Promise<SpeechAnalysisResponse> {
  let url = `${API_BASE}/speeches/${encodeURIComponent(filename)}/analyze`;
  if (model_id) {
    url += `?model_id=${encodeURIComponent(model_id)}`;
  }
  const response = await fetch(url, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to analyze speech');
  return response.json();
}

export async function fetchModels(): Promise<{ models: BedrockModel[] }> {
  const response = await fetch(`${API_BASE}/models`);
  if (!response.ok) throw new Error('Failed to fetch models');
  return response.json();
}
