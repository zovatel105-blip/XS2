import React, { useState } from 'react';
import { X, Music, LayoutGrid } from 'lucide-react';

const LAYOUT_OPTIONS = [
  { id: '2x1', name: '2 Opciones', description: 'Dos opciones horizontales', slots: 2, gridClass: 'grid-cols-2' },
  { id: '1x2', name: '2 Opciones', description: 'Dos opciones verticales', slots: 2, gridClass: 'grid-rows-2' },
];

const DemoLayoutPage = () => {
  const [selectedLayout] = useState(LAYOUT_OPTIONS[0]);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  
  // Crear opciones demo con imágenes de ejemplo
  const demoOptions = [
    {
      text: "Opción A - Esta es una demostración",
      media: { url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=500&h=800&fit=crop" }
    },
    {
      text: "Opción B - Muestra layouts fullscreen",
      media: { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=800&fit=crop" }
    }
  ];

  const getSlotsCount = () => selectedLayout.slots;
  const getLayoutStyle = () => selectedLayout.gridClass;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black">
        <button className="w-8 h-8 flex items-center justify-center text-white">
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-white font-bold">DEMO - Layouts Fullscreen</h1>
        <div className="w-8"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Central Zone - Full width always */}
        <div className="w-full bg-black flex flex-col relative">
          {/* Main Content Area - Fullscreen Layout Preview */}
          <div className="flex-1">
            <div className="w-full h-full">
              <div className={`grid gap-0 w-full h-full ${getLayoutStyle()}`}>
                {Array.from({ length: getSlotsCount() }, (_, index) => {
                  const option = demoOptions[index] || { text: '', media: null };
                  return (
                    <div
                      key={index}
                      className="relative bg-black overflow-hidden group w-full h-full min-h-0"
                    >
                      {/* Letter identifier */}
                      <div className="absolute top-4 left-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
                        {String.fromCharCode(65 + index)}
                      </div>

                      {/* Background */}
                      {option.media ? (
                        <img 
                          src={option.media.url} 
                          alt={`Opción ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                          <p className="text-gray-400 text-center">Subir imagen</p>
                        </div>
                      )}
                      
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40">
                        {/* Content text at bottom */}
                        {option.text && (
                          <div className="absolute bottom-4 left-4 right-4">
                            <p className="text-white font-medium text-lg leading-tight">
                              {option.text}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="bg-black border-t border-gray-800 p-3">
            <input
              type="text"
              placeholder="Describe tu publicación..."
              className="w-full bg-transparent text-white px-0 py-2 border-b border-gray-600 focus:border-white focus:outline-none placeholder-gray-400 text-base"
            />
            <div className="mt-2 flex items-center justify-between text-sm">
              <div className="text-gray-400">2 / 2 opciones</div>
            </div>
          </div>
        </div>

        {/* Floating Right Sidebar - Overlay on top of content */}
        <div className="absolute top-4 right-4 z-40 flex flex-col gap-3">
          {/* Add Sound Button */}
          <button className="w-12 h-12 bg-black/70 backdrop-blur-sm hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all shadow-lg border border-white/10">
            <Music className="w-6 h-6" />
          </button>

          {/* Layout Button */}
          <div className="relative">
            <button
              onClick={() => setShowLayoutMenu(!showLayoutMenu)}
              className="w-12 h-12 bg-black/70 backdrop-blur-sm hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all shadow-lg border border-white/10"
            >
              <LayoutGrid className="w-6 h-6" />
            </button>

            {/* Layout Menu */}
            {showLayoutMenu && (
              <div className="absolute right-full top-0 mr-3 w-64 bg-gray-900 rounded-lg shadow-xl overflow-hidden z-50 border border-white/10">
                <div className="py-2">
                  {LAYOUT_OPTIONS.map((layout) => (
                    <button
                      key={layout.id}
                      className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors text-gray-300"
                    >
                      <div className="font-medium">{layout.name}</div>
                      <div className="text-sm text-gray-400">{layout.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Publish Button */}
          <button className="w-12 h-12 bg-red-500/90 backdrop-blur-sm hover:bg-red-600/90 rounded-full flex items-center justify-center text-white transition-all shadow-lg border border-white/10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoLayoutPage;