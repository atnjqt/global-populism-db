import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchSummary, fetchCountries, fetchData, fetchMapData, fetchTimeline, fetchSpeeches, fetchSpeechContent, analyzeSpeech } from '@/api';
import type { SpeechType } from '@/types';

export function useSummary() {
  return useQuery({
    queryKey: ['summary'],
    queryFn: fetchSummary,
  });
}

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
  });
}

export function useData(params?: {
  country?: string;
  leader?: string;
  year_start?: number;
  year_end?: number;
  min_populism?: number;
}) {
  return useQuery({
    queryKey: ['data', params],
    queryFn: () => fetchData(params),
  });
}

export function useMapData(params?: {
  year_start?: number;
  year_end?: number;
  speech_type?: SpeechType;
  time_weighted?: boolean;
  ideology?: number | null;
}) {
  return useQuery({
    queryKey: ['map-data', params],
    queryFn: () => fetchMapData(params),
  });
}

export function useTimeline(country: string | null) {
  return useQuery({
    queryKey: ['timeline', country],
    queryFn: () => fetchTimeline(country!),
    enabled: !!country,
  });
}

export function useSpeeches(params?: {
  country?: string;
  ideology?: number;
  speech_type?: string;
}) {
  return useQuery({
    queryKey: ['speeches', params],
    queryFn: () => fetchSpeeches(params),
  });
}

export function useSpeechContent(filename: string | null) {
  return useQuery({
    queryKey: ['speech-content', filename],
    queryFn: () => fetchSpeechContent(filename!),
    enabled: !!filename,
  });
}

export function useAnalyzeSpeech() {
  return useMutation({
    mutationFn: (filename: string) => analyzeSpeech(filename),
  });
}
