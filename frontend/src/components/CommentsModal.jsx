import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, Minus } from 'lucide-react';
import { Button } from './ui/button';
import CommentSection from './CommentSection';
import { cn } from '../lib/utils';

const CommentsModal = ({ 
  isOpen, 
  onClose, 
  pollId, 
  pollTitle = "Comentarios",
  pollAuthor = null,
  commentsEnabled = true
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
              "relative bg-white shadow-2xl overflow-hidden flex flex-col",
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
            {/* Handle superior - ambos móvil y desktop */}
            <div className="w-full py-2 flex justify-center bg-white flex-shrink-0">
              <div className={cn(
                "bg-gray-300 rounded-full",
                isMobile ? "w-10 h-1" : "w-12 h-1"
              )} />
            </div>

            {/* Header minimalista centrado */}
            <div className="sticky top-0 z-10 bg-white px-4 sm:px-6 py-3 flex-shrink-0">
              <div className="flex items-center justify-center">
                <h2 className={cn(
                  "font-semibold text-gray-900 text-center",
                  isMobile ? "text-base" : "text-lg"
                )}>
                  Comentarios
                </h2>
              </div>
            </div>
            
            {/* Contenido que ocupa todo el espacio restante */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {!commentsEnabled ? (
                // Mensaje cuando los comentarios están deshabilitados
                <div className="flex-1 flex items-center justify-center p-8">
                  <p className="text-gray-500 text-center text-base">
                    Este creador desactivó los comentarios
                  </p>
                </div>
              ) : (
                // Sección de comentarios normal
                <CommentSection
                  pollId={pollId}
                  isVisible={isOpen}
                  maxHeight="100%"
                  showHeader={false}
                />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default CommentsModal;