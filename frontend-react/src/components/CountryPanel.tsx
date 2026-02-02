import { useTimeline } from '@/hooks/useApi';
import type { TimelineItem } from '@/types';

interface CountryPanelProps {
  country: string | null;
  onClose: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 1.5) return 'bg-red-700';
  if (score >= 1.0) return 'bg-red-500';
  if (score >= 0.5) return 'bg-orange-400';
  if (score >= 0.2) return 'bg-yellow-400';
  return 'bg-green-300';
}

function ScoreBar({ score, label }: { score: number | null; label: string }) {
  if (score === null || score === undefined) return null;
  
  const percentage = Math.max((score / 2) * 100, 5); // minimum 5% for visibility
  
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="h-10 w-4 bg-gray-200 rounded-full overflow-hidden flex flex-col-reverse">
        <div
          className={`w-full rounded-full transition-all ${getScoreColor(score)}`}
          style={{ height: `${percentage}%` }}
        />
      </div>
      <span className="text-[8px] text-gray-400 text-center leading-tight">{label}</span>
      <span className="text-[10px] font-medium text-gray-600">{score.toFixed(1)}</span>
    </div>
  );
}

function TimelineItemCard({ item }: { item: TimelineItem }) {
  const scores = [
    { score: item.total_populism, label: 'Tot' },
    { score: item.campaign, label: 'Cmp' },
    { score: item.famous, label: 'Fam' },
    { score: item.international, label: 'Intl' },
    { score: item.ribbon, label: 'Rib' },
  ].filter(s => s.score !== null);

  return (
    <div className="p-2.5 bg-gray-50 rounded-lg mb-2 border border-gray-100">
      <div className="mb-2">
        <div className="font-semibold text-gray-800 text-sm leading-tight">{item.leader}</div>
        {item.party && <div className="text-[10px] text-gray-400 truncate">{item.party}</div>}
        <div className="text-[10px] text-primary-500 font-medium">
          {item.year_start}–{item.year_end}
        </div>
      </div>
      <div className="flex justify-around">
        {scores.map(({ score, label }) => (
          <ScoreBar key={label} score={score} label={label} />
        ))}
      </div>
    </div>
  );
}

export default function CountryPanel({ country, onClose }: CountryPanelProps) {
  const { data: timeline, isLoading } = useTimeline(country);

  if (!country) {
    return (
      <aside className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          <h3 className="font-medium text-gray-700">Select a Country</h3>
          <p className="text-sm mt-2">Click on a country on the map to view detailed populism data</p>
        </div>
      </aside>
    );
  }

  if (isLoading) {
    return (
      <aside className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b-2 border-primary-400 flex justify-between items-center">
        <h2 className="text-base font-bold text-primary-500">{country}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      {/* Timeline */}
      <div className="p-2 max-h-[520px] overflow-y-auto">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Leaders
        </h3>
        {timeline?.timeline && timeline.timeline.length > 0 ? (
          timeline.timeline.map((item, index) => (
            <TimelineItemCard key={`${item.leader}-${item.term}-${index}`} item={item} />
          ))
        ) : (
          <p className="text-gray-500 text-sm">No timeline data available</p>
        )}
      </div>
    </aside>
  );
}
