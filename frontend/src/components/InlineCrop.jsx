/**
 * InlineCrop - Simple crop functionality without black areas
 * - Uses object-cover + object-position (safer than transforms)
 * - Prevents black areas by design
 * - Mobile-first touch gestures
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

const InlineCrop = ({
  isActive = false,
  imageSrc = '',
  savedTransform = null,
  onSave = () => {},
  onCancel = () => {},
  className = ''
}) => {
  // Enhanced position and scale state
  const [position, setPosition] = useState({ x: 50, y: 50 }); // Percentage for object-position
  const [scale, setScale] = useState(1); // Scale for zoom
  const [hasChanges, setHasChanges] = useState(false);
  
  // Touch interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });
  const [lastDistance, setLastDistance] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  const containerRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);

  // Reset position when becoming active
  useEffect(() => {
    if (isActive) {
      if (savedTransform && savedTransform.position) {
        setPosition(savedTransform.position);
      } else {
        setPosition({ x: 50, y: 50 }); // Default center
      }
      setHasChanges(false);
      setIsInteracting(false);
      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    }
  }, [isActive, savedTransform]);

  // Auto-save after interaction
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (hasChanges) {
        onSave({
          position: position,
          originalImageSrc: imageSrc
        });
        setHasChanges(false);
      }
    }, 800);
  }, [hasChanges, position, imageSrc, onSave]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Handle start of interaction
  const handleStart = (e) => {
    if (!isActive) return;
    
    e.preventDefault();
    setIsInteracting(true);
    
    if (e.touches) {
      const touch = e.touches[0];
      setIsDragging(true);
      setLastTouch({ x: touch.clientX, y: touch.clientY });
    } else {
      setIsDragging(true);  
      setLastTouch({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle movement
  const handleMove = useCallback((e) => {
    if (!isActive || !isInteracting || !isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const deltaX = clientX - lastTouch.x;
    const deltaY = clientY - lastTouch.y;
    
    // Convert movement to object-position percentage change (very conservative)
    const sensitivity = 0.1; // Very low sensitivity
    const deltaPercentX = deltaX * sensitivity;
    const deltaPercentY = deltaY * sensitivity;
    
    setPosition(prev => ({
      x: Math.max(0, Math.min(100, prev.x + deltaPercentX)),
      y: Math.max(0, Math.min(100, prev.y + deltaPercentY))
    }));
    
    setLastTouch({ x: clientX, y: clientY });
    setHasChanges(true);
  }, [isActive, isInteracting, isDragging, lastTouch]);

  // Handle end of interaction
  const handleEnd = useCallback(() => {
    if (!isActive) return;
    
    setIsDragging(false);
    setIsInteracting(false);
    
    if (hasChanges) {
      scheduleAutoSave();
    }
  }, [isActive, hasChanges, scheduleAutoSave]);

  // Global event listeners
  useEffect(() => {
    if (!isActive) return;

    const handleGlobalMove = (e) => {
      if (isInteracting) {
        handleMove(e);
      }
    };

    const handleGlobalEnd = () => {
      if (isInteracting) {
        handleEnd();
      }
    };

    document.addEventListener('touchmove', handleGlobalMove, { passive: false });
    document.addEventListener('touchend', handleGlobalEnd);
    document.addEventListener('mousemove', handleGlobalMove);
    document.addEventListener('mouseup', handleGlobalEnd);

    return () => {
      document.removeEventListener('touchmove', handleGlobalMove);
      document.removeEventListener('touchend', handleGlobalEnd);
      document.removeEventListener('mousemove', handleGlobalMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
    };
  }, [isActive, isInteracting, handleMove, handleEnd]);

  if (!isActive) {
    // Normal display with object-position
    const displayPosition = savedTransform?.position || { x: 50, y: 50 };
    
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`} ref={containerRef}>
        <img
          src={imageSrc}
          alt="Preview"
          className="w-full h-full object-cover"
          style={{
            objectPosition: `${displayPosition.x}% ${displayPosition.y}%`
          }}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    );
  }

  // Crop mode - same as display but interactive
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`} style={{ pointerEvents: 'auto' }}>
      {/* Interactive image */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-move select-none z-10"
        onTouchStart={handleStart}
        onMouseDown={handleStart}
        style={{ touchAction: 'none', pointerEvents: 'auto' }}
      >
        <img
          src={imageSrc}
          alt="Adjust preview"
          className="w-full h-full object-cover"
          style={{
            objectPosition: `${position.x}% ${position.y}%`
          }}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>

      {/* Cancel button */}
      <div className="absolute top-4 right-4 pointer-events-auto z-30">
        <button
          onClick={onCancel}
          className="w-12 h-12 bg-black/70 hover:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-200"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Status indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none z-30">
        <div className="bg-black/70 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {isInteracting 
            ? '👆 Ajustando posición...' 
            : hasChanges 
              ? '💾 Guardando ajustes...'
              : '👆 Arrastra para ajustar'
          }
        </div>
      </div>
    </div>
  );
};

export default InlineCrop;