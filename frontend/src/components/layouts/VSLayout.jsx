import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

// Colores de banderas por país
const countryColors = {
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
  'japón': 'bg-white',
  'japan': 'bg-white',
  'china': 'bg-red-600',
  'corea': 'bg-gradient-to-b from-white to-red-600',
  'korea': 'bg-gradient-to-b from-white to-red-600',
  'india': 'bg-gradient-to-b from-orange-500 via-white to-green-600',
  'rusia': 'bg-gradient-to-b from-white via-blue-600 to-red-600',
  'russia': 'bg-gradient-to-b from-white via-blue-600 to-red-600',
  'australia': 'bg-blue-900',
  'canadá': 'bg-gradient-to-r from-red-600 via-white to-red-600',
  'canada': 'bg-gradient-to-r from-red-600 via-white to-red-600',
};

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
  
  return index === 0 
    ? 'bg-gradient-to-b from-amber-400 to-orange-500' 
    : 'bg-gradient-to-b from-red-500 to-red-700';
};

// Componente para una sola pregunta
const QuestionSlide = ({ 
  question, 
  questionIndex,
  isActive, 
  onVote, 
  selectedOption, 
  showResults 
}) => {
  const options = question.options || [];

  const getPercentage = (optionId) => {
    const totalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
    if (totalVotes === 0) {
      return optionId === selectedOption ? 65 : 35;
    }
    const optionVotes = options.find(o => o.id === optionId)?.votes || 0;
    return Math.round((optionVotes / totalVotes) * 100);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {options.slice(0, 2).map((option, index) => {
        const isSelected = selectedOption === option.id;
        const percentage = showResults ? getPercentage(option.id) : 0;
        const imageUrl = option.media?.url || option.media?.thumbnail || option.media_url || option.thumbnail_url || option.image;
        const bgColor = getCountryColor(option.text, index);
        const isBottom = index === 1;
        
        return (
          <button
            key={option.id}
            onClick={() => isActive && !showResults && onVote(option.id)}
            disabled={showResults}
            className={cn(
              "flex-1 relative overflow-hidden transition-all duration-300",
              "flex flex-col items-center justify-center",
              bgColor,
              isSelected && "ring-4 ring-white ring-inset"
            )}
          >
            {isBottom ? (
              <>
                <div className="w-full flex flex-col items-center mb-2">
                  <h2 className={cn(
                    "text-white font-black text-2xl md:text-3xl uppercase tracking-wide",
                    "drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center px-4",
                    "[text-shadow:_2px_2px_0_#000,_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000]",
                    isSelected && "scale-110"
                  )}>
                    {option.text || `Opción ${index + 1}`}
                  </h2>
                  
                  {showResults && (
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
            ) : (
              <>
                {imageUrl && (
                  <div className="relative z-10 w-[75%] max-w-[280px] aspect-[4/3] mb-2">
                    <img 
                      src={imageUrl} 
                      alt="" 
                      className={cn(
                        "w-full h-full object-cover rounded-2xl shadow-2xl border-4 border-white/30",
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
                    "[text-shadow:_2px_2px_0_#000,_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000]",
                    isSelected && "scale-110"
                  )}>
                    {option.text || `Opción ${index + 1}`}
                  </h2>
                  
                  {showResults && (
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
      
      {/* Línea divisora */}
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-black z-10 transform -translate-y-1/2" />
    </div>
  );
};

const VSLayout = ({ 
  poll, 
  onVote, 
  isActive,
  isThumbnail = false
}) => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  // Preparar todas las preguntas
  const vsQuestions = poll.vs_questions || [];
  const initialOptions = poll.options || [];
  
  // Si hay vs_questions, usarlas; si no, crear una pregunta con las opciones del poll
  const allQuestions = vsQuestions.length > 0 
    ? vsQuestions 
    : [{ id: poll.id, options: initialOptions }];
  
  const totalQuestions = allQuestions.length;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showResults, setShowResults] = useState({});
  const [timeLeft, setTimeLeft] = useState(5);
  const [showVS, setShowVS] = useState(true);

  const currentQuestion = allQuestions[currentIndex];
  const currentQuestionId = currentQuestion?.id;
  const hasVoted = !!selectedOptions[currentQuestionId];

  // Avanzar al siguiente slide
  const goToNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(5);
      setShowVS(true);
    }
  }, [currentIndex, totalQuestions]);

  // Mostrar VS por 1.5 segundos
  useEffect(() => {
    if (!isActive || isThumbnail) return;
    
    const timer = setTimeout(() => {
      setShowVS(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isActive, isThumbnail, currentIndex]);

  // Temporizador
  useEffect(() => {
    if (!isActive || hasVoted || isThumbnail || showVS) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => goToNext(), 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, hasVoted, isThumbnail, showVS, goToNext]);

  const handleVote = (optionId) => {
    if (hasVoted) return;
    
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

    // Auto-avanzar después de votar
    if (currentIndex < totalQuestions - 1) {
      setTimeout(() => goToNext(), 1500);
    }
  };

  // Thumbnail
  if (isThumbnail) {
    const thumbOptions = initialOptions.slice(0, 2);
    return (
      <div className="w-full h-full relative">
        <div className="absolute inset-0 flex flex-col">
          {thumbOptions.map((option, index) => {
            const imageUrl = option.media?.url || option.media?.thumbnail || option.media_url || option.thumbnail_url || option.image;
            const bgColor = getCountryColor(option.text, index);
            return (
              <div key={option.id} className={cn("flex-1 relative overflow-hidden", bgColor)}>
                {imageUrl && (
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    <img src={imageUrl} alt="" className="max-w-[80%] max-h-[80%] object-contain rounded-xl shadow-lg" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center border-2 border-white">
            <span className="text-white font-bold text-xs">VS</span>
          </div>
        </div>
        {totalQuestions > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-white text-xs">
            {totalQuestions}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      {/* Barra de progreso */}
      {totalQuestions > 1 && (
        <div className="absolute top-2 left-0 right-0 z-30 flex gap-1 px-4">
          {allQuestions.map((_, idx) => (
            <div 
              key={idx}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                idx < currentIndex ? "bg-white" :
                idx === currentIndex ? "bg-white/80" : "bg-white/30"
              )}
            />
          ))}
        </div>
      )}

      {/* Carrusel de preguntas */}
      <div 
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ 
          width: `${totalQuestions * 100}%`,
          transform: `translateX(-${(currentIndex / totalQuestions) * 100}%)` 
        }}
      >
        {allQuestions.map((question, qIndex) => (
          <div 
            key={question.id} 
            className="h-full relative"
            style={{ width: `${100 / totalQuestions}%` }}
          >
            <QuestionSlide
              question={question}
              questionIndex={qIndex}
              isActive={qIndex === currentIndex && isActive}
              onVote={handleVote}
              selectedOption={selectedOptions[question.id]}
              showResults={showResults[question.id]}
            />
          </div>
        ))}
      </div>
      
      {/* Círculo central: VS o Temporizador */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className={cn(
          "w-16 h-16 md:w-20 md:h-20 rounded-full bg-black flex items-center justify-center",
          "shadow-2xl border-4 border-white relative overflow-hidden"
        )}>
          {!showVS && !hasVoted && timeLeft > 0 && (
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="50%" cy="50%" r="45%" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
              <circle
                cx="50%" cy="50%" r="45%"
                fill="none" stroke="white" strokeWidth="4"
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
              {currentIndex + 1} / {totalQuestions}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VSLayout;
