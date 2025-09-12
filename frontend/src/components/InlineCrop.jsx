/**
 * InlineCrop - TikTok-style crop functionality directly in the preview area
 * - Mobile-first touch gestures with desktop support
 * - Minimalist TikTok-inspired UI
 * - Smooth pinch-to-zoom with bounce limits
 * - Drag to reposition without going outside bounds
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Check, X } from 'lucide-react';

const InlineCrop = ({
  isActive = false,
  imageSrc = '',
  savedTransform = null, // Saved transform parameters
  onSave = () => {},
  onCancel = () => {},
  className = ''
}) => {
  // Transform state for the image
  const [transform, setTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0
  });

  // Touch interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });
  const [lastDistance, setLastDistance] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [containerSize, setContainerSize] = useState({ width: 1, height: 1 });

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);

  // Reset transform when becoming active, or load saved transform
  useEffect(() => {
    if (isActive) {
      // Load saved transform if available, otherwise reset
      const initialTransform = savedTransform || { scale: 1, translateX: 0, translateY: 0 };
      setTransform(initialTransform);
      setIsInteracting(false);
      setHasChanges(false);
      
      // Clear any pending auto-save
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    }
  // Calculate smart initial transform for complete image + layout adaptation
  const calculateSmartTransform = useCallback(() => {
    if (!containerRef.current || imageSize.width <= 1 || imageSize.height <= 1) {
      return { scale: 1, translateX: 0, translateY: 0 };
    }

    const container = containerRef.current.getBoundingClientRect();
    const containerAspect = container.width / container.height;
    const imageAspect = imageSize.width / imageSize.height;

    let scale = 1;
    
    // Calculate scale to show complete image while filling layout
    if (imageAspect > containerAspect) {
      // Image is wider - scale based on height to show complete image
      scale = container.height / imageSize.height;
    } else {
      // Image is taller - scale based on width to show complete image  
      scale = container.width / imageSize.width;
    }

    // Ensure minimum scale to fill the container (no empty areas)
    const minScaleX = container.width / imageSize.width;
    const minScaleY = container.height / imageSize.height;
    const minScale = Math.max(minScaleX, minScaleY);
    
    // Use the scale that shows complete image but fills the space
    scale = Math.max(scale, minScale);

    return {
      scale: scale,
      translateX: 0,
      translateY: 0
    };
  }, [imageSize]);

  // Handle image load to get dimensions
  const handleImageLoad = useCallback((e) => {
    const img = e.target;
    setImageSize({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
  }, []);

  // Update container size on mount and resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateContainerSize = () => {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };

    updateContainerSize();
    
    const resizeObserver = new ResizeObserver(updateContainerSize);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [isActive]);

  // Auto-save after interaction ends - marks image as adjusted for layout adaptation
  const scheduleAutoSave = useCallback(() => {
    // Clear previous timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Schedule auto-save after 800ms of inactivity
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (hasChanges) {
        // Save transform parameters - marks as adjusted for layout adaptation
        onSave({
          transform: {
            scale: transform.scale,
            translateX: transform.translateX,
            translateY: transform.translateY
          },
          originalImageSrc: imageSrc
        });
        setHasChanges(false); // Reset changes after save
      }
    }, 800);
  }, [hasChanges, transform, imageSrc, onSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Get distance between two touches (pinch gesture detection)
  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle start of touch/mouse interaction
  const handleStart = (e) => {
    if (!isActive) return;
    
    e.preventDefault();
    setIsInteracting(true);
    
    if (e.touches) {
      // Touch event
      const touches = e.touches;
      
      if (touches.length === 1) {
        // Single finger - drag
        setIsDragging(true);
        setLastTouch({ x: touches[0].clientX, y: touches[0].clientY });
      } else if (touches.length === 2) {
        // Two fingers - pinch zoom
        setIsDragging(false);
        setLastDistance(getDistance(touches));
        
        // Center point between fingers for zoom origin
        const centerX = (touches[0].clientX + touches[1].clientX) / 2;
        const centerY = (touches[0].clientY + touches[1].clientY) / 2;
        setLastTouch({ x: centerX, y: centerY });
      }
    } else {
      // Mouse event
      setIsDragging(true);
      setLastTouch({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle movement during interaction - wrapped in useCallback
  const handleMove = useCallback((e) => {
    if (!isActive || !isInteracting) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (e.touches) {
      // Touch event
      const touches = e.touches;
      
      if (touches.length === 1 && isDragging) {
        // Single finger drag - move image smoothly
        const touch = touches[0];
        const deltaX = touch.clientX - lastTouch.x;
        const deltaY = touch.clientY - lastTouch.y;
        
        setTransform(prev => ({
          ...prev,
          translateX: prev.translateX + deltaX,
          translateY: prev.translateY + deltaY
        }));
        
        setLastTouch({ x: touch.clientX, y: touch.clientY });
        setHasChanges(true); // Mark as changed
        
      } else if (touches.length === 2) {
        // Two finger pinch - zoom with limits and bounce
        const distance = getDistance(touches);
        const scaleFactor = distance / lastDistance;
        
        if (scaleFactor > 0.5 && scaleFactor < 2) { // Prevent extreme scaling
          setTransform(prev => {
            let newScale = prev.scale * scaleFactor;
            
            // Apply limits with smooth bounce effect
            if (newScale < 0.5) {
              newScale = 0.5 + (0.5 - newScale) * 0.1; // Bounce back from minimum
            } else if (newScale > 3) {
              newScale = 3 + (newScale - 3) * 0.1; // Bounce back from maximum
            }
            
            return {
              ...prev,
              scale: newScale
            };
          });
          
          setLastDistance(distance);
          setHasChanges(true); // Mark as changed
        }
      }
    } else if (isDragging) {
      // Mouse drag
      const deltaX = e.clientX - lastTouch.x;
      const deltaY = e.clientY - lastTouch.y;
      
      setTransform(prev => ({
        ...prev,
        translateX: prev.translateX + deltaX,
        translateY: prev.translateY + deltaY
      }));
      
      setLastTouch({ x: e.clientX, y: e.clientY });
      setHasChanges(true); // Mark as changed
    }
  }, [isActive, isInteracting, isDragging, lastTouch, lastDistance]);

  // Handle end of interaction - wrapped in useCallback
  const handleEnd = useCallback((e) => {
    if (!isActive) return;
    
    setIsDragging(false);
    setIsInteracting(false);
    
    // Apply scale limits and bounce back if exceeded
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale))
    }));
    
    // Schedule auto-save after interaction ends
    if (hasChanges) {
      scheduleAutoSave();
    }
  }, [isActive, hasChanges, scheduleAutoSave]);

  // Handle mouse wheel for desktop zoom
  const handleWheel = (e) => {
    if (!isActive) return;
    
    e.preventDefault();
    
    const scaleDelta = e.deltaY > 0 ? 0.9 : 1.1;
    
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale * scaleDelta))
    }));
    
    setHasChanges(true); // Mark as changed
    scheduleAutoSave(); // Auto-save after wheel zoom
  };

  // Global event listeners for smooth gesture handling - FIXED dependencies
  useEffect(() => {
    if (!isActive) return;

    const handleGlobalMove = (e) => {
      if (isInteracting) {
        handleMove(e);
      }
    };

    const handleGlobalEnd = (e) => {
      if (isInteracting) {
        handleEnd(e);
      }
    };

    // Add global listeners for smooth gesture tracking
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
  }, [isActive, isInteracting, handleMove, handleEnd]); // FIXED: Added missing dependencies


  if (!isActive) {
    // Smart display: complete image on upload, then adapts to layout after adjustments
    const displayTransform = savedTransform || { scale: 1, translateX: 0, translateY: 0 };
    const hasBeenAdjusted = savedTransform !== null; // Has user made adjustments?
    
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        {/* Blurred background to fill uncovered areas when showing complete image */}
        {!hasBeenAdjusted && (
          <div className="absolute inset-0">
            <img
              src={imageSrc}
              alt="Background blur"
              className="w-full h-full object-cover blur-lg opacity-50 scale-110"
              onDragStart={(e) => e.preventDefault()}
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        )}
        
        {/* Main image - complete on upload, then adapts to layout after adjustments */}
        <img
          src={imageSrc}
          alt="Preview"
          className={`relative w-full h-full ${hasBeenAdjusted ? 'object-cover' : 'object-contain'} z-10`}
          style={{
            transform: `translate(${displayTransform.translateX}px, ${displayTransform.translateY}px) scale(${displayTransform.scale})`,
            transformOrigin: 'center',
            transition: 'transform 0.2s ease-out'
          }}
          onDragStart={(e) => e.preventDefault()}
        />
        
        {/* Subtle hint for first-time users */}
        {!hasBeenAdjusted && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 opacity-75 pointer-events-none z-20">
            <div className="bg-black/70 text-white text-xs px-3 py-1 rounded-full">
              👆 Toca para ajustar al layout
            </div>
          </div>
        )}
      </div>
    );
  }

  // Crop mode - shows complete image during adjustment, then saves for layout adaptation
  const hasBeenAdjusted = savedTransform !== null;
  
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`} style={{ pointerEvents: 'auto' }}>
      {/* Background for complete image view during adjustment */}
      <div className="absolute inset-0">
        <img
          src={imageSrc}
          alt="Background blur"
          className="w-full h-full object-cover blur-lg opacity-30 scale-110"
          onDragStart={(e) => e.preventDefault()}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      {/* Interactive image container */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-move select-none z-10"
        onTouchStart={handleStart}
        onMouseDown={handleStart}
        onWheel={handleWheel}
        style={{ touchAction: 'none', pointerEvents: 'auto' }}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Adjust preview"
          className="w-full h-full object-contain" /* Shows complete image during adjustment */
          style={{
            transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
            transformOrigin: 'center',
            transition: isInteracting ? 'none' : 'transform 0.2s ease-out'
          }}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>

      {/* Crop frame with clean, soft lines - optimized for object-cover */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Rule of thirds grid - minimal and clean */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="border border-white/60" />
          ))}
        </div>
        
        {/* Crop frame border - subtle for layout adaptation */}
        <div className="absolute inset-0 border-2 border-white/80 rounded-sm shadow-lg" />
      </div>

      {/* Floating control - only cancel button */}
      <div className="absolute top-4 right-4 pointer-events-auto z-30">
        <button
          onClick={onCancel}
          className="w-12 h-12 bg-black/70 hover:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-200"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Auto-save indicator - bottom center */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none z-30">
        <div className="bg-black/70 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {isInteracting 
            ? (isDragging ? '👆 Ajustando posición...' : '🤏 Ajustando zoom...') 
            : hasChanges 
              ? '💾 Guardando ajustes...'
              : '👆 Arrastra • 🤏 Pellizca para ajustar'
          }
        </div>
      </div>
    </div>
  );
};

export default InlineCrop;