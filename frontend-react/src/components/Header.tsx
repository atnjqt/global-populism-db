import type { SummaryResponse } from '@/types';

interface HeaderProps {
  summary?: SummaryResponse;
}

export default function Header({ summary }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <svg
            className="w-9 h-9 opacity-90"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Global Populism Database
            </h1>
            <p className="text-sm text-blue-200/80 tracking-wide">Interactive visualization of populist rhetoric worldwide</p>
          </div>
        </div>
        
        {/* Stats Widget */}
        {summary && (
          <div className="flex items-center gap-6 bg-white/10 rounded-lg px-5 py-2">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{summary.total_records}</div>
              <div className="text-[10px] text-blue-200/70 uppercase tracking-wide">Records</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <div className="text-lg font-bold text-white">{summary.total_countries}</div>
              <div className="text-[10px] text-blue-200/70 uppercase tracking-wide">Countries</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <div className="text-lg font-bold text-white">{summary.total_leaders}</div>
              <div className="text-[10px] text-blue-200/70 uppercase tracking-wide">Leaders</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <div className="text-lg font-bold text-white">{summary.year_range.min}–{summary.year_range.max}</div>
              <div className="text-[10px] text-blue-200/70 uppercase tracking-wide">Years</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation Tabs */}
      <nav className="max-w-[1400px] mx-auto px-6 border-t border-white/10">
        <div className="flex">
          <button className="px-5 py-2.5 text-sm font-medium text-white border-b-2 border-blue-400 bg-white/10 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
            </svg>
            Map
          </button>
          <button className="px-5 py-2.5 text-sm font-medium text-blue-200/70 hover:text-white hover:bg-white/5 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
            </svg>
            Rankings
          </button>
          <button className="px-5 py-2.5 text-sm font-medium text-blue-200/70 hover:text-white hover:bg-white/5 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z" />
            </svg>
            About
          </button>
        </div>
      </nav>
    </header>
  );
}
