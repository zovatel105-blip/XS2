import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Sparkles, Minus } from 'lucide-react';
import { Button } from './ui/button';
import CommentSection from './CommentSection';
import { cn } from '../lib/utils';

const CommentsModal = ({ 
  isOpen, 
  onClose, 
  pollId, 
  pollTitle = "Comentarios",
  pollAuthor = null 
}) => {
  const modalRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Manejar escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Click outside para cerrar
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Variantes de animación
  const modalVariants = {
    hidden: isMobile 
      ? { opacity: 0, y: "100%" } 
      : { opacity: 0, scale: 0.85, y: 60 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0 
    },
    exit: isMobile 
      ? { opacity: 0, y: "100%" }
      : { opacity: 0, scale: 0.85, y: 60 }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        />
        
        {/* Modal Container */}
        <div className={cn(
          "flex h-full",
          isMobile ? "items-end justify-center" : "items-center justify-center p-4"
        )}>
          <motion.div
            ref={modalRef}
            className={cn(
              "relative bg-white shadow-2xl overflow-hidden",
              isMobile 
                ? "w-full h-[70vh] rounded-t-3xl" 
                : "w-full max-w-2xl max-h-[92vh] rounded-2xl"
            )}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ 
              type: "spring", 
              stiffness: 380, 
              damping: 30,
              duration: 0.4 
            }}
          >
            {/* Handle para móviles */}
            {isMobile && (
              <div className="w-full p-3 flex justify-center">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>
            )}

            {/* Header minimalista */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className={cn(
                    "font-semibold text-gray-900 truncate",
                    isMobile ? "text-lg" : "text-xl"
                  )}>
                    {pollTitle}
                  </h2>
                  {pollAuthor && (
                    <p className={cn(
                      "text-gray-500 mt-0.5 truncate",
                      isMobile ? "text-xs" : "text-sm"
                    )}>
                      por <span className="font-medium text-gray-700">{pollAuthor}</span>
                    </p>
                  )}
                </div>
                
                <button
                  onClick={onClose}
                  className={cn(
                    "p-0 hover:bg-gray-100 rounded-full transition-all duration-200 flex-shrink-0 ml-4 flex items-center justify-center",
                    isMobile ? "h-8 w-8" : "h-10 w-10"
                  )}
                >
                  <X className={cn("text-gray-500", isMobile ? "w-5 h-5" : "w-6 h-6")} />
                </button>
              </div>
            </div>
            
            {/* Contenido con altura dinámica */}
            <div className={cn(
              "flex flex-col overflow-hidden",
              isMobile 
                ? "h-[calc(60vh-80px)]" 
                : "h-[calc(92vh-100px)]"
            )}>
              <CommentSection
                pollId={pollId}
                isVisible={isOpen}
                maxHeight="100%"
                showHeader={false}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default CommentsModal;