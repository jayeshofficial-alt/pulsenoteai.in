import React, { useState, useRef, useEffect } from 'react';
import { SearchFormatLens, FORMAT_LENSES, FormatLensOption } from '../types';
import { Search, Sparkles, PenTool, Code, TrendingUp, ChevronDown, Check } from 'lucide-react';

interface FormatLensDropdownProps {
  currentLens: SearchFormatLens;
  onSelectLens: (lens: SearchFormatLens) => void;
  compact?: boolean;
  dropDirection?: 'down' | 'up' | 'auto';
  align?: 'left' | 'right';
}

export const FormatLensDropdown: React.FC<FormatLensDropdownProps> = ({
  currentLens,
  onSelectLens,
  compact = false,
  dropDirection = 'down',
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const activeLens = FORMAT_LENSES.find((l) => l.id === currentLens) || FORMAT_LENSES[0];

  const getIcon = (iconName: FormatLensOption['iconName'], className: string = 'w-4 h-4') => {
    switch (iconName) {
      case 'Search':
        return <Search className={className} />;
      case 'PenTool':
        return <PenTool className={className} />;
      case 'Code':
        return <Code className={className} />;
      case 'TrendingUp':
        return <TrendingUp className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const alignmentClass = align === 'right' ? 'right-0' : 'left-0';
  const directionClass = dropDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 sm:gap-2 rounded-2xl border transition-all duration-200 cursor-pointer ${
          compact
            ? 'px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-xs shadow-sm'
            : 'px-3 py-1.5 sm:px-3.5 sm:py-2 bg-slate-900/90 hover:bg-slate-850 border-slate-700/80 hover:border-slate-600 shadow-md text-xs sm:text-sm font-semibold'
        } ${isOpen ? 'ring-2 ring-teal-500/40 border-teal-500/60 bg-slate-850' : ''}`}
        title="Select Output Format & Lens (General Assistant)"
      >
        <span className={`p-1 rounded-lg ${activeLens.badgeColor} shrink-0`}>
          {getIcon(activeLens.iconName, 'w-3.5 h-3.5 sm:w-4 sm:h-4')}
        </span>
        <span className="text-white font-medium truncate max-w-[130px] sm:max-w-[170px]">
          {activeLens.label}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-teal-400' : ''
          }`}
        />
      </button>

      {/* Expandable Dropdown Menu Overlay: Absolute, z-index 9999, max-h-60, overflow-y-auto */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            zIndex: 9999,
            maxHeight: '240px',
          }}
          className={`absolute ${directionClass} ${alignmentClass} w-72 sm:w-80 rounded-2xl bg-slate-900/98 border border-slate-700 shadow-2xl backdrop-blur-2xl z-[9999] p-2 animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto`}
        >
          <div className="sticky top-0 bg-slate-900/98 backdrop-blur-md px-3 py-1.5 border-b border-slate-800/80 mb-1 z-10 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-300">
                Output Format & Lens
              </div>
              <div className="text-[10px] text-slate-400">
                Calibrate AI reasoning depth and structure
              </div>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
              5 Lenses
            </span>
          </div>

          <div className="space-y-1">
            {FORMAT_LENSES.map((option) => {
              const isSelected = option.id === currentLens;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onSelectLens(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/95 text-white shadow-sm border border-slate-700/80'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isSelected ? option.badgeColor : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {getIcon(option.iconName, 'w-4 h-4')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold truncate">
                        {option.label}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mt-0.5">
                      {option.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

