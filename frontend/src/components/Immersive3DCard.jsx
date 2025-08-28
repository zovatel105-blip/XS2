import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '../lib/utils';
import { 
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal, 
  Play, Pause, Volume2, VolumeX, Trophy, CheckCircle,
  Sparkles, Zap, Flame, Star
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';

// Advanced 3D Card with depth layering and parallax
const Immersive3DCard = ({ 
  poll, 
  onVote, 
  onLike, 
  onShare, 
  onComment, 
  onBookmark,
  isActive = false,
  className = ""
}) => {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(poll.userVote || null);
  const [showResults, setShowResults] = useState(poll.userVote !== null);
  
  // Mouse tracking for 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Spring animations for smooth 3D movement
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7.5, -7.5]));
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7.5, 7.5]));
  
  // Depth layers with different parallax speeds
  const backgroundZ = useTransform(rotateY, [-7.5, 7.5], [-20, 20]);
  const contentZ = useTransform(rotateY, [-7.5, 7.5], [-10, 10]);
  const foregroundZ = useTransform(rotateY, [-7.5, 7.5], [10, -10]);
  
  // Handle mouse movement for 3D effect
  const handleMouseMove = (event) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = (event.clientX - centerX) / (rect.width / 2);
    const y = (event.clientY - centerY) / (rect.height / 2);
    
    mouseX.set(x);
    mouseY.set(y);
  };
  
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };
  
  const handleVote = (optionId) => {
    if (selectedOption) return; // Already voted
    
    setSelectedOption(optionId);
    setShowResults(true);
    onVote?.(poll.id, optionId);
    
    // Trigger reward animation
    triggerRewardEffect();
  };
  
  const triggerRewardEffect = () => {
    // Create particle explosion effect
    const card = cardRef.current;
    if (!card) return;
    
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full pointer-events-none';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.zIndex = '1000';
      
      card.appendChild(particle);
      
      // Animate particle
      particle.animate([
        { transform: 'scale(0) translateY(0px)', opacity: 1 },
        { transform: 'scale(1) translateY(-100px)', opacity: 0 }
      ], {
        duration: 1000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }).onfinish = () => particle.remove();
    }
  };
  
  const getOptionPercentage = (option) => {
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
  
  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "relative w-full max-w-md mx-auto bg-white rounded-3xl overflow-hidden",
        "shadow-2xl cursor-pointer select-none",
        className
      )}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000
      }}
      animate={{
        scale: isHovered ? 1.02 : 1,
        y: isHovered ? -5 : 0
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileHover={{ 
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
      }}
    >
      {/* Background Layer - Deepest */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"
        style={{
          translateZ: backgroundZ,
          transform: "translateZ(-30px)"
        }}
      />
      
      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-40"
        animate={{
          background: [
            "linear-gradient(45deg, rgba(168, 85, 247, 0.4) 0%, rgba(59, 130, 246, 0.4) 100%)",
            "linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(168, 85, 247, 0.4) 100%)",
            "linear-gradient(225deg, rgba(168, 85, 247, 0.4) 0%, rgba(59, 130, 246, 0.4) 100%)",
            "linear-gradient(315deg, rgba(59, 130, 246, 0.4) 0%, rgba(168, 85, 247, 0.4) 100%)"
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Content Layer - Middle */}
      <motion.div
        className="relative z-10 p-6"
        style={{
          translateZ: contentZ,
          transform: "translateZ(10px)"
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Avatar className="w-12 h-12 border-2 border-white/20">
                <AvatarImage src={poll.author?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                  {(poll.author?.display_name || poll.author?.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{poll.author?.display_name || poll.author?.username || 'Usuario'}</h3>
                {poll.author?.is_verified && (
                  <CheckCircle className="w-4 h-4 text-blue-400 fill-current" />
                )}
              </div>
              <p className="text-sm text-white/70">{poll.timeAgo}</p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-white" />
          </motion.button>
        </div>
        
        {/* Poll Title */}
        <motion.h2 
          className="text-xl font-bold text-white mb-6 leading-tight"
          style={{
            translateZ: foregroundZ
          }}
        >
          {poll.title}
        </motion.h2>
        
        {/* Poll Options with 3D Effect */}
        <div className="space-y-3 mb-6">
          {poll.options.map((option, index) => {
            const percentage = getOptionPercentage(option);
            const isWinner = winningOption?.id === option.id;
            const isSelected = selectedOption === option.id;
            
            return (
              <motion.div
                key={option.id}
                className="relative overflow-hidden rounded-2xl cursor-pointer"
                style={{
                  translateZ: index % 2 === 0 ? "5px" : "10px"
                }}
                whileHover={{ 
                  scale: selectedOption ? 1 : 1.02,
                  translateZ: "15px"
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleVote(option.id)}
              >
                {/* Option Background */}
                <div className={cn(
                  "relative p-4 backdrop-blur-sm border border-white/20",
                  selectedOption 
                    ? isSelected 
                      ? "bg-gradient-to-r from-green-500/20 to-blue-500/20"
                      : "bg-white/10"
                    : "bg-white/10 hover:bg-white/20"
                )}>
                  {/* Results Progress Bar */}
                  {showResults && (
                    <motion.div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-r",
                        isWinner 
                          ? "from-green-500/30 to-emerald-500/30"
                          : isSelected
                            ? "from-blue-500/30 to-purple-500/30"
                            : "from-gray-500/20 to-gray-600/20"
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  )}
                  
                  {/* Option Content */}
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {option.emoji && (
                        <span className="text-2xl">{option.emoji}</span>
                      )}
                      <span className="font-medium text-white">{option.text}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {showResults && (
                        <span className="text-sm font-bold text-white">
                          {percentage}%
                        </span>
                      )}
                      
                      {isWinner && showResults && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5, type: "spring" }}
                        >
                          <Trophy className="w-5 h-5 text-yellow-400 fill-current" />
                        </motion.div>
                      )}
                      
                      {isSelected && (
                        <motion.div
                          className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring" }}
                        >
                          <CheckCircle className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Poll Stats */}
        {showResults && (
          <motion.div
            className="flex items-center gap-4 text-sm text-white/70 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span>{poll.totalVotes.toLocaleString()} votos</span>
            <span>•</span>
            <span>{poll.timeRemaining}</span>
          </motion.div>
        )}
      </motion.div>
      
      {/* Action Layer - Foreground */}
      <motion.div
        className="relative z-20 px-6 pb-6"
        style={{
          translateZ: foregroundZ,
          transform: "translateZ(20px)"
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full",
                "bg-white/10 backdrop-blur-sm border border-white/20",
                "hover:bg-white/20 transition-colors",
                poll.userLiked && "text-red-400"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onLike?.(poll.id);
              }}
            >
              <Heart className={cn(
                "w-5 h-5",
                poll.userLiked && "fill-current"
              )} />
              <span className="text-sm font-medium text-white">
                {poll.likes.toLocaleString()}
              </span>
            </motion.button>
            
            <motion.button
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onComment?.(poll.id);
              }}
            >
              <MessageCircle className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white">
                {poll.comments.toLocaleString()}
              </span>
            </motion.button>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onShare?.(poll.id);
              }}
            >
              <Send className="w-5 h-5 text-white" />
            </motion.button>
            
            <motion.button
              className={cn(
                "p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors",
                poll.userBookmarked && "text-yellow-400"
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onBookmark?.(poll.id);
              }}
            >
              <Bookmark className={cn(
                "w-5 h-5",
                poll.userBookmarked && "fill-current"
              )} />
            </motion.button>
          </div>
        </div>
      </motion.div>
      
      {/* Floating elements for depth */}
      <motion.div
        className="absolute top-4 right-4 opacity-30"
        animate={{
          y: [0, -10, 0],
          rotate: [0, 5, 0]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ translateZ: "30px" }}
      >
        <Sparkles className="w-6 h-6 text-white" />
      </motion.div>
      
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0"
        animate={{
          opacity: isHovered ? 0.3 : 0
        }}
        transition={{ duration: 0.3 }}
        style={{ translateZ: "-10px" }}
      />
    </motion.div>
  );
};

export default Immersive3DCard;