import React from 'react';

/**
 * Componente de miniatura de poll que replica el layout completo del poll
 * Muestra todas las opciones con su layout original (grid, carousel, etc.)
 */
const PollThumbnail = ({ result, className = "", onClick }) => {
  if (!result || result.type !== 'post') {
    return null;
  }

  const options = result.options || [];
  const layout = result.layout || 'vertical';

  // Función para obtener las clases CSS del grid basado en el layout
  const getGridClasses = () => {
    switch (layout) {
      case 'vertical': // 2 columnas lado a lado
        return 'grid grid-cols-2 gap-0.5';
      case 'horizontal': // 2 filas arriba y abajo
        return 'grid grid-cols-1 grid-rows-2 gap-0.5';
      case 'triptych-vertical': // 3 columnas lado a lado
        return 'grid grid-cols-3 gap-0.5';
      case 'triptych-horizontal': // 3 filas arriba y abajo
        return 'grid grid-cols-1 grid-rows-3 gap-0.5';
      case 'grid-2x2': // 4 partes (cuadrícula 2x2)
        return 'grid grid-cols-2 grid-rows-2 gap-0.5';
      case 'grid-3x2': // 6 partes (cuadrícula 3x2)
        return 'grid grid-cols-3 grid-rows-2 gap-0.5';
      case 'horizontal-3x2': // 6 partes (cuadrícula 2x3)
        return 'grid grid-cols-2 grid-rows-3 gap-0.5';
      case 'off': // Carrusel - mostrar solo primera imagen
        return 'grid grid-cols-1 gap-0';
      default:
        return 'grid grid-cols-2 gap-0.5';
    }
  };

  // Función para obtener el número máximo de opciones según el layout
  const getMaxOptions = () => {
    switch (layout) {
      case 'vertical': return 2;
      case 'horizontal': return 2;
      case 'triptych-vertical': return 3;
      case 'triptych-horizontal': return 3;
      case 'grid-2x2': return 4;
      case 'grid-3x2': return 6;
      case 'horizontal-3x2': return 6;
      case 'off': return 1; // Solo mostrar primera imagen en carrusel
      default: return 2;
    }
  };

  // Filtrar opciones que tienen media y limitar según layout
  const optionsWithMedia = options.filter(option => 
    option.media_url || option.thumbnail_url
  ).slice(0, getMaxOptions());

  // Si no hay opciones con media, usar fallback
  if (optionsWithMedia.length === 0) {
    return (
      <div 
        className={`relative aspect-[6/11] bg-gradient-to-br from-blue-400 to-purple-500 cursor-pointer rounded-xl overflow-hidden flex items-center justify-center ${className}`}
        onClick={onClick}
      >
        <div className="text-center text-white">
          <div className="text-lg font-bold mb-1">📊</div>
          <div className="text-xs">Poll</div>
        </div>
      </div>
    );
  }

  // Para layout 'off' (carrusel), mostrar solo la primera imagen con indicador
  if (layout === 'off') {
    const firstOption = optionsWithMedia[0];
    return (
      <div 
        className={`relative aspect-[6/11] bg-gray-100 cursor-pointer rounded-xl overflow-hidden ${className}`}
        onClick={onClick}
      >
        <img
          src={firstOption.media_url || firstOption.thumbnail_url}
          alt={result.title || 'Poll option'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        {/* Indicador de carrusel */}
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <span>🎠</span>
          <span>{options.length}</span>
        </div>
      </div>
    );
  }

  // Para layouts de grid, mostrar todas las opciones en su layout correspondiente
  return (
    <div 
      className={`relative aspect-[6/11] bg-gray-100 cursor-pointer rounded-xl overflow-hidden ${className}`}
      onClick={onClick}
    >
      <div className={`w-full h-full ${getGridClasses()}`}>
        {optionsWithMedia.map((option, index) => (
          <div
            key={index}
            className="relative bg-gray-200 overflow-hidden"
            style={{ minHeight: '30px' }}
          >
            {(option.media_url || option.thumbnail_url) ? (
              <img
                src={option.media_url || option.thumbnail_url}
                alt={option.text || `Option ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Si falla la imagen, mostrar placeholder con texto
                  e.target.style.display = 'none';
                  const parent = e.target.parentElement;
                  const placeholder = document.createElement('div');
                  placeholder.className = 'absolute inset-0 bg-gray-300 flex items-center justify-center text-xs text-gray-600';
                  placeholder.textContent = option.text || `Option ${index + 1}`;
                  parent.appendChild(placeholder);
                }}
              />
            ) : (
              // Placeholder para opciones sin imagen
              <div className="absolute inset-0 bg-gray-300 flex items-center justify-center text-xs text-gray-600 p-1 text-center">
                {option.text || `Option ${index + 1}`}
              </div>
            )}
            
            {/* Overlay con texto de la opción si existe */}
            {option.text && (option.media_url || option.thumbnail_url) && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                {option.text.length > 15 ? `${option.text.substring(0, 15)}...` : option.text}
              </div>
            )}
          </div>
        ))}
        
        {/* Rellenar espacios vacíos en el grid si hay menos opciones que slots */}
        {Array.from({ length: Math.max(0, getMaxOptions() - optionsWithMedia.length) }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="bg-gray-200 flex items-center justify-center text-gray-400 text-xs"
          >
            <span>Empty</span>
          </div>
        ))}
      </div>

      {/* Badge con layout type en esquina superior izquierda */}
      <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
        {layout === 'vertical' && '2️⃣'}
        {layout === 'horizontal' && '⏸️'}
        {layout === 'triptych-vertical' && '3️⃣'}
        {layout === 'triptych-horizontal' && '3️⃣⏸️'}
        {layout === 'grid-2x2' && '4️⃣'}
        {layout === 'grid-3x2' && '6️⃣'}
        {layout === 'horizontal-3x2' && '6️⃣⏸️'}
        {layout === 'off' && '🎠'}
      </div>
    </div>
  );
};

export default PollThumbnail;