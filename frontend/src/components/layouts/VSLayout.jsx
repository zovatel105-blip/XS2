import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

// Colores de banderas por país - con 2 colores principales para el círculo VS
const countryColors = {
  'españa': { bg: 'bg-gradient-to-b from-red-600 via-yellow-400 to-red-600', primary: '#dc2626', secondary: '#facc15' },
  'spain': { bg: 'bg-gradient-to-b from-red-600 via-yellow-400 to-red-600', primary: '#dc2626', secondary: '#facc15' },
  'francia': { bg: 'bg-gradient-to-r from-blue-600 via-white to-red-600', primary: '#2563eb', secondary: '#dc2626' },
  'france': { bg: 'bg-gradient-to-r from-blue-600 via-white to-red-600', primary: '#2563eb', secondary: '#dc2626' },
  'italia': { bg: 'bg-gradient-to-r from-green-600 via-white to-red-600', primary: '#16a34a', secondary: '#dc2626' },
  'italy': { bg: 'bg-gradient-to-r from-green-600 via-white to-red-600', primary: '#16a34a', secondary: '#dc2626' },
  'alemania': { bg: 'bg-gradient-to-b from-black via-red-600 to-yellow-400', primary: '#000000', secondary: '#facc15' },
  'germany': { bg: 'bg-gradient-to-b from-black via-red-600 to-yellow-400', primary: '#000000', secondary: '#facc15' },
  'portugal': { bg: 'bg-gradient-to-r from-green-600 to-red-600', primary: '#16a34a', secondary: '#dc2626' },
  'uk': { bg: 'bg-gradient-to-r from-blue-900 via-red-600 to-blue-900', primary: '#1e3a8a', secondary: '#dc2626' },
  'inglaterra': { bg: 'bg-gradient-to-r from-blue-900 via-red-600 to-blue-900', primary: '#1e3a8a', secondary: '#dc2626' },
  'england': { bg: 'bg-gradient-to-r from-blue-900 via-red-600 to-blue-900', primary: '#1e3a8a', secondary: '#dc2626' },
  'holanda': { bg: 'bg-gradient-to-b from-red-600 via-white to-blue-600', primary: '#dc2626', secondary: '#2563eb' },
  'netherlands': { bg: 'bg-gradient-to-b from-red-600 via-white to-blue-600', primary: '#dc2626', secondary: '#2563eb' },
  'bélgica': { bg: 'bg-gradient-to-r from-black via-yellow-400 to-red-600', primary: '#000000', secondary: '#facc15' },
  'belgium': { bg: 'bg-gradient-to-r from-black via-yellow-400 to-red-600', primary: '#000000', secondary: '#facc15' },
  'usa': { bg: 'bg-gradient-to-b from-blue-900 via-white to-red-600', primary: '#1e3a8a', secondary: '#dc2626' },
  'estados unidos': { bg: 'bg-gradient-to-b from-blue-900 via-white to-red-600', primary: '#1e3a8a', secondary: '#dc2626' },
  'united states': { bg: 'bg-gradient-to-b from-blue-900 via-white to-red-600', primary: '#1e3a8a', secondary: '#dc2626' },
  'méxico': { bg: 'bg-gradient-to-r from-green-600 via-white to-red-600', primary: '#16a34a', secondary: '#dc2626' },
  'mexico': { bg: 'bg-gradient-to-r from-green-600 via-white to-red-600', primary: '#16a34a', secondary: '#dc2626' },
  'brasil': { bg: 'bg-gradient-to-b from-green-500 via-yellow-400 to-green-500', primary: '#22c55e', secondary: '#facc15' },
  'brazil': { bg: 'bg-gradient-to-b from-green-500 via-yellow-400 to-green-500', primary: '#22c55e', secondary: '#facc15' },
  'argentina': { bg: 'bg-gradient-to-b from-sky-400 via-white to-sky-400', primary: '#38bdf8', secondary: '#ffffff' },
  'colombia': { bg: 'bg-gradient-to-b from-yellow-400 via-blue-600 to-red-600', primary: '#facc15', secondary: '#2563eb' },
  'chile': { bg: 'bg-gradient-to-b from-white to-red-600', primary: '#dc2626', secondary: '#1e3a8a' },
  'perú': { bg: 'bg-gradient-to-r from-red-600 via-white to-red-600', primary: '#dc2626', secondary: '#ffffff' },
  'peru': { bg: 'bg-gradient-to-r from-red-600 via-white to-red-600', primary: '#dc2626', secondary: '#ffffff' },
  'venezuela': { bg: 'bg-gradient-to-b from-yellow-400 via-blue-600 to-red-600', primary: '#facc15', secondary: '#dc2626' },
  'japón': { bg: 'bg-white', primary: '#ffffff', secondary: '#dc2626' },
  'japan': { bg: 'bg-white', primary: '#ffffff', secondary: '#dc2626' },
  'china': { bg: 'bg-red-600', primary: '#dc2626', secondary: '#facc15' },
  'corea': { bg: 'bg-gradient-to-b from-white to-red-600', primary: '#ffffff', secondary: '#dc2626' },
  'korea': { bg: 'bg-gradient-to-b from-white to-red-600', primary: '#ffffff', secondary: '#dc2626' },
  'india': { bg: 'bg-gradient-to-b from-orange-500 via-white to-green-600', primary: '#f97316', secondary: '#16a34a' },
  'rusia': { bg: 'bg-gradient-to-b from-white via-blue-600 to-red-600', primary: '#2563eb', secondary: '#dc2626' },
  'russia': { bg: 'bg-gradient-to-b from-white via-blue-600 to-red-600', primary: '#2563eb', secondary: '#dc2626' },
  'australia': { bg: 'bg-blue-900', primary: '#1e3a8a', secondary: '#dc2626' },
  'canadá': { bg: 'bg-gradient-to-r from-red-600 via-white to-red-600', primary: '#dc2626', secondary: '#ffffff' },
  'canada': { bg: 'bg-gradient-to-r from-red-600 via-white to-red-600', primary: '#dc2626', secondary: '#ffffff' },
  'ecuador': { bg: 'bg-gradient-to-b from-yellow-400 via-blue-600 to-red-600', primary: '#facc15', secondary: '#2563eb' },
  'uruguay': { bg: 'bg-gradient-to-b from-white to-blue-600', primary: '#2563eb', secondary: '#facc15' },
  'paraguay': { bg: 'bg-gradient-to-b from-red-600 via-white to-blue-600', primary: '#dc2626', secondary: '#2563eb' },
  'bolivia': { bg: 'bg-gradient-to-b from-red-600 via-yellow-400 to-green-600', primary: '#dc2626', secondary: '#16a34a' },
  'cuba': { bg: 'bg-gradient-to-b from-blue-600 to-red-600', primary: '#2563eb', secondary: '#dc2626' },
  'panamá': { bg: 'bg-gradient-to-b from-white to-red-600', primary: '#dc2626', secondary: '#2563eb' },
  'panama': { bg: 'bg-gradient-to-b from-white to-red-600', primary: '#dc2626', secondary: '#2563eb' },
  'costa rica': { bg: 'bg-gradient-to-b from-blue-600 via-red-600 to-blue-600', primary: '#2563eb', secondary: '#dc2626' },
  'guatemala': { bg: 'bg-gradient-to-r from-sky-400 via-white to-sky-400', primary: '#38bdf8', secondary: '#ffffff' },
  'honduras': { bg: 'bg-gradient-to-b from-blue-600 via-white to-blue-600', primary: '#2563eb', secondary: '#ffffff' },
  'el salvador': { bg: 'bg-gradient-to-b from-blue-600 via-white to-blue-600', primary: '#2563eb', secondary: '#ffffff' },
  'nicaragua': { bg: 'bg-gradient-to-b from-blue-600 via-white to-blue-600', primary: '#2563eb', secondary: '#ffffff' },
  'república dominicana': { bg: 'bg-gradient-to-b from-blue-600 via-white to-red-600', primary: '#2563eb', secondary: '#dc2626' },
  'dominican republic': { bg: 'bg-gradient-to-b from-blue-600 via-white to-red-600', primary: '#2563eb', secondary: '#dc2626' },
  'puerto rico': { bg: 'bg-gradient-to-b from-red-600 to-blue-600', primary: '#dc2626', secondary: '#2563eb' },
};

// Colores por defecto
const defaultColors = {
  top: { bg: 'bg-gradient-to-b from-amber-400 to-orange-500', primary: '#f97316', secondary: '#dc2626' },
  bottom: { bg: 'bg-gradient-to-b from-red-500 to-red-700', primary: '#dc2626', secondary: '#f97316' }
};

const getCountryColor = (text, index) => {
  if (!text) {
    return index === 0 ? defaultColors.top.bg : defaultColors.bottom.bg;
  }
  
  const lowerText = text.toLowerCase();
  
  for (const [country, colors] of Object.entries(countryColors)) {
    if (lowerText.includes(country)) {
      return colors.bg;
    }
  }
  
  return index === 0 ? defaultColors.top.bg : defaultColors.bottom.bg;
};

// Obtiene los 2 colores principales del país
const getCountryColors = (countryName) => {
  if (!countryName) {
    return { primary: defaultColors.top.primary, secondary: defaultColors.bottom.primary };
  }
  
  const lowerText = countryName.toLowerCase();
  
  for (const [country, colors] of Object.entries(countryColors)) {
    if (lowerText.includes(country)) {
      return { primary: colors.primary, secondary: colors.secondary };
    }
  }
  
  return { primary: defaultColors.top.primary, secondary: defaultColors.bottom.primary };
};

const getCountryPrimaryColor = (text, index) => {
  if (!text) {
    return index === 0 ? defaultColors.top.primary : defaultColors.bottom.primary;
  }
  
  const lowerText = text.toLowerCase();
  
  for (const [country, colors] of Object.entries(countryColors)) {
    if (lowerText.includes(country)) {
      return colors.primary;
    }
  }
  
  return index === 0 ? defaultColors.top.primary : defaultColors.bottom.primary;
};

// Componente para una sola pregunta
const QuestionSlide = ({ 
  question, 
  questionIndex,
  isActive, 
  onVote, 
  selectedOption, 
  showResults,
  creatorCountry,
  highlightedOption  // Opción resaltada por la voz (0 o 1)
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
        const isHighlighted = highlightedOption === index;
        const percentage = showResults ? getPercentage(option.id) : 0;
        const imageUrl = option.media?.url || option.media?.thumbnail || option.media_url || option.thumbnail_url || option.image;
        const bgColor = getCountryColor(option.text, index);
        const isTop = index === 0;
        
        return (
          <button
            key={option.id}
            onClick={() => isActive && !showResults && onVote(option.id)}
            disabled={showResults}
            className={cn(
              "flex-1 relative overflow-hidden transition-all duration-300",
              !imageUrl && bgColor,
              isSelected && "ring-4 ring-white ring-inset",
              isHighlighted && !isSelected && "ring-4 ring-yellow-400 ring-inset scale-[1.02]"
            )}
          >
            {/* Overlay de resaltado por voz */}
            {isHighlighted && !isSelected && (
              <div className="absolute inset-0 bg-yellow-400/20 z-5 animate-pulse" />
            )}
            
            {/* Imagen de fondo completo */}
            {imageUrl && (
              <img 
                src={imageUrl} 
                alt="" 
                loading={isActive ? "eager" : "lazy"}
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            
            {/* Contenido - posicionado arriba o abajo según la opción */}
            <div className={cn(
              "absolute left-0 right-0 z-10 flex flex-col items-center px-4",
              isTop ? "bottom-8 md:bottom-10" : "top-8 md:top-10"
            )}>
              <h2 className={cn(
                "text-white font-black text-2xl md:text-3xl uppercase tracking-wide",
                "drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center",
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
            
            {/* Indicador de selección */}
            {isSelected && (
              <div className="absolute top-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
      
      {/* Línea divisora con 2 colores del país del creador */}
      {(() => {
        const colors = getCountryColors(creatorCountry);
        return (
          <div 
            className="absolute top-1/2 left-0 right-0 h-1.5 z-10 transform -translate-y-1/2"
            style={{
              background: `linear-gradient(90deg, ${colors.primary} 50%, ${colors.secondary} 50%)`
            }}
          />
        );
      })()}
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
  const voiceSequenceRef = useRef(null);
  const hasStartedVoiceRef = useRef(false);
  
  // País del creador para los colores
  const creatorCountry = poll.creator_country;
  
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
  const [highlightedOption, setHighlightedOption] = useState(null); // Para resaltar visualmente

  const currentQuestion = allQuestions[currentIndex];
  const currentQuestionId = currentQuestion?.id;
  const hasVoted = !!selectedOptions[currentQuestionId];

  // Función para detener toda la voz y secuencia
  const stopVoice = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (voiceSequenceRef.current) {
      voiceSequenceRef.current.forEach(timer => clearTimeout(timer));
      voiceSequenceRef.current = null;
    }
    setHighlightedOption(null);
  }, []);

  // Función para hablar con Text-to-Speech
  const speak = useCallback((text, rate = 1.2) => {
    if (isThumbnail || !window.speechSynthesis) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Buscar voz en español
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(voice => 
      voice.lang.startsWith('es') || voice.name.includes('Spanish')
    );
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }, [isThumbnail]);

  // Secuencia de voz con resaltado visual
  const startVoiceSequence = useCallback(() => {
    if (isThumbnail || hasVoted || !isActive) return;
    
    const options = currentQuestion?.options || [];
    const optionA = options[0]?.text || 'Opción A';
    const optionB = options[1]?.text || 'Opción B';
    
    // Cancelar secuencia anterior
    stopVoice();
    
    const timers = [];
    
    // Solo decir "¿Qué prefieres?" en la primera pregunta
    const isFirstQuestion = currentIndex === 0;
    const introDelay = isFirstQuestion ? 800 : 0;
    
    // Paso 0: Decir "¿Qué prefieres?" solo en la primera pregunta
    if (isFirstQuestion) {
      timers.push(setTimeout(() => {
        speak('¿Qué prefieres?', 1.2);
      }, 0));
    }
    
    // Paso 1: Resaltar y hablar opción A
    timers.push(setTimeout(() => {
      setHighlightedOption(0);
      speak(optionA, 1.3);
    }, introDelay));
    
    // Paso 2: Resaltar y hablar opción B
    timers.push(setTimeout(() => {
      setHighlightedOption(1);
      speak(optionB, 1.3);
    }, introDelay + 1500));
    
    // Paso 3: Quitar resaltado
    timers.push(setTimeout(() => {
      setHighlightedOption(null);
    }, introDelay + 3000));
    
    voiceSequenceRef.current = timers;
  }, [isThumbnail, hasVoted, isActive, currentQuestion, currentIndex, speak, stopVoice]);

  // Detener speech cuando el componente se desmonta
  useEffect(() => {
    return () => stopVoice();
  }, [stopVoice]);

  // Iniciar secuencia de voz cuando termina el VS y está activo
  useEffect(() => {
    if (!isActive || isThumbnail || showVS || hasVoted) return;
    
    // Solo iniciar si no ha empezado aún para esta pregunta
    if (!hasStartedVoiceRef.current) {
      hasStartedVoiceRef.current = true;
      startVoiceSequence();
    }
  }, [isActive, isThumbnail, showVS, hasVoted, startVoiceSequence]);

  // Resetear el flag cuando cambia la pregunta
  useEffect(() => {
    hasStartedVoiceRef.current = false;
    setHighlightedOption(null);
  }, [currentIndex]);

  // Avanzar al siguiente slide
  const goToNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      stopVoice(); // Detener voz al cambiar de pantalla
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(5);
      setShowVS(true);
      hasStartedVoiceRef.current = false;
    }
  }, [currentIndex, totalQuestions, stopVoice]);

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
    
    // Obtener la opción seleccionada para la voz
    const options = currentQuestion?.options || [];
    const selectedOption = options.find(opt => opt.id === optionId);
    const otherOption = options.find(opt => opt.id !== optionId);
    
    setSelectedOptions(prev => ({
      ...prev,
      [currentQuestionId]: optionId
    }));
    setShowResults(prev => ({
      ...prev,
      [currentQuestionId]: true
    }));
    
    // Anunciar la elección con voz
    if (selectedOption) {
      const totalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
      const selectedVotes = selectedOption.votes || 0;
      const otherVotes = otherOption?.votes || 0;
      
      // Calcular porcentajes (simulados si no hay votos reales)
      let selectedPercent, otherPercent;
      if (totalVotes === 0) {
        selectedPercent = 65;
        otherPercent = 35;
      } else {
        selectedPercent = Math.round(((selectedVotes + 1) / (totalVotes + 1)) * 100);
        otherPercent = 100 - selectedPercent;
      }
      
      setTimeout(() => {
        speak(`Elegiste ${selectedOption.text}. ${selectedPercent} por ciento contra ${otherPercent} por ciento.`, 1.1);
      }, 300);
    }
    
    if (onVote) {
      onVote(poll.id, optionId);
    }

    // Auto-avanzar después de votar
    if (currentIndex < totalQuestions - 1) {
      setTimeout(() => goToNext(), 2500); // Aumentado para dar tiempo a la voz
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
              <div key={option.id} className={cn("flex-1 relative overflow-hidden", !imageUrl && bgColor)}>
                {imageUrl && (
                  <img 
                    src={imageUrl} 
                    alt="" 
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover" 
                  />
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
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
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
              creatorCountry={creatorCountry}
            />
          </div>
        ))}
      </div>
      
      {/* Círculo central: VS o Temporizador con 2 colores del país del creador */}
      {(() => {
        // Usar los 2 colores del país del creador
        const colors = getCountryColors(creatorCountry);
        
        return (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            {/* Anillo exterior con 2 colores en diagonal */}
            <div 
              className="w-16 h-16 md:w-20 md:h-20 rounded-full p-1 shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 50%, ${colors.secondary} 50%)`
              }}
            >
              {/* Círculo interior negro */}
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center relative overflow-hidden">
                {!showVS && !hasVoted && timeLeft > 0 && (
                  <svg className="absolute inset-0 w-full h-full -rotate-90 z-10">
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
          </div>
        );
      })()}
    </div>
  );
};

export default VSLayout;
