// Types for the Global Populism Database API

export interface PopulismRecord {
  country: string;
  leader: string;
  party: string;
  lr: number; // Left-Right ideology: -1=left, 0=center, 1=right
  president: number;
  term: number;
  startofterm: string;
  yearbegin: number;
  endofterm: string;
  yearend: string | number;
  wb_region: string;
  region: string;
  totalaverage: number;
  campaign_file: string | null;
  campaign_1: number | null;
  campaign_2: number | null;
  campaign_3: number | null;
  campaign_4: number | null;
  campaign_average: number | null;
  famous_file: string | null;
  famous_1: number | null;
  famous_2: number | null;
  famous_3: number | null;
  famous_4: number | null;
  famous_average: number | null;
  international_file: string | null;
  international_1: number | null;
  international_2: number | null;
  international_3: number | null;
  international_4: number | null;
  international_average: number | null;
  ribbon_file: string | null;
  ribbon_1: number | null;
  ribbon_2: number | null;
  ribbon_3: number | null;
  ribbon_4: number | null;
  ribbon_average: number | null;
}

export interface CountriesResponse {
  countries: string[];
  count: number;
}

export interface DataResponse {
  data: PopulismRecord[];
  count: number;
}

export interface SummaryResponse {
  total_records: number;
  total_countries: number;
  total_leaders: number;
  year_range: {
    min: number;
    max: number;
  };
  populism_stats: {
    mean: number;
    median: number;
    min: number;
    max: number;
  };
  regions: Record<string, number>;
  speech_types: {
    campaign: number;
    famous: number;
    international: number;
    ribbon: number;
  };
}

export interface MapDataItem {
  country: string;
  avg_populism: number;
  region: string;
  wb_region: string;
  ideology: number;
  num_terms: number;
}

export interface MapDataResponse extends Array<MapDataItem> {}

export interface TimelineItem {
  leader: string;
  party: string | null;
  term: number;
  year_start: number;
  year_end: number | string;
  total_populism: number;
  campaign: number | null;
  famous: number | null;
  international: number | null;
  ribbon: number | null;
}

export interface TimelineResponse {
  country: string;
  timeline: TimelineItem[];
  count: number;
}

export interface SpeechItem {
  filename: string;
  country: string;
  leader: string;
  party: string | null;
  ideology: number | null;
  ideology_label: string;
  speech_type: string;
  populism_score: number;
  year_start: number;
  year_end: number | string;
  term: number;
}

export interface SpeechesResponse {
  speeches: SpeechItem[];
  count: number;
  filters: {
    country?: string;
    ideology?: number;
    speech_type?: string;
  };
}

export interface SpeechContentResponse {
  filename: string;
  content: string;
  word_count: number;
}

export interface SpeechAnalysisResponse {
  filename: string;
  summary: string;
  populism_assessment: string;
  analyzed_words: number;
  total_words: number;
}

export type SpeechType = 'total' | 'campaign' | 'famous' | 'international' | 'ribbon';

export type Ideology = -1 | 0 | 1;  // -1=Left, 0=Center, 1=Right

export interface FilterState {
  yearStart: number;
  yearEnd: number;
  speechType: SpeechType;
  ideology: Ideology | null;
  selectedCountry: string | null;
}
