import type { SpeechType, Ideology } from '@/types';

interface SidebarProps {
  yearStart: number;
  yearEnd: number;
  speechType: SpeechType;
  ideology: Ideology | null;
  colorByIdeology: boolean;
  onYearStartChange: (year: number) => void;
  onYearEndChange: (year: number) => void;
  onSpeechTypeChange: (type: SpeechType) => void;
  onIdeologyChange: (ideology: Ideology | null) => void;
  onColorByIdeologyChange: (value: boolean) => void;
}

const SPEECH_TYPES: { value: SpeechType; label: string }[] = [
  { value: 'total', label: 'Total Average' },
  { value: 'campaign', label: 'Campaign Speeches' },
  { value: 'famous', label: 'Famous Speeches' },
  { value: 'international', label: 'International Speeches' },
  { value: 'ribbon', label: 'Ribbon-cutting' },
];

export default function Sidebar({
  yearStart,
  yearEnd,
  speechType,
  ideology,
  colorByIdeology,
  onYearStartChange,
  onYearEndChange,
  onSpeechTypeChange,
  onIdeologyChange,
  onColorByIdeologyChange,
}: SidebarProps) {
  return (
    <aside className="space-y-4">
      {/* Filters Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Year Range Section */}
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Time Period
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Start Year</label>
              <input
                type="range"
                min={1934}
                max={2026}
                value={yearStart}
                onChange={(e) => onYearStartChange(Number(e.target.value))}
                className="w-full accent-primary-400"
              />
              <div className="text-center font-medium text-primary-500">{yearStart}</div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">End Year</label>
              <input
                type="range"
                min={1934}
                max={2026}
                value={yearEnd}
                onChange={(e) => onYearEndChange(Number(e.target.value))}
                className="w-full accent-primary-400"
              />
              <div className="text-center font-medium text-primary-500">{yearEnd}</div>
            </div>
          </div>
        </div>

        {/* Color Mode Toggle */}
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Color Mode
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() => onColorByIdeologyChange(false)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                !colorByIdeology
                  ? 'bg-gray-700 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Populism Only
            </button>
            <button
              onClick={() => onColorByIdeologyChange(true)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                colorByIdeology
                  ? 'bg-gray-700 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              By Ideology
            </button>
          </div>
        </div>

        {/* Ideology Filter Section - always visible */}
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Filter by Ideology
          </h3>
          <div className="flex gap-1">
            {[
              { value: -1 as Ideology, label: 'Left', color: 'bg-blue-500', activeColor: 'bg-blue-600' },
              { value: 0 as Ideology, label: 'Center', color: 'bg-emerald-500', activeColor: 'bg-emerald-600' },
              { value: 1 as Ideology, label: 'Right', color: 'bg-red-500', activeColor: 'bg-red-600' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => onIdeologyChange(ideology === item.value ? null : item.value)}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                  ideology === item.value
                    ? `${item.activeColor} text-white shadow-md`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {ideology !== null && (
            <button
              onClick={() => onIdeologyChange(null)}
              className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Speech Type Section */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Speech Type
          </h3>
          <select
            value={speechType}
            onChange={(e) => onSpeechTypeChange(e.target.value as SpeechType)}
            className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-primary-400 focus:outline-none text-sm"
          >
            {SPEECH_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
}
