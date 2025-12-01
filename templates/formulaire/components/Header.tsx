import React from 'react';
import { Button } from './Button';

interface HeaderProps {
  onPreview: () => void;
  onDownload: () => void;
  onShare: () => void;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onPreview, onDownload, onShare, hasData }) => {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm transition-all duration-300"
      role="banner"
    >
      <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo Area */}
        <div className="flex items-center gap-4 group cursor-pointer">
          <div
            className="w-12 h-12 bg-[#aa4584] rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300"
            role="img"
            aria-label="Logo DocEase"
          >
             <span className="material-icons text-white text-2xl" aria-hidden="true">description</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-[#aa4584]">DocEase</h1>
            <span className="text-xs font-medium text-[#2f2f2f] uppercase tracking-widest hidden sm:block">by FO Métaux</span>
          </div>
        </div>

        {/* Action Buttons */}
        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Actions principales">
          <Button
            variant="primary"
            icon="visibility"
            label="Prévisualiser"
            onClick={onPreview}
            disabled={!hasData}
            className="hidden sm:inline-flex"
            aria-label="Prévisualiser le document"
          />
          <button
             onClick={onPreview}
             disabled={!hasData}
             className="sm:hidden w-10 h-10 flex items-center justify-center rounded-full bg-[#aa4584] text-white disabled:opacity-50 transition-all hover:scale-105"
             aria-label="Prévisualiser le document"
             title="Prévisualiser"
          >
             <span className="material-icons" aria-hidden="true">visibility</span>
          </button>

          <Button
            variant="secondary"
            icon="download"
            label="Télécharger"
            onClick={onDownload}
            disabled={!hasData}
            className="hidden md:inline-flex"
            aria-label="Télécharger le document Word"
          />
           <button
             onClick={onDownload}
             disabled={!hasData}
             className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-[#dd60b0] text-white disabled:opacity-50 transition-all hover:scale-105"
             aria-label="Télécharger le document Word"
             title="Télécharger Word"
          >
             <span className="material-icons" aria-hidden="true">download</span>
          </button>

          <Button
            variant="outlined"
            icon="share"
            label="Partager"
            onClick={onShare}
            disabled={!hasData}
            className="hidden sm:inline-flex"
            aria-label="Partager le document par email"
          />
           <button
             onClick={onShare}
             disabled={!hasData}
             className="sm:hidden w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 bg-white text-[#aa4584] disabled:opacity-50 transition-all hover:scale-105"
             aria-label="Partager le document par email"
             title="Partager"
          >
             <span className="material-icons" aria-hidden="true">share</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
