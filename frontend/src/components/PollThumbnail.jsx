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
  const [isHolding, setIsHolding] = useState(false);
  const longPressTimer = useRef(null);
  const containerRef = useRef(null);
  
  if (!result || result.type !== 'post') {
    return null;
  }

  const options = result.options || [];
  const layout = result.layout || 'vertical';
  
  // Long press handlers - Nueva lógica
  const handlePressStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsHolding(true);
    longPressTimer.current = setTimeout(() => {
      setShowQuickVote(true);
    }, 300); // 300ms para mostrar opciones
  };
  
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
  
  const handlePressEnd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    // Si se mostró el menú y hay una opción seleccionada, votar
    if (showQuickVote && selectedOption !== null && onQuickVote) {
      await onQuickVote(result.id, selectedOption);
    }
    
    // Resetear estado
    setShowQuickVote(false);
    setSelectedOption(null);
    setIsHolding(false);
    
    // Si no se mostró el menú, permitir click normal
    if (!showQuickVote && onClick) {
      onClick();
    }
  };
  
  const handlePressCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setShowQuickVote(false);
    setSelectedOption(null);
    setIsHolding(false);
  };

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
        onClick={showQuickVote ? undefined : onClick}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onTouchCancel={handleLongPressEnd}
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
        
        {/* Modal de votación rápida */}
        {showQuickVote && (
          <div 
            className="absolute inset-0 bg-black/95 backdrop-blur-sm z-50 flex flex-col justify-center items-center p-4 animate-fadeIn"
            onClick={handleCloseQuickVote}
          >
            <div className="w-full max-w-sm space-y-2" onClick={(e) => e.stopPropagation()}>
              <div className="text-white text-center mb-4">
                <h3 className="font-semibold text-sm mb-1">Votación Rápida</h3>
                <p className="text-xs text-gray-300">Selecciona una opción</p>
              </div>
              
              {options.map((option, index) => {
                const isVoted = result.user_vote === index;
                const votePercentage = result.total_votes > 0 
                  ? Math.round((option.votes / result.total_votes) * 100) 
                  : 0;
                
                return (
                  <button
                    key={index}
                    onClick={(e) => handleQuickVoteClick(index, e)}
                    className={`w-full relative overflow-hidden rounded-lg transition-all duration-200 ${
                      isVoted 
                        ? 'bg-blue-500/90 ring-2 ring-blue-400' 
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {/* Progress bar */}
                    <div 
                      className="absolute inset-0 bg-blue-500/30 transition-all duration-500"
                      style={{ width: `${votePercentage}%` }}
                    />
                    
                    <div className="relative flex items-center justify-between px-4 py-3">
                      <div className="flex items-center space-x-3 flex-1">
                        {/* Thumbnail */}
                        {(option.media_url || option.thumbnail_url) && (
                          <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                            <img 
                              src={option.media_url || option.thumbnail_url}
                              alt={option.text || `Option ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Text */}
                        <span className="text-white text-sm font-medium text-left">
                          {option.text || `Opción ${index + 1}`}
                        </span>
                      </div>
                      
                      {/* Vote indicator and percentage */}
                      <div className="flex items-center space-x-2">
                        {isVoted && (
                          <div className="bg-white rounded-full p-1">
                            <Check size={12} className="text-blue-500" />
                          </div>
                        )}
                        <span className="text-white text-xs font-semibold">
                          {votePercentage}%
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
              
              <button
                onClick={handleCloseQuickVote}
                className="w-full mt-4 py-2 text-white text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Para layouts de grid, mostrar todas las opciones en su layout correspondiente
  return (
    <div 
      className={`relative aspect-[6/11] bg-black cursor-pointer rounded-xl overflow-hidden ${className}`}
      onClick={showQuickVote ? undefined : onClick}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onTouchCancel={handleLongPressEnd}
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
      
      {/* Modal de votación rápida */}
      {showQuickVote && (
        <div 
          className="absolute inset-0 bg-black/95 backdrop-blur-sm z-50 flex flex-col justify-center items-center p-4 animate-fadeIn"
          onClick={handleCloseQuickVote}
        >
          <div className="w-full max-w-sm space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="text-white text-center mb-4">
              <h3 className="font-semibold text-sm mb-1">Votación Rápida</h3>
              <p className="text-xs text-gray-300">Selecciona una opción</p>
            </div>
            
            {options.map((option, index) => {
              const isVoted = result.user_vote === index;
              const votePercentage = result.total_votes > 0 
                ? Math.round((option.votes / result.total_votes) * 100) 
                : 0;
              
              return (
                <button
                  key={index}
                  onClick={(e) => handleQuickVoteClick(index, e)}
                  className={`w-full relative overflow-hidden rounded-lg transition-all duration-200 ${
                    isVoted 
                      ? 'bg-blue-500/90 ring-2 ring-blue-400' 
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {/* Progress bar */}
                  <div 
                    className="absolute inset-0 bg-blue-500/30 transition-all duration-500"
                    style={{ width: `${votePercentage}%` }}
                  />
                  
                  <div className="relative flex items-center justify-between px-4 py-3">
                    <div className="flex items-center space-x-3 flex-1">
                      {/* Thumbnail */}
                      {(option.media_url || option.thumbnail_url) && (
                        <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                          <img 
                            src={option.media_url || option.thumbnail_url}
                            alt={option.text || `Option ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Text */}
                      <span className="text-white text-sm font-medium text-left">
                        {option.text || `Opción ${index + 1}`}
                      </span>
                    </div>
                    
                    {/* Vote indicator and percentage */}
                    <div className="flex items-center space-x-2">
                      {isVoted && (
                        <div className="bg-white rounded-full p-1">
                          <Check size={12} className="text-blue-500" />
                        </div>
                      )}
                      <span className="text-white text-xs font-semibold">
                        {votePercentage}%
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            
            <button
              onClick={handleCloseQuickVote}
              className="w-full mt-4 py-2 text-white text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollThumbnail;