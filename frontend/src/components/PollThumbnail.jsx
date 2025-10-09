import React, { useState, useRef, useCallback } from 'react';
import { Check } from 'lucide-react';

/**
 * Componente de miniatura de poll que replica el layout completo del poll
 * Muestra todas las opciones con su layout original (grid, carousel, etc.)
 * @param {boolean} hideBadge - Si es true, oculta el badge de layout
 * @param {function} onQuickVote - Callback para votar rápidamente (pollId, optionIndex)
 */
const PollThumbnail = ({ result, className = "", onClick, hideBadge = false, onQuickVote }) => {
  const [showQuickVote, setShowQuickVote] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const longPressTimer = useRef(null);
  const containerRef = useRef(null);
  
  // Long press handlers - Nueva lógica
  const handlePressStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    longPressTimer.current = setTimeout(() => {
      setShowQuickVote(true);
    }, 300); // 300ms para mostrar opciones
  }, []);
  
  const handlePressMove = useCallback((e) => {
    if (!showQuickVote || !containerRef.current) return;
    
    // Obtener posición del touch/mouse
    let clientX, clientY;
    if (e.type.includes('touch')) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        return;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Encontrar elemento bajo el cursor
    const elements = document.elementsFromPoint(clientX, clientY);
    const optionElement = elements.find(el => el.dataset.optionIndex !== undefined);
    
    if (optionElement) {
      const optionIndex = parseInt(optionElement.dataset.optionIndex);
      setSelectedOption(optionIndex);
    } else {
      setSelectedOption(null);
    }
  }, [showQuickVote]);
  
  const handlePressEnd = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    // Si se mostró el menú y hay una opción seleccionada, votar
    if (showQuickVote && selectedOption !== null && onQuickVote && result) {
      await onQuickVote(result.id, selectedOption);
    }
    
    // Resetear estado
    setShowQuickVote(false);
    setSelectedOption(null);
    
    // Si no se mostró el menú, permitir click normal
    if (!showQuickVote && onClick) {
      onClick();
    }
  }, [showQuickVote, selectedOption, onQuickVote, result, onClick]);
  
  const handlePressCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setShowQuickVote(false);
    setSelectedOption(null);
  }, []);
  
  // Early return after hooks
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
        ref={containerRef}
        className={`relative aspect-[6/11] bg-gray-100 cursor-pointer rounded-xl overflow-hidden ${className}`}
        onMouseDown={handlePressStart}
        onMouseMove={handlePressMove}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressCancel}
        onTouchStart={handlePressStart}
        onTouchMove={handlePressMove}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressCancel}
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
        
        {/* Modal de votación rápida - Estilo Instagram */}
        {showQuickVote && (
          <div 
            className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-2"
            style={{ touchAction: 'none' }}
          >
            <div className="w-full h-full flex flex-col gap-1">
              <div className="text-white text-center mb-1 text-xs font-medium">
                Mantén presionado para votar
              </div>
              
              <div className="flex-1 flex flex-col gap-1">
                {options.map((option, index) => {
                  const isSelected = selectedOption === index;
                  const isVoted = result.user_vote === index;
                  const votePercentage = result.total_votes > 0 
                    ? Math.round((option.votes / result.total_votes) * 100) 
                    : 0;
                  
                  return (
                    <div
                      key={index}
                      data-option-index={index}
                      className={`relative flex-1 rounded-lg overflow-hidden transition-all duration-150 ${
                        isSelected 
                          ? 'ring-4 ring-blue-400 scale-105' 
                          : 'scale-100'
                      }`}
                      style={{ minHeight: '60px' }}
                    >
                      {/* Background Image */}
                      {(option.media_url || option.thumbnail_url) && (
                        <img 
                          src={option.media_url || option.thumbnail_url}
                          alt={option.text || `Option ${index + 1}`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                      
                      {/* Overlay */}
                      <div className={`absolute inset-0 transition-all duration-150 ${
                        isSelected 
                          ? 'bg-blue-500/40' 
                          : 'bg-black/30'
                      }`} />
                      
                      {/* Content */}
                      <div className="relative h-full flex items-center justify-between px-3 py-2">
                        <div className="flex-1">
                          <span className="text-white text-sm font-semibold drop-shadow-lg">
                            {option.text || `Opción ${index + 1}`}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isVoted && (
                            <div className="bg-white/90 rounded-full p-1">
                              <Check size={14} className="text-blue-500" />
                            </div>
                          )}
                          {isSelected && (
                            <div className="bg-blue-500 rounded-full p-2 animate-pulse">
                              <Check size={16} className="text-white" />
                            </div>
                          )}
                          <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-full">
                            {votePercentage}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div 
                        className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-500"
                        style={{ width: `${votePercentage}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              
              <div className="text-center text-white text-xs opacity-70 mt-1">
                {selectedOption !== null ? '✓ Suelta para votar' : 'Desliza para seleccionar'}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Para layouts de grid, mostrar todas las opciones en su layout correspondiente
  return (
    <div 
      ref={containerRef}
      className={`relative aspect-[6/11] bg-black cursor-pointer rounded-xl overflow-hidden ${className}`}
      onMouseDown={handlePressStart}
      onMouseMove={handlePressMove}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressCancel}
      onTouchStart={handlePressStart}
      onTouchMove={handlePressMove}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressCancel}
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
            className="bg-gray-800 flex items-center justify-center text-gray-400 text-xs"
          >
            <span>Empty</span>
          </div>
        ))}
      </div>

      {/* Badge con layout type en esquina superior izquierda - Solo si hideBadge es false */}
      {!hideBadge && (
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
      )}
      
      {/* Modal de votación rápida - Estilo Instagram */}
      {showQuickVote && (
        <div 
          className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-2"
          style={{ touchAction: 'none' }}
        >
          <div className="w-full h-full flex flex-col gap-1">
            <div className="text-white text-center mb-1 text-xs font-medium">
              Mantén presionado para votar
            </div>
            
            <div className="flex-1 flex flex-col gap-1">
              {options.map((option, index) => {
                const isSelected = selectedOption === index;
                const isVoted = result.user_vote === index;
                const votePercentage = result.total_votes > 0 
                  ? Math.round((option.votes / result.total_votes) * 100) 
                  : 0;
                
                return (
                  <div
                    key={index}
                    data-option-index={index}
                    className={`relative flex-1 rounded-lg overflow-hidden transition-all duration-150 ${
                      isSelected 
                        ? 'ring-4 ring-blue-400 scale-105' 
                        : 'scale-100'
                    }`}
                    style={{ minHeight: '60px' }}
                  >
                    {/* Background Image */}
                    {(option.media_url || option.thumbnail_url) && (
                      <img 
                        src={option.media_url || option.thumbnail_url}
                        alt={option.text || `Option ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Overlay */}
                    <div className={`absolute inset-0 transition-all duration-150 ${
                      isSelected 
                        ? 'bg-blue-500/40' 
                        : 'bg-black/30'
                    }`} />
                    
                    {/* Content */}
                    <div className="relative h-full flex items-center justify-between px-3 py-2">
                      <div className="flex-1">
                        <span className="text-white text-sm font-semibold drop-shadow-lg">
                          {option.text || `Opción ${index + 1}`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isVoted && (
                          <div className="bg-white/90 rounded-full p-1">
                            <Check size={14} className="text-blue-500" />
                          </div>
                        )}
                        {isSelected && (
                          <div className="bg-blue-500 rounded-full p-2 animate-pulse">
                            <Check size={16} className="text-white" />
                          </div>
                        )}
                        <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-full">
                          {votePercentage}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div 
                      className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-500"
                      style={{ width: `${votePercentage}%` }}
                    />
                  </div>
                );
              })}
            </div>
            
            <div className="text-center text-white text-xs opacity-70 mt-1">
              {selectedOption !== null ? '✓ Suelta para votar' : 'Desliza para seleccionar'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollThumbnail;