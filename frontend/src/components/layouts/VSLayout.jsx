import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Play } from 'lucide-react';

/**
 * VSLayout - Renderiza una experiencia VS en el feed
 * Muestra la primera pregunta con las opciones A vs B
 * Al hacer clic, navega a la experiencia completa
 */
const VSLayout = ({ 
  poll, 
  onVote, 
  isActive,
  isThumbnail = false
}) => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Obtener las opciones de la primera pregunta
  const options = poll.options || [];
  const vsQuestions = poll.vs_questions || [];
  const totalQuestions = vsQuestions.length || 1;

  // Colores para las opciones
  const optionStyles = [
    { bg: 'from-orange-500 to-amber-500', text: 'text-white' },
    { bg: 'from-blue-500 to-cyan-500', text: 'text-white' }
  ];

  const handleOptionClick = (optionId) => {
    if (hasVoted || isThumbnail) return;
    
    setSelectedOption(optionId);
    setHasVoted(true);
    setShowResults(true);
    
    // Llamar a onVote si existe
    if (onVote) {
      onVote(poll.id, optionId);
    }
  };

  const handleOpenFullExperience = () => {
    // Navegar a la experiencia VS completa
    navigate('/vs-experience', {
      state: {
        vsId: poll.vs_id || poll.id,
        questions: vsQuestions.length > 0 ? vsQuestions : [{
          id: poll.id,
          options: options.map(opt => ({
            id: opt.id,
            text: opt.text,
            image: opt.media_url || opt.thumbnail_url
          }))
        }]
      }
    });
  };

  const getPercentage = (optionId) => {
    const totalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
    if (totalVotes === 0) {
      // Simular porcentajes
      return optionId === selectedOption ? 65 : 35;
    }
    const optionVotes = options.find(o => o.id === optionId)?.votes || 0;
    return Math.round((optionVotes / totalVotes) * 100);
  };

  // Si es thumbnail, mostrar versión simplificada
  if (isThumbnail) {
    return (
      <div className="w-full h-full relative">
        <div className="absolute inset-0 flex flex-col">
          {options.slice(0, 2).map((option, index) => {
            const imageUrl = option.media?.url || option.media?.thumbnail || option.media_url || option.thumbnail_url;
            return (
              <div 
                key={option.id}
                className={cn(
                  "flex-1 relative overflow-hidden",
                  `bg-gradient-to-br ${optionStyles[index]?.bg || 'from-gray-600 to-gray-800'}`
                )}
              >
                {imageUrl && (
                  <img 
                    src={imageUrl} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/30" />
              </div>
            );
          })}
        </div>
        {/* VS Badge */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center border-2 border-white">
            <span className="text-white font-bold text-xs">VS</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Opciones A vs B */}
      <div className="absolute inset-0 flex flex-col">
        {options.slice(0, 2).map((option, index) => {
          const isSelected = selectedOption === option.id;
          const percentage = showResults ? getPercentage(option.id) : 0;
          // Obtener la URL de la imagen - puede estar en diferentes ubicaciones
          const imageUrl = option.media?.url || option.media?.thumbnail || option.media_url || option.thumbnail_url;
          
          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              disabled={hasVoted}
              className={cn(
                "flex-1 relative overflow-hidden transition-all duration-300",
                "flex items-center justify-center",
                isSelected && "ring-4 ring-white ring-inset"
              )}
            >
              {/* Background */}
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt="" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br",
                  optionStyles[index]?.bg || 'from-gray-600 to-gray-800'
                )} />
              )}
              
              {/* Overlay */}
              <div className={cn(
                "absolute inset-0 transition-opacity duration-300",
                option.media_url ? "bg-black/40" : "bg-black/20"
              )} />
              
              {/* Barra de resultado */}
              {showResults && (
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-white/30 transition-all duration-700"
                  style={{ height: `${percentage}%` }}
                />
              )}
              
              {/* Contenido */}
              <div className="relative z-10 text-center p-6">
                <h2 className="text-white font-bold text-2xl md:text-3xl drop-shadow-lg">
                  {option.text || `Opción ${index + 1}`}
                </h2>
                
                {showResults && (
                  <div className="mt-4 animate-in fade-in zoom-in">
                    <span className="text-5xl md:text-6xl font-black text-white drop-shadow-lg">
                      {percentage}%
                    </span>
                  </div>
                )}
              </div>
              
              {/* Check de selección */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* VS Badge */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className={cn(
          "w-16 h-16 md:w-20 md:h-20 rounded-full bg-black flex items-center justify-center",
          "shadow-2xl border-4 border-white"
        )}>
          <span className="text-white font-black text-xl md:text-2xl">VS</span>
        </div>
      </div>
      
      {/* Indicador de más preguntas */}
      {totalQuestions > 1 && (
        <button
          onClick={handleOpenFullExperience}
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 hover:bg-black/90 transition-all"
        >
          <Play className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">
            +{totalQuestions - 1} {totalQuestions === 2 ? 'pregunta más' : 'preguntas más'}
          </span>
        </button>
      )}
      
      {/* Línea divisora */}
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-black z-10 transform -translate-y-1/2" />
    </div>
  );
};

export default VSLayout;
