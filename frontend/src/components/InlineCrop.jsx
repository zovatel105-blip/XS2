/**
 * InlineCrop - Simple crop functionality without black areas
 * - Uses object-cover + object-position (safer than transforms)
 * - Prevents black areas by design
 * - Mobile-first touch gestures
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Check } from 'lucide-react';

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
        setScale(savedTransform.scale || 1);
      } else {
        setPosition({ x: 50, y: 50 }); // Default center
        setScale(1);
      }
      setHasChanges(false);
      setIsInteracting(false);
      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    }
  }, [isActive, savedTransform]);

  // Save only when exiting crop mode
  const saveOnExit = useCallback(() => {
    if (hasChanges) {
      onSave({
        position: position,
        scale: scale,
        originalImageSrc: imageSrc
      });
      setHasChanges(false);
    }
  }, [hasChanges, position, scale, imageSrc, onSave]);

  // Save when component becomes inactive (user exits crop mode)
  useEffect(() => {
    if (!isActive && hasChanges) {
      saveOnExit();
    }
  }, [isActive, hasChanges, saveOnExit]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Get distance between touches for pinch gesture
  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle start of interaction
  const handleStart = (e) => {
    if (!isActive) return;
    
    e.preventDefault();
    setIsInteracting(true);
    
    if (e.touches) {
      const touches = e.touches;
      if (touches.length === 1) {
        // Single touch - drag
        setIsDragging(true);
        setLastTouch({ x: touches[0].clientX, y: touches[0].clientY });
      } else if (touches.length === 2) {
        // Two finger pinch
        setIsDragging(false);
        setLastDistance(getDistance(touches));
        const centerX = (touches[0].clientX + touches[1].clientX) / 2;
        const centerY = (touches[0].clientY + touches[1].clientY) / 2;
        setLastTouch({ x: centerX, y: centerY });
      }
    } else {
      setIsDragging(true);  
      setLastTouch({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle movement
  const handleMove = useCallback((e) => {
    if (!isActive || !isInteracting) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (e.touches) {
      const touches = e.touches;
      
      if (touches.length === 1 && isDragging) {
        // Single finger drag
        const touch = touches[0];
        const deltaX = touch.clientX - lastTouch.x;
        const deltaY = touch.clientY - lastTouch.y;
        
        // Better sensitivity for drag - INVERTED for intuitive movement
        const sensitivity = 0.3;
        const deltaPercentX = -deltaX * sensitivity; // NEGATIVE for correct direction
        const deltaPercentY = -deltaY * sensitivity; // NEGATIVE for correct direction
        
        setPosition(prev => ({
          x: Math.max(10, Math.min(90, prev.x + deltaPercentX)),
          y: Math.max(10, Math.min(90, prev.y + deltaPercentY))
        }));
        
        setLastTouch({ x: touch.clientX, y: touch.clientY });
        setHasChanges(true);
        
      } else if (touches.length === 2) {
        // Pinch zoom
        const distance = getDistance(touches);
        const scaleFactor = distance / lastDistance;
        
        if (scaleFactor > 0.8 && scaleFactor < 1.2) {
          setScale(prev => {
            const newScale = prev * scaleFactor;
            return Math.max(1, Math.min(3, newScale)); // Scale 1x to 3x
          });
          
          setLastDistance(distance);
          setHasChanges(true);
        }
      }
    } else if (isDragging) {
      // Mouse drag
      const deltaX = e.clientX - lastTouch.x;
      const deltaY = e.clientY - lastTouch.y;
      
      const sensitivity = 0.3;
      const deltaPercentX = -deltaX * sensitivity; // NEGATIVE for correct direction
      const deltaPercentY = -deltaY * sensitivity; // NEGATIVE for correct direction
      
      setPosition(prev => ({
        x: Math.max(10, Math.min(90, prev.x + deltaPercentX)),
        y: Math.max(10, Math.min(90, prev.y + deltaPercentY))
      }));
      
      setLastTouch({ x: e.clientX, y: e.clientY });
      setHasChanges(true);
    }
  }, [isActive, isInteracting, isDragging, lastTouch, lastDistance]);

  // Handle end of interaction - with auto-save
  const handleEnd = useCallback(() => {
    if (!isActive) return;
    
    setIsDragging(false);
    setIsInteracting(false);
    
    // Auto-save after interaction ends
    if (hasChanges) {
      scheduleAutoSave();
    }
  }, [isActive, hasChanges, scheduleAutoSave]);

  // Handle mouse wheel zoom - with auto-save
  const handleWheel = (e) => {
    if (!isActive) return;
    
    e.preventDefault();
    
    const scaleDelta = e.deltaY > 0 ? 0.95 : 1.05;
    
    setScale(prev => {
      const newScale = prev * scaleDelta;
      return Math.max(1, Math.min(3, newScale));
    });
    
    setHasChanges(true);
    scheduleAutoSave(); // Auto-save after wheel zoom
  };

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
    // Normal display with object-position and scale
    const displayPosition = savedTransform?.position || { x: 50, y: 50 };
    const displayScale = savedTransform?.scale || 1;
    
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`} ref={containerRef}>
        <img
          src={imageSrc}
          alt="Preview"
          className="w-full h-full object-cover"
          style={{
            objectPosition: `${displayPosition.x}% ${displayPosition.y}%`,
            transform: `scale(${displayScale})`,
            transformOrigin: 'center'
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
        onWheel={handleWheel}
        style={{ touchAction: 'none', pointerEvents: 'auto' }}
      >
        <img
          src={imageSrc}
          alt="Adjust preview"
          className="w-full h-full object-cover"
          style={{
            objectPosition: `${position.x}% ${position.y}%`,
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            transition: isInteracting ? 'none' : 'transform 0.2s ease-out'
          }}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>

    </div>
  );
};

export default InlineCrop;