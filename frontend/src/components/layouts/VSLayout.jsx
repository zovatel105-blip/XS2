import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Play } from 'lucide-react';

// Colores de banderas por país
const countryColors = {
  // Europa
  'españa': 'bg-gradient-to-b from-red-600 via-yellow-400 to-red-600',
  'spain': 'bg-gradient-to-b from-red-600 via-yellow-400 to-red-600',
  'francia': 'bg-gradient-to-r from-blue-600 via-white to-red-600',
  'france': 'bg-gradient-to-r from-blue-600 via-white to-red-600',
  'italia': 'bg-gradient-to-r from-green-600 via-white to-red-600',
  'italy': 'bg-gradient-to-r from-green-600 via-white to-red-600',
  'alemania': 'bg-gradient-to-b from-black via-red-600 to-yellow-400',
  'germany': 'bg-gradient-to-b from-black via-red-600 to-yellow-400',
  'portugal': 'bg-gradient-to-r from-green-600 to-red-600',
  'uk': 'bg-gradient-to-r from-blue-900 via-red-600 to-blue-900',
  'inglaterra': 'bg-gradient-to-r from-blue-900 via-red-600 to-blue-900',
  'england': 'bg-gradient-to-r from-blue-900 via-red-600 to-blue-900',
  'holanda': 'bg-gradient-to-b from-red-600 via-white to-blue-600',
  'netherlands': 'bg-gradient-to-b from-red-600 via-white to-blue-600',
  'bélgica': 'bg-gradient-to-r from-black via-yellow-400 to-red-600',
  'belgium': 'bg-gradient-to-r from-black via-yellow-400 to-red-600',
  
  // América
  'usa': 'bg-gradient-to-b from-blue-900 via-white to-red-600',
  'estados unidos': 'bg-gradient-to-b from-blue-900 via-white to-red-600',
  'méxico': 'bg-gradient-to-r from-green-600 via-white to-red-600',
  'mexico': 'bg-gradient-to-r from-green-600 via-white to-red-600',
  'brasil': 'bg-gradient-to-b from-green-500 via-yellow-400 to-green-500',
  'brazil': 'bg-gradient-to-b from-green-500 via-yellow-400 to-green-500',
  'argentina': 'bg-gradient-to-b from-sky-400 via-white to-sky-400',
  'colombia': 'bg-gradient-to-b from-yellow-400 via-blue-600 to-red-600',
  'chile': 'bg-gradient-to-b from-white to-red-600',
  'perú': 'bg-gradient-to-r from-red-600 via-white to-red-600',
  'peru': 'bg-gradient-to-r from-red-600 via-white to-red-600',
  'venezuela': 'bg-gradient-to-b from-yellow-400 via-blue-600 to-red-600',
  
  // Asia
  'japón': 'bg-white',
  'japan': 'bg-white',
  'china': 'bg-red-600',
  'corea': 'bg-gradient-to-b from-white to-red-600',
  'korea': 'bg-gradient-to-b from-white to-red-600',
  'india': 'bg-gradient-to-b from-orange-500 via-white to-green-600',
  
  // Otros
  'rusia': 'bg-gradient-to-b from-white via-blue-600 to-red-600',
  'russia': 'bg-gradient-to-b from-white via-blue-600 to-red-600',
  'australia': 'bg-blue-900',
  'canadá': 'bg-gradient-to-r from-red-600 via-white to-red-600',
  'canada': 'bg-gradient-to-r from-red-600 via-white to-red-600',
};

// Función para detectar país en el texto
const getCountryColor = (text, index) => {
  if (!text) {
    return index === 0 
      ? 'bg-gradient-to-b from-amber-400 to-orange-500' 
      : 'bg-gradient-to-b from-red-500 to-red-700';
  }
  
  const lowerText = text.toLowerCase();
  
  for (const [country, color] of Object.entries(countryColors)) {
    if (lowerText.includes(country)) {
      return color;
    }
  }
  
  // Colores por defecto si no se detecta país
  return index === 0 
    ? 'bg-gradient-to-b from-amber-400 to-orange-500' 
    : 'bg-gradient-to-b from-red-500 to-red-700';
};

/**
 * VSLayout - Renderiza una experiencia VS en el feed
 * Diseño estilo "¿Qué prefieres?" con colores de bandera y temporizador
 */
const VSLayout = ({ 
  poll, 
  onVote, 
  isActive,
  isThumbnail = false
}) => {
  const navigate = useNavigate();
  
  // Obtener todas las preguntas
  const vsQuestions = poll.vs_questions || [];
  const initialOptions = poll.options || [];
  const totalQuestions = vsQuestions.length > 0 ? vsQuestions.length : 1;
  
  // Estado para la pregunta actual
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({}); // {questionId: optionId}
  const [showResults, setShowResults] = useState({});
  const [timeLeft, setTimeLeft] = useState(5);
  const [showVS, setShowVS] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Obtener las opciones de la pregunta actual
  const getCurrentOptions = () => {
    if (vsQuestions.length > 0 && vsQuestions[currentQuestionIndex]) {
      return vsQuestions[currentQuestionIndex].options || [];
    }
    return initialOptions;
  };

  const getCurrentQuestionId = () => {
    if (vsQuestions.length > 0 && vsQuestions[currentQuestionIndex]) {
      return vsQuestions[currentQuestionIndex].id;
    }
    return poll.id;
  };

  const options = getCurrentOptions();
  const currentQuestionId = getCurrentQuestionId();
  const hasVoted = !!selectedOptions[currentQuestionId];

  // Función para avanzar a la siguiente pregunta
  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setTimeLeft(5);
        setShowVS(true);
        setIsTransitioning(false);
      }, 300);
    }
  }, [currentQuestionIndex, totalQuestions]);

  // Mostrar VS por 1.5 segundos antes del temporizador
  useEffect(() => {
    if (!isActive || isThumbnail) return;
    
    const vsTimer = setTimeout(() => {
      setShowVS(false);
    }, 1500);

    return () => clearTimeout(vsTimer);
  }, [isActive, isThumbnail, currentQuestionIndex]);

  // Temporizador de 5 segundos
  useEffect(() => {
    if (!isActive || hasVoted || isThumbnail || showVS) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-avanzar cuando el tiempo llega a 0
          if (currentQuestionIndex < totalQuestions - 1) {
            setTimeout(() => goToNextQuestion(), 500);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, hasVoted, isThumbnail, showVS, currentQuestionIndex, totalQuestions, goToNextQuestion]);

  const handleOptionClick = (optionId) => {
    if (hasVoted || isThumbnail) return;
    
    setSelectedOptions(prev => ({
      ...prev,
      [currentQuestionId]: optionId
    }));
    setShowResults(prev => ({
      ...prev,
      [currentQuestionId]: true
    }));
    
    if (onVote) {
      onVote(poll.id, optionId);
    }

    // Auto-avanzar después de votar (1.5 segundos)
    if (currentQuestionIndex < totalQuestions - 1) {
      setTimeout(() => goToNextQuestion(), 1500);
    }
  };

  const getPercentage = (optionId) => {
    const totalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
    if (totalVotes === 0) {
      return optionId === selectedOptions[currentQuestionId] ? 65 : 35;
    }
    const optionVotes = options.find(o => o.id === optionId)?.votes || 0;
    return Math.round((optionVotes / totalVotes) * 100);
  };

  // Si es thumbnail, mostrar versión simplificada
  if (isThumbnail) {
    const thumbOptions = initialOptions.slice(0, 2);
    return (
      <div className="w-full h-full relative">
        <div className="absolute inset-0 flex flex-col">
          {thumbOptions.map((option, index) => {
            const imageUrl = option.media?.url || option.media?.thumbnail || option.media_url || option.thumbnail_url || option.image;
            const bgColor = getCountryColor(option.text, index);
            return (
              <div 
                key={option.id}
                className={cn("flex-1 relative overflow-hidden", bgColor)}
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
        {/* Indicador de preguntas */}
        {totalQuestions > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-white text-xs">
            {totalQuestions} preguntas
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "w-full h-full relative transition-opacity duration-300",
      isTransitioning && "opacity-50"
    )}>
      {/* Indicador de progreso de preguntas */}
      {totalQuestions > 1 && (
        <div className="absolute top-2 left-0 right-0 z-30 flex gap-1 px-4">
          {Array.from({ length: totalQuestions }).map((_, idx) => (
            <div 
              key={idx}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                idx < currentQuestionIndex ? "bg-white" :
                idx === currentQuestionIndex ? "bg-white/80" : "bg-white/30"
              )}
            />
          ))}
        </div>
      )}

      {/* Opciones A vs B */}
      <div className="absolute inset-0 flex flex-col">
        {options.slice(0, 2).map((option, index) => {
          const isSelected = selectedOptions[currentQuestionId] === option.id;
          const percentage = showResults[currentQuestionId] ? getPercentage(option.id) : 0;
          const imageUrl = option.media?.url || option.media?.thumbnail || option.media_url || option.thumbnail_url || option.image;
          const bgColor = getCountryColor(option.text, index);
          const isBottom = index === 1;
          
          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              disabled={hasVoted}
              className={cn(
                "flex-1 relative overflow-hidden transition-all duration-300",
                "flex flex-col items-center justify-center",
                bgColor,
                isSelected && "ring-4 ring-white ring-inset"
              )}
            >
              {/* Para la opción inferior: Texto arriba, luego imagen */}
              {isBottom && (
                <>
                  <div className="w-full flex flex-col items-center mb-2">
                    <h2 className={cn(
                      "text-white font-black text-2xl md:text-3xl uppercase tracking-wide",
                      "drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center px-4",
                      "transition-transform duration-300",
                      "[text-shadow:_2px_2px_0_#000,_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000]",
                      isSelected && "scale-110"
                    )}>
                      {option.text || `Opción ${index + 1}`}
                    </h2>
                    
                    {showResults[currentQuestionId] && (
                      <div className="mt-1 animate-in fade-in zoom-in">
                        <span className="text-4xl md:text-5xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                          {percentage}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {imageUrl && (
                    <div className="relative z-10 w-[75%] max-w-[280px] aspect-[4/3]">
                      <img 
                        src={imageUrl} 
                        alt="" 
                        className={cn(
                          "w-full h-full object-cover rounded-2xl shadow-2xl border-4 border-white/30",
                          "transition-transform duration-300",
                          isSelected && "scale-105 border-white"
                        )}
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              
              {/* Para la opción superior: Imagen, luego texto */}
              {!isBottom && (
                <>
                  {imageUrl && (
                    <div className="relative z-10 w-[75%] max-w-[280px] aspect-[4/3] mb-2">
                      <img 
                        src={imageUrl} 
                        alt="" 
                        className={cn(
                          "w-full h-full object-cover rounded-2xl shadow-2xl border-4 border-white/30",
                          "transition-transform duration-300",
                          isSelected && "scale-105 border-white"
                        )}
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="w-full flex flex-col items-center">
                    <h2 className={cn(
                      "text-white font-black text-2xl md:text-3xl uppercase tracking-wide",
                      "drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center px-4",
                      "transition-transform duration-300",
                      "[text-shadow:_2px_2px_0_#000,_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000]",
                      isSelected && "scale-110"
                    )}>
                      {option.text || `Opción ${index + 1}`}
                    </h2>
                    
                    {showResults[currentQuestionId] && (
                      <div className="mt-1 animate-in fade-in zoom-in">
                        <span className="text-4xl md:text-5xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                          {percentage}%
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Círculo central: VS o Temporizador */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className={cn(
          "w-16 h-16 md:w-20 md:h-20 rounded-full bg-black flex items-center justify-center",
          "shadow-2xl border-4 border-white relative overflow-hidden"
        )}>
          {!showVS && !hasVoted && timeLeft > 0 && (
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
          
          <span className="text-white font-black text-xl md:text-2xl relative z-10">
            {showVS ? 'VS' : (hasVoted ? '✓' : timeLeft)}
          </span>
        </div>
      </div>
      
      {/* Contador de pregunta */}
      {totalQuestions > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="text-white text-sm font-medium">
              Pregunta {currentQuestionIndex + 1} de {totalQuestions}
            </span>
          </div>
        </div>
      )}
      
      {/* Línea divisora negra */}
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-black z-10 transform -translate-y-1/2" />
    </div>
  );
};

export default VSLayout;
