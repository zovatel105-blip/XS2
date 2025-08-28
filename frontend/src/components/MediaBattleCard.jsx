import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '../lib/utils';
import { 
  Heart, MessageCircle, Send, Play, Pause, Volume2, VolumeX, 
  CheckCircle, Flame, Zap, Star, Award, Users,
  Camera, Music, Sparkles, Trophy, TrendingUp, Target
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';

// Revolutionary Media Battle Card - The core innovation
const MediaBattleCard = ({ 
  poll, 
  onVote, 
  onLike, 
  onShare, 
  onComment,
  viewMode = 'battle', // 'battle', 'grid', 'carousel'
  className = ""
}) => {
  const [votingPhase, setVotingPhase] = useState('ready'); // 'ready', 'voting', 'results'
  const [selectedOption, setSelectedOption] = useState(poll.userVote || null);
  const [showResults, setShowResults] = useState(poll.userVote !== null);
  const [battleMode, setBattleMode] = useState(false);
  const [currentBattle, setCurrentBattle] = useState({ left: 0, right: 1 });
  const [battleWinner, setBattleWinner] = useState(null);
  const [explosionTrigger, setExplosionTrigger] = useState(false);
  
  const cardRef = useRef(null);
  
  // Advanced 3D hover effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]));
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]));
  
  const handleMouseMove = useCallback((event) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = (event.clientX - centerX) / (rect.width / 2);
    const y = (event.clientY - centerY) / (rect.height / 2);
    
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);
  
  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);
  
  // Revolutionary voting mechanism
  const handleVote = async (optionId) => {
    if (selectedOption) return;
    
    setVotingPhase('voting');
    setSelectedOption(optionId);
    
    // Trigger explosion effect
    setExplosionTrigger(true);
    
    setTimeout(() => {
      setVotingPhase('results');
      setShowResults(true);
      onVote?.(poll.id, optionId);
      setExplosionTrigger(false);
    }, 1000);
  };
  
  // Battle mode between two options
  const enterBattleMode = (leftIndex, rightIndex) => {
    setBattleMode(true);
    setCurrentBattle({ left: leftIndex, right: rightIndex });
  };
  
  const exitBattleMode = () => {
    setBattleMode(false);
    setBattleWinner(null);
  };
  
  const getPercentage = (option) => {
    if (!showResults || poll.totalVotes === 0) return 0;
    return Math.round((option.votes / poll.totalVotes) * 100);
  };
  
  const getWinningOption = () => {
    if (!showResults || !poll.options || poll.options.length === 0) return null;
    return poll.options.reduce((max, option) => 
      option.votes > max.votes ? option : max, poll.options[0]
    );
  };
  
  const winningOption = getWinningOption();
  
  // Revolutionary Battle Mode UI
  if (battleMode) {
    const leftOption = poll.options[currentBattle.left];
    const rightOption = poll.options[currentBattle.right];
    
    return (
      <motion.div
        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Battle Arena Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-red-900/30" />
          <div className="absolute inset-0">
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Battle Header */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
          <motion.div
            className="text-center"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
              BATALLA ÉPICA
            </h1>
            <p className="text-white/80 text-lg">{poll.title}</p>
          </motion.div>
        </div>
        
        {/* VS Badge */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        >
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full flex items-center justify-center border-4 border-white shadow-2xl">
            <span className="text-2xl font-black text-white">VS</span>
          </div>
        </motion.div>
        
        {/* Battle Options */}
        <div className="flex items-center justify-center w-full h-full px-8 gap-8">
          {/* Left Option */}
          <motion.div
            className="flex-1 max-w-md"
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <BattleOptionCard
              option={leftOption}
              isLeft={true}
              onVote={() => handleVote(leftOption.id)}
              percentage={getPercentage(leftOption)}
              isWinner={winningOption?.id === leftOption.id}
              isSelected={selectedOption === leftOption.id}
              showResults={showResults}
            />
          </motion.div>
          
          {/* Right Option */}
          <motion.div
            className="flex-1 max-w-md"
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <BattleOptionCard
              option={rightOption}
              isLeft={false}
              onVote={() => handleVote(rightOption.id)}
              percentage={getPercentage(rightOption)}
              isWinner={winningOption?.id === rightOption.id}
              isSelected={selectedOption === rightOption.id}
              showResults={showResults}
            />
          </motion.div>
        </div>
        
        {/* Exit Battle Mode */}
        <motion.button
          className="absolute top-8 right-8 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
          onClick={exitBattleMode}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ✕
        </motion.button>
        
        {/* Battle Stats */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <motion.div
            className="flex items-center gap-6 px-6 py-3 bg-white/10 backdrop-blur-lg rounded-full border border-white/20"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5" />
              <span>{poll.totalVotes} votos</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5" />
              <span>En tendencia</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }
  
  // Main Poll Card UI
  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "relative w-full max-w-lg mx-auto bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl overflow-hidden shadow-2xl",
        className
      )}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d"
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Explosion Effect */}
      <AnimatePresence>
        {explosionTrigger && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full"
                style={{
                  left: '50%',
                  top: '50%'
                }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [1, 0.8, 0],
                  x: (Math.random() - 0.5) * 300,
                  y: (Math.random() - 0.5) * 300
                }}
                transition={{
                  duration: 1.5,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header */}
      <div className="relative z-10 p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 ring-3 ring-gradient-to-r from-purple-500 to-pink-500">
              <AvatarImage src={poll.author?.avatar_url || "https://github.com/shadcn.png"} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold">
                {(poll.author?.display_name || poll.author?.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-gray-900">{poll.author?.display_name || poll.author?.username || 'Usuario'}</h3>
              <p className="text-sm text-gray-500">{poll.timeAgo}</p>
            </div>
          </div>
          
          {/* Battle Mode Toggle */}
          <motion.button
            className="p-2 bg-gradient-to-r from-red-500 to-purple-600 text-white rounded-xl shadow-lg"
            onClick={() => enterBattleMode(0, 1)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Target className="w-5 h-5" />
          </motion.button>
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 leading-tight mb-4">
          {poll.title}
        </h2>
        
        {/* Voting Progress */}
        {showResults && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{poll.totalVotes} votos</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-orange-600">
              <Flame className="w-4 h-4" />
              <span>En tendencia</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Revolutionary Media Grid */}
      <div className="px-6 mb-6">
        <div className={cn(
          "grid gap-3",
          poll.options.length === 2 ? "grid-cols-2" :
          poll.options.length === 3 ? "grid-cols-3" :
          "grid-cols-2"
        )}>
          {poll.options.map((option, index) => {
            const percentage = getPercentage(option);
            const isWinner = winningOption?.id === option.id;
            const isSelected = selectedOption === option.id;
            
            return (
              <RevolutionaryMediaOption
                key={option.id}
                option={option}
                percentage={percentage}
                isWinner={isWinner}
                isSelected={isSelected}
                showResults={showResults}
                onVote={() => handleVote(option.id)}
                votingPhase={votingPhase}
                index={index}
              />
            );
          })}
        </div>
      </div>
      
      {/* Social Actions */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100">
          <div className="flex items-center gap-6">
            <motion.button
              className={cn(
                "flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors",
                poll.userLiked && "text-red-500"
              )}
              onClick={() => onLike?.(poll.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className={cn("w-5 h-5", poll.userLiked && "fill-current")} />
              <span className="font-semibold">{poll.likes.toLocaleString()}</span>
            </motion.button>
            
            <motion.button
              className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
              onClick={() => onComment?.(poll.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">{poll.comments.toLocaleString()}</span>
            </motion.button>
          </div>
          
          <motion.button
            className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
            onClick={() => onShare?.(poll.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-5 h-5" />
            <span className="font-semibold">{poll.shares.toLocaleString()}</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Revolutionary Media Option Component
const RevolutionaryMediaOption = ({
  option,
  percentage,
  isWinner,
  isSelected,
  showResults,
  onVote,
  votingPhase,
  index
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  return (
    <motion.div
      className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
      onClick={onVote}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
    >
      {/* Media Background */}
      {option.media?.type === 'video' ? (
        <div className="absolute inset-0">
          <img 
            src={option.media.thumbnail} 
            alt="Video thumbnail"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <motion.div
              className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center"
              animate={{ scale: isHovered ? 1.1 : 1 }}
            >
              <Play className="w-6 h-6 text-gray-800 ml-1" />
            </motion.div>
          </div>
        </div>
      ) : (
        <img 
          src={option.media?.url} 
          alt={option.text}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      )}
      
      {/* Progress Overlay */}
      {showResults && (
        <motion.div
          className={cn(
            "absolute inset-x-0 bottom-0 bg-gradient-to-t",
            isSelected 
              ? "from-blue-600/80 to-blue-500/40"
              : isWinner
                ? "from-green-600/80 to-green-500/40"
                : "from-gray-600/60 to-gray-500/30"
          )}
          initial={{ height: 0 }}
          animate={{ height: `${percentage}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      )}
      
      {/* User Avatar */}
      <div className="absolute top-3 right-3">
        <Avatar className={cn(
          "w-8 h-8 ring-2",
          isSelected 
            ? "ring-blue-400"
            : isWinner && showResults
              ? "ring-green-400"
              : "ring-white/50"
        )}>
          <AvatarImage src={option.user?.avatar} />
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold text-xs">
            {option.user?.displayName?.charAt(0) || option.id.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      
      {/* Percentage Badge */}
      {showResults && (
        <motion.div
          className="absolute top-3 left-3 px-2 py-1 bg-black/70 text-white rounded-full text-sm font-bold"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1 }}
        >
          {percentage}%
        </motion.div>
      )}
      
      {/* Winner Crown */}
      {isWinner && showResults && (
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
        >
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
            <Trophy className="w-8 h-8 text-white" />
          </div>
        </motion.div>
      )}
      
      {/* User Info at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <p className="text-white font-semibold text-sm truncate">
            {option.user?.displayName}
          </p>
          {option.user?.verified && (
            <CheckCircle className="w-3 h-3 text-blue-400 fill-current flex-shrink-0" />
          )}
        </div>
        <p className="text-white/80 text-xs truncate mt-1">
          {option.text}
        </p>
      </div>
      
      {/* Selection Ring */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 ring-4 ring-blue-500 rounded-2xl"
          animate={{
            ringOpacity: [0.6, 1, 0.6]
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
      
      {/* Hover Glow Effect */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
};

// Battle Option Card for epic battles
const BattleOptionCard = ({
  option,
  isLeft,
  onVote,
  percentage,
  isWinner,
  isSelected,
  showResults
}) => {
  return (
    <motion.div
      className="relative bg-gradient-to-br from-gray-900 to-black rounded-3xl overflow-hidden shadow-2xl cursor-pointer"
      onClick={onVote}
      whileHover={{ scale: 1.05, rotateY: isLeft ? 5 : -5 }}
      whileTap={{ scale: 0.95 }}
      style={{ height: '60vh' }}
    >
      {/* Media Background */}
      <div className="absolute inset-0">
        {option.media?.type === 'video' ? (
          <img 
            src={option.media.thumbnail} 
            alt="Battle option"
            className="w-full h-full object-cover"
          />
        ) : (
          <img 
            src={option.media?.url} 
            alt={option.text}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
      </div>
      
      {/* Battle Glow */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-3xl ring-4",
          isLeft ? "ring-blue-500/50" : "ring-red-500/50"
        )}
        animate={{
          ringOpacity: [0.3, 0.8, 0.3]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* User Info */}
      <div className="absolute top-6 left-6 right-6">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 ring-3 ring-white/50">
            <AvatarImage src={option.user?.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold">
              {((option.user?.displayName || option.user?.username || 'U') + '').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-lg">{option.user?.displayName}</h3>
              {option.user?.verified && (
                <CheckCircle className="w-5 h-5 text-blue-400 fill-current" />
              )}
            </div>
            <p className="text-white/80 text-sm">{option.user?.followers} seguidores</p>
          </div>
        </div>
      </div>
      
      {/* Battle Stats */}
      {showResults && (
        <motion.div
          className="absolute bottom-6 left-6 right-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-4">
            <div className="text-center mb-3">
              <div className="text-3xl font-black text-white mb-1">
                {percentage}%
              </div>
              <div className="text-white/80 text-sm">
                {Math.round((percentage / 100) * 1000)} votos
              </div>
            </div>
            
            {isWinner && (
              <motion.div
                className="flex items-center justify-center gap-2 text-yellow-400"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring" }}
              >
                <Trophy className="w-6 h-6" />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MediaBattleCard;