import React, { useState, useEffect, memo } from 'react';
import { Template } from '../types';
import { OptimizedImage } from './OptimizedImage';

interface SidebarProps {
  templates: Template[];
  selectedTemplate: string | null;
  onSelect: (id: string) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

const SidebarComponent: React.FC<SidebarProps> = ({ templates, selectedTemplate, onSelect, isOpenMobile, setIsOpenMobile }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Handle click outside to close on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpenMobile(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsOpenMobile]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpenMobile(false)}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40 md:z-0
          w-[280px] bg-white border-r border-gray-100 shadow-2xl md:shadow-none
          transform transition-transform duration-300 ease-in-out
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col h-full
        `}
        role="complementary"
        aria-label="Sélection de modèles de documents"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="material-icons text-[#aa4584]" aria-hidden="true">dashboard</span>
            Modèles
          </h2>
          <button
            className="md:hidden p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            onClick={() => setIsOpenMobile(false)}
            aria-label="Fermer le menu des modèles"
          >
            <span className="material-icons" aria-hidden="true">close</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" aria-label="Liste des modèles">
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => {
                onSelect(template.id);
                setIsOpenMobile(false);
              }}
              className={`
                group relative p-3 rounded-2xl cursor-pointer transition-all duration-300 border-2 w-full text-left
                ${selectedTemplate === template.id
                  ? 'border-[#aa4584] bg-[#ffd8ec]/30 shadow-md'
                  : 'border-transparent hover:bg-gray-50 hover:border-gray-200'}
              `}
              aria-pressed={selectedTemplate === template.id}
              aria-label={`Sélectionner le modèle ${template.title}`}
            >
              <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 relative shadow-sm group-hover:shadow-md transition-shadow">
                <OptimizedImage
                  src={template.image}
                  alt={`Aperçu du modèle ${template.title}`}
                  className="w-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {selectedTemplate === template.id && (
                  <div className="absolute inset-0 bg-[#aa4584]/20 flex items-center justify-center" aria-hidden="true">
                    <div className="w-8 h-8 bg-[#aa4584] rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      <span className="material-icons text-white text-sm">check</span>
                    </div>
                  </div>
                )}
              </div>
              <h3 className={`font-bold text-sm text-center ${selectedTemplate === template.id ? 'text-[#aa4584]' : 'text-gray-700'}`}>
                {template.title}
              </h3>
              {template.description && (
                <p className="text-xs text-gray-500 text-center mt-1">
                  {template.description}
                </p>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50" role="status" aria-live="polite">
           <p className="text-xs text-center text-gray-400">
             Sélectionnez un modèle pour commencer
           </p>
        </div>
      </aside>

      {/* Mobile Toggle Button (Fixed Bottom) */}
      {!isOpenMobile && (
        <button
          onClick={() => setIsOpenMobile(true)}
          className="md:hidden fixed bottom-6 left-6 z-40 bg-[#2f2f2f] text-white p-4 rounded-full shadow-xl flex items-center gap-2 hover:scale-105 transition-transform"
          aria-label="Ouvrir le menu des modèles"
        >
           <span className="material-icons" aria-hidden="true">dashboard</span>
           <span className="font-bold">Templates</span>
        </button>
      )}
    </>
  );
};

// Mémoriser le composant pour éviter les re-renders inutiles
export const Sidebar = memo(SidebarComponent);