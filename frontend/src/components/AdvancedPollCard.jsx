import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  Heart, MessageCircle, Share, Bookmark, MoreHorizontal, 
  Play, Pause, VolumeX, Volume2, TrendingUp, Zap, 
  Sparkles, Award, Trophy, Star, ChevronUp, ChevronDown,
  Filter, Search, Shuffle, Target, Eye, User, CheckCircle
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import CommentsModal from './CommentsModal';
import { cn } from '../lib/utils';

// Efectos de partículas para interacciones
const ParticleEffect = ({ x, y, type, show, onComplete }) => {
  if (!show) return null;
  
  const particles = Array.from({ length: type === 'love' ? 12 : 8 }, (_, i) => ({
    id: i,
    delay: i * 0.05,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5
  }));

  return (
    <div 
      className="fixed z-50 pointer-events-none"
      style={{ left: x - 20, top: y - 20 }}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={cn(
            "absolute w-6 h-6 rounded-full",
            type === 'love' ? "bg-red-500" : 
            type === 'star' ? "bg-yellow-400" :
            type === 'fire' ? "bg-orange-500" : "bg-blue-500"
          )}
          initial={{ 
            scale: 0, 
            rotate: 0,
            x: 0,
            y: 0,
            opacity: 1
          }}
          animate={{ 
            scale: [0, particle.scale, 0],
            rotate: particle.rotation,
            x: (Math.random() - 0.5) * 100,
            y: -50 - Math.random() * 50,
            opacity: [1, 1, 0]
          }}
          transition={{ 
            duration: 1.2,
            delay: particle.delay,
            ease: "easeOut"
          }}
          onAnimationComplete={() => particle.id === particles.length - 1 && onComplete()}
        >
          {type === 'love' && <Heart className="w-4 h-4 text-white fill-current" />}
          {type === 'star' && <Star className="w-4 h-4 text-white fill-current" />}
          {type === 'fire' && <Zap className="w-4 h-4 text-white fill-current" />}
        </motion.div>
      ))}
    </div>
  );
};

// Componente de reacción rápida - OPTIMIZADO MÓVIL
const QuickReaction = ({ icon: Icon, label, count, isActive, onClick, position = "right" }) => {
  const [showPulse, setShowPulse] = useState(false);

  const handleClick = () => {
    setShowPulse(true);
    onClick();
    setTimeout(() => setShowPulse(false), 300);
  };

  return (
    <motion.button
      className={cn(
        "flex flex-col items-center gap-1 p-3 rounded-full backdrop-blur-md transition-all duration-200 touch-manipulation min-h-[60px] min-w-[60px] active:scale-90",
        isActive 
          ? "bg-white/40 text-white shadow-lg" 
          : "bg-black/30 text-white/90 hover:bg-white/25 hover:text-white active:bg-white/35"
      )}
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.05 }}
      onClick={handleClick}
      animate={showPulse ? { 
        boxShadow: [
          "0 0 0 0 rgba(255, 255, 255, 0.4)",
          "0 0 0 20px rgba(255, 255, 255, 0)",
        ]
      } : {}}
      transition={{ duration: 0.3 }}
    >
      <Icon className={cn(
        "w-6 h-6 transition-all flex-shrink-0",
        isActive && "fill-current scale-110"
      )} />
      <span className="text-xs font-bold leading-none">{count > 999 ? `${(count/1000).toFixed(1)}K` : count}</span>
    </motion.button>
  );
};

// Componente de filtro inteligente flotante
const SmartFilter = ({ categories, activeCategory, onCategoryChange, trending }) => {
  return (
    <motion.div 
      className="absolute top-4 left-4 right-4 z-40"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
        <motion.button
          className="flex items-center gap-2 bg-black/30 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 flex-shrink-0"
          whileTap={{ scale: 0.95 }}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtros</span>
        </motion.button>
        
        {categories.map((category) => (
          <motion.button
            key={category.id}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 flex-shrink-0 transition-all",
              activeCategory === category.id
                ? "bg-white text-black shadow-lg"
                : "bg-black/30 backdrop-blur-md text-white hover:bg-white/20"
            )}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCategoryChange(category.id)}
          >
            {trending.includes(category.id) && (
              <TrendingUp className="w-3 h-3 text-red-500" />
            )}
            <span className="text-sm font-medium">{category.name}</span>
            {category.count && (
              <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                {category.count}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// Componente principal de tarjeta de encuesta mejorada
const AdvancedPollCard = ({ 
  poll, 
  isActive, 
  onVote, 
  onLike, 
  onShare, 
  onComment,
  onSave,
  index,
  total 
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showParticles, setShowParticles] = useState(null);
  const [isPlaying, setIsPlaying] = useState(isActive);
  const [volume, setVolume] = useState(0.7);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  
  const cardRef = useRef(null);
  const navigate = useNavigate();
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-100, 0, 100], [0.8, 1, 0.8]);
  const scale = useTransform(y, [-100, 0, 100], [0.95, 1, 0.95]);

  // Gesture handlers mejorados
  const handleSwipeLeft = useCallback(() => {
    // Swipe izquierda = Like rápido
    onLike(poll.id);
    setShowParticles({ type: 'love', x: window.innerWidth / 2, y: window.innerHeight / 2 });
  }, [poll.id, onLike]);

  const handleSwipeRight = useCallback(() => {
    // Swipe derecha = Guardar
    onSave && onSave(poll.id);
    setShowParticles({ type: 'star', x: window.innerWidth / 2, y: window.innerHeight / 2 });
  }, [poll.id, onSave]);

  const handleDoubleClick = useCallback((e) => {
    // Double tap en diferentes zonas
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clickX = e.clientX - rect.left;
    const isLeftSide = clickX < rect.width / 2;
    
    if (isLeftSide) {
      handleSwipeLeft();
    } else {
      onShare(poll.id);
      setShowParticles({ type: 'fire', x: e.clientX, y: e.clientY });
    }
  }, [handleSwipeLeft, onShare, poll.id]);

  const handleVote = useCallback((optionId) => {
    if (selectedOption) return;
    setSelectedOption(optionId);
    onVote(poll.id, optionId);
    
    // Efecto visual para el voto
    setShowParticles({ 
      type: 'star', 
      x: window.innerWidth / 2, 
      y: window.innerHeight / 2 
    });
  }, [selectedOption, onVote, poll.id]);

  const formatNumber = (num) => {
    // Handle undefined, null, or non-numeric values
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }
    
    const numValue = Number(num);
    if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(1)}M`;
    }
    if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(1)}K`;
    }
    return numValue.toString();
  };

  const getWinningOption = () => {
    if (!poll.options || poll.options.length === 0) {
      return null;
    }
    return poll.options.reduce((max, option) => 
      option.votes > max.votes ? option : max
    );
  };

  const getPercentage = (votes) => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  const winningOption = getWinningOption();

  return (
    <motion.div
      ref={cardRef}
      className="w-full h-screen flex flex-col relative snap-start snap-always overflow-hidden"
      style={{ opacity, scale, y }}
      onDoubleClick={handleDoubleClick}
      onHoverStart={() => setShowQuickActions(true)}
      onHoverEnd={() => setShowQuickActions(false)}
    >
      {/* Fondo con gradiente dinámico */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Efectos de fondo animados */}
        <motion.div 
          className="absolute inset-0 opacity-10"
          animate={{
            background: [
              'radial-gradient(circle at 20% 80%, #4f46e5 0%, transparent 50%)',
              'radial-gradient(circle at 80% 20%, #7c3aed 0%, transparent 50%)',
              'radial-gradient(circle at 40% 40%, #2563eb 0%, transparent 50%)',
            ]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* GRID DE ENCUESTAS - PANTALLA COMPLETA */}
      <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
        {poll.options.map((option, optionIndex) => {
          const percentage = getPercentage(option.votes);
          const isWinner = option.id === winningOption.id && poll.totalVotes > 0;
          const isSelected = selectedOption === option.id;

          return (
            <motion.div
              key={option.id}
              className="relative cursor-pointer group h-full w-full overflow-hidden touch-manipulation"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleVote(option.id)}
              style={{ 
                transformStyle: 'preserve-3d',
                perspective: '1000px'
              }}
            >
              {/* Fondo de la opción - PANTALLA COMPLETA */}
              <div className="absolute inset-0 w-full h-full">
                {option.media?.url ? (
                  <img 
                    src={option.media.url} 
                    alt={option.text}
                    className="w-full h-full object-cover object-center"
                    style={{ 
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }}
                  />
                ) : (
                  <div className={cn(
                    "w-full h-full",
                    optionIndex === 0 ? "bg-gradient-to-br from-pink-500 via-rose-500 to-red-500" :
                    optionIndex === 1 ? "bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500" :
                    optionIndex === 2 ? "bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500" :
                    "bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500"
                  )} />
                )}
              </div>

              {/* Overlay de progreso animado - PANTALLA COMPLETA */}
              <motion.div 
                className={cn(
                  "absolute inset-0",
                  isSelected 
                    ? "bg-gradient-to-t from-blue-600/60 to-blue-400/20"
                    : isWinner 
                      ? "bg-gradient-to-t from-green-600/60 to-green-400/20"
                      : "bg-gradient-to-t from-black/40 to-transparent"
                )}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: poll.totalVotes > 0 ? 1 : 0,
                  background: isSelected ? [
                    "linear-gradient(to top, rgba(37, 99, 235, 0.6), rgba(96, 165, 250, 0.2))",
                    "linear-gradient(to top, rgba(59, 130, 246, 0.7), rgba(147, 197, 253, 0.3))",
                    "linear-gradient(to top, rgba(37, 99, 235, 0.6), rgba(96, 165, 250, 0.2))"
                  ] : undefined
                }}
                transition={{ duration: 0.5, repeat: isSelected ? Infinity : 0 }}
              />

              {/* Efecto de interacción */}
              <motion.div 
                className="absolute inset-0 bg-white/0 group-hover:bg-white/10 group-active:bg-white/20 transition-all duration-200"
              />

              {/* Indicador de porcentaje - OVERLAY */}
              <motion.div 
                className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-full text-lg font-bold shadow-lg z-20"
                initial={{ scale: 0 }}
                animate={{ scale: poll.totalVotes > 0 ? 1 : 0 }}
                transition={{ delay: 0.5 + optionIndex * 0.1 }}
              >
                {percentage}%
              </motion.div>



              {/* Badge de ganador - OVERLAY */}
              {isWinner && poll.totalVotes > 0 && (
                <motion.div 
                  className="absolute top-20 left-4 bg-green-600/95 text-white p-2 rounded-full text-sm font-bold flex items-center justify-center shadow-xl backdrop-blur-sm z-20"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 1 }}
                >
                  <Trophy className="w-4 h-4" />
                </motion.div>
              )}

              {/* Combined Profile + Title Layout - Conditional positioning */}
              <div className={cn(
                "absolute left-4 right-4 z-20",
                optionIndex < 2 ? "bottom-4" : "top-6"
              )}>
                <motion.div
                  className={cn(
                    "flex items-center px-4 py-3 rounded-2xl backdrop-blur-md shadow-2xl border border-white/20",
                    "bg-black/70"
                  )}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + optionIndex * 0.1 }}
                >
                  {/* Profile Avatar - Left side */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative transition-transform duration-200 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (option.user?.username) {
                        navigate(`/profile/${option.user.username}`);
                      }
                    }}
                  >
                    <Avatar className="w-10 h-10 ring-2 ring-white/70 shadow-lg cursor-pointer">
                      <AvatarImage src={option.user?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold">
                        {option.user?.displayName?.charAt(0) || option.id.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {option.user?.verified && (
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                        <CheckCircle className="w-3 h-3 text-blue-500 fill-current" />
                      </div>
                    )}
                  </motion.button>
                  
                  {/* Title - Centered */}
                  <div className="flex-1 flex justify-center">
                    <div className="text-white font-bold text-base leading-tight text-center">
                      {option.text}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Indicador de selección - OVERLAY COMPLETO */}
              {isSelected && (
                <motion.div 
                  className="absolute inset-0 ring-4 ring-blue-400 ring-inset z-10"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}

              {/* Indicador de ganador - OVERLAY COMPLETO */}
              {isWinner && poll.totalVotes > 0 && (
                <motion.div 
                  className="absolute inset-0 ring-3 ring-green-400 ring-inset z-10"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Header mejorado - OVERLAY SUPERIOR */}
      <motion.div 
        className="absolute top-0 left-0 right-0 z-40 p-4 pt-safe-mobile bg-gradient-to-b from-black/80 via-black/60 to-transparent"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              className="group relative transition-transform duration-200 hover:scale-105"
              onClick={(e) => {
                e.stopPropagation();
                // Create a simple username from author name
                const username = poll.author.toLowerCase().replace(/\s+/g, '_');
                navigate(`/profile/${username}`);
              }}
            >
              <Avatar className="ring-3 ring-white/70 w-12 h-12 flex-shrink-0 shadow-lg cursor-pointer">
                <AvatarImage src={poll.author?.avatar_url || "https://github.com/shadcn.png"} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                  {(poll.author?.display_name || poll.author?.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-white text-base truncate">{poll.author?.display_name || poll.author?.username || 'Usuario'}</h3>
              <p className="text-sm text-white/80 truncate">{poll.timeAgo}</p>
            </div>
            <motion.button
              className="ml-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-bold flex-shrink-0 active:scale-95 transition-all touch-manipulation shadow-lg"
              whileTap={{ scale: 0.92 }}
            >
              Seguir
            </motion.button>
          </div>
        </div>

        {/* Información de la encuesta - OVERLAY */}
        <motion.div 
          className="mt-4 bg-black/50 backdrop-blur-md rounded-2xl p-4 border border-white/20"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-bold text-white leading-tight mb-2">
            {poll.title}
          </h2>
          <div className="flex items-center gap-4 text-white/80">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">{formatNumber(poll.totalVotes)} votos</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">Trending</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Acciones laterales mejoradas - OVERLAY LATERAL */}
      <AnimatePresence>
        <motion.div 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 flex flex-col gap-3 z-40"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <QuickReaction
            icon={Heart}
            label="Me gusta"
            count={poll.likes}
            isActive={poll.userLiked}
            onClick={() => handleSwipeLeft()}
          />
          
          <QuickReaction
            icon={MessageCircle}
            label="Comentar"
            count={poll.comments}
            isActive={false}
            onClick={() => setShowCommentsModal(true)}
          />
          
          <QuickReaction
            icon={Share}
            label="Compartir"
            count={poll.shares}
            isActive={false}
            onClick={() => onShare(poll.id)}
          />
          
          <QuickReaction
            icon={Bookmark}
            label="Guardar"
            count={0}
            isActive={false}
            onClick={() => handleSwipeRight()}
          />
        </motion.div>
      </AnimatePresence>

      {/* Player de música mejorado - OVERLAY INFERIOR */}
      {poll.music && (
        <motion.div 
          className="absolute bottom-24 left-4 bg-black/60 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 max-w-[calc(100%-120px)] border border-white/20 shadow-xl z-40"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <motion.button
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform touch-manipulation shadow-lg"
            whileTap={{ scale: 0.85 }}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </motion.button>
          
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold truncate">
              {poll.music.title}
            </p>
            <p className="text-white/80 text-xs truncate">
              {poll.music.artist}
            </p>
          </div>
          
          {/* Visualizador de ondas - MEJORADO */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-white rounded-full"
                animate={isPlaying ? {
                  height: [6, 20, 10, 24, 8, 16],
                } : { height: 6 }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Indicador de progreso lateral - OVERLAY */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-30">
        {Array.from({ length: total }, (_, i) => (
          <motion.div
            key={i}
            className={cn(
              "rounded-full transition-all duration-300 shadow-lg",
              i === index
                ? "bg-white w-2 h-8 ring-2 ring-white/50"
                : "bg-white/60 w-1.5 h-6"
            )}
            whileHover={{ scale: 1.2 }}
          />
        ))}
      </div>

      {/* Efectos de partículas */}
      <AnimatePresence>
        {showParticles && (
          <ParticleEffect
            {...showParticles}
            show={true}
            onComplete={() => setShowParticles(null)}
          />
        )}
      </AnimatePresence>

      {/* Hints de navegación - OVERLAY INFERIOR */}
      {index === 0 && (
        <motion.div 
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-center text-white/90 px-4 max-w-xs z-30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-2"
          >
            <ChevronUp className="w-8 h-8 mx-auto" />
          </motion.div>
          <div className="bg-black/70 backdrop-blur-md rounded-xl p-3 border border-white/20">
            <p className="text-sm font-bold mb-1">Desliza para explorar</p>
            <p className="text-xs leading-relaxed">Toca cualquier opción para votar</p>
          </div>
        </motion.div>
      )}
      
      {/* CSS específico para pantalla completa */}
      <style jsx>{`
        .pt-safe-mobile {
          padding-top: max(16px, env(safe-area-inset-top));
        }
        
        .touch-manipulation {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Optimizaciones para pantalla completa */
        .grid-cols-2 > * {
          min-height: 50vh;
        }
        
        /* Prevenir zoom en inputs */
        input[type="text"] {
          font-size: 16px;
        }
        
        /* Mejor contraste para texto sobre imágenes */
        .backdrop-blur-md {
          backdrop-filter: blur(12px);
        }
        
        .backdrop-blur-sm {
          backdrop-filter: blur(6px);
        }
      `}</style>

      {/* Modal de comentarios */}
      <CommentsModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        pollId={poll.id}
        pollTitle={poll.title}
        pollAuthor={poll.author}
      />
    </motion.div>
  );
};

export default AdvancedPollCard;