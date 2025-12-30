import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Play } from 'lucide-react';

/**
 * VSLayout - Renderiza una experiencia VS en el feed
 * Diseño estilo "¿Qué prefieres?" con colores de fondo y temporizador
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
  const [timeLeft, setTimeLeft] = useState(5);

  // Obtener las opciones de la primera pregunta
  const options = poll.options || [];
  const vsQuestions = poll.vs_questions || [];
  const totalQuestions = vsQuestions.length || 1;

  // Colores de fondo para las opciones (estilo bandera)
  const bgColors = [
    'bg-gradient-to-b from-amber-400 to-orange-500', // Naranja/Amarillo
    'bg-gradient-to-b from-red-500 to-red-700'       // Rojo
  ];

  // Temporizador de 5 segundos
  useEffect(() => {
    if (!isActive || hasVoted || isThumbnail) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, hasVoted, isThumbnail]);

  const handleOptionClick = (optionId) => {
    if (hasVoted || isThumbnail) return;
    
    setSelectedOption(optionId);
    setHasVoted(true);
    setShowResults(true);
    
    if (onVote) {
      onVote(poll.id, optionId);
    }
  };

  const handleOpenFullExperience = () => {
    navigate('/vs-experience', {
      state: {
        vsId: poll.vs_id || poll.id,
        questions: vsQuestions.length > 0 ? vsQuestions : [{
          id: poll.id,
          options: options.map(opt => ({
            id: opt.id,
            text: opt.text,
            image: opt.media?.url || opt.media?.thumbnail || opt.media_url || opt.thumbnail_url
          }))
        }]
      }
    });
  };

  const getPercentage = (optionId) => {
    const totalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
    if (totalVotes === 0) {
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
                className={cn("flex-1 relative overflow-hidden", bgColors[index])}
              >
                {imageUrl && (
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    <img 
                      src={imageUrl} 
                      alt="" 
                      className="max-w-[80%] max-h-[80%] object-contain rounded-xl shadow-lg"
                    />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/10" />
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
          const imageUrl = option.media?.url || option.media?.thumbnail || option.media_url || option.thumbnail_url;
          
          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              disabled={hasVoted}
              className={cn(
                "flex-1 relative overflow-hidden transition-all duration-300",
                "flex flex-col items-center justify-center",
                bgColors[index],
                isSelected && "ring-4 ring-white ring-inset"
              )}
            >
              {/* Imagen centrada con borde redondeado */}
              {imageUrl && (
                <div className="relative z-10 w-[85%] max-w-[300px] aspect-[4/3] mb-3">
                  <img 
                    src={imageUrl} 
                    alt="" 
                    className={cn(
                      "w-full h-full object-cover rounded-2xl shadow-2xl border-4 border-white/30",
                      "transition-transform duration-300",
                      isSelected && "scale-105 border-white"
                    )}
                  />
                  {/* Check de selección sobre la imagen */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              )}
              
              {/* Texto de la opción */}
              <h2 className={cn(
                "text-white font-black text-xl md:text-2xl uppercase tracking-wide",
                "drop-shadow-lg text-center px-4",
                "transition-transform duration-300",
                isSelected && "scale-110"
              )}>
                {option.text || `Opción ${index + 1}`}
              </h2>
              
              {/* Porcentaje después de votar */}
              {showResults && (
                <div className="mt-2 animate-in fade-in zoom-in">
                  <span className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">
                    {percentage}%
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Temporizador circular en el centro */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className={cn(
          "w-16 h-16 md:w-20 md:h-20 rounded-full bg-black flex items-center justify-center",
          "shadow-2xl border-4 border-white relative overflow-hidden"
        )}>
          {/* Barra de progreso circular */}
          {!hasVoted && timeLeft > 0 && (
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="4"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeDasharray={`${(timeLeft / 5) * 100} 100`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
          )}
          <span className="text-white font-black text-2xl md:text-3xl relative z-10">
            {hasVoted ? '✓' : timeLeft}
          </span>
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
      
      {/* Línea divisora negra */}
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-black z-10 transform -translate-y-1/2" />
    </div>
  );
};

export default VSLayout;
