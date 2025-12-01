import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#2a2a2a] text-white py-6 border-t border-white/10 mt-auto">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 opacity-80">
            <span className="material-icons text-sm">copyright</span>
            <span className="text-sm">2025 FO Métaux. Tous droits réservés.</span>
          </div>
          <div className="flex gap-4">
            <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Mentions légales</a>
            <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Confidentialité</a>
            <span className="text-xs text-gray-500">v2.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
