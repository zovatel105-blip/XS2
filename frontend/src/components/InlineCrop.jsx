/**
 * InlineCrop - Simple crop functionality without black areas
 * - Uses object-cover + object-position (safer than transforms)
 * - Prevents black areas by design
 * - Mobile-first touch gestures
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Check } from 'lucide-react';

const InlineCrop = ({
  isActive = false,
  imageSrc = '',
  savedTransform = null,
  onSave = () => {},
  onCancel = () => {},
  className = ''
}) => {
  console.log('🔍 InlineCrop render - isActive:', isActive, 'savedTransform:', savedTransform);
  console.log('🔍 savedTransform details:', JSON.stringify(savedTransform, null, 2));
  console.log('🔍 Current state - position will be initialized based on savedTransform or defaults');

  // Enhanced position and scale state - Initialize from savedTransform if available
  const [position, setPosition] = useState(() => {
    if (savedTransform && savedTransform.transform && savedTransform.transform.position) {
      console.log('🎯 Initializing position from savedTransform:', savedTransform.transform.position);
      return savedTransform.transform.position;
    }
    console.log('🎯 Initializing position to default: 50, 50');
    return { x: 50, y: 50 };
  }); // Percentage for object-position
  
  const [scale, setScale] = useState(() => {
    if (savedTransform && savedTransform.transform && savedTransform.transform.scale) {
      console.log('🎯 Initializing scale from savedTransform:', savedTransform.transform.scale);
      return savedTransform.transform.scale;
    }
    console.log('🎯 Initializing scale to default: 1');
    return 1;
  }); // Scale for zoom
  const [hasChanges, setHasChanges] = useState(false);
  
  // Touch interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });
  const [lastDistance, setLastDistance] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  const containerRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);

  // Get distance between touches for pinch gesture
  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle double click/tap to save with proper timing
  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🖱️ Double click detected - isActive:', isActive, 'hasChanges:', hasChanges);
    console.log('🖱️ Event type:', e.type, 'Event target:', e.target);
    
    if (!isActive) {
      console.log('❌ Double click ignored - not active');
      return;
    }
    
    if (!hasChanges) {
      console.log('❌ Double click ignored - no changes to save');
      return;
    }
    
    console.log('💾 Double click save - position:', position, 'scale:', scale);
    const transformData = {
      transform: {
        position: position,
        scale: scale
      },
      originalImageSrc: imageSrc
    };
    
    console.log('📤 Sending transform data via onSave:', transformData);
    onSave(transformData);
    setHasChanges(false);
    
    // ❌ REMOVED: setTimeout(() => onCancel(), 200) - This was causing race condition
    // Let parent component handle the timing after state update completes
    console.log('✅ Save completed - parent will handle crop exit timing');
  }, [isActive, hasChanges, position, scale, imageSrc, onSave]);

  // Alternative save method - keyboard shortcut
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleDoubleClick(e);
    }
  }, [handleDoubleClick]);

  // Handle start of interaction
  const handleStart = (e) => {
    if (!isActive) return;
    
    console.log('🎯 handleStart triggered - isActive:', isActive, 'event type:', e.type);
    e.preventDefault();
    setIsInteracting(true);
    
    if (e.touches) {
      const touches = e.touches;
      if (touches.length === 1) {
        // Single touch - drag
        console.log('👆 Single touch drag mode');
        setIsDragging(true);
        setLastTouch({ x: touches[0].clientX, y: touches[0].clientY });
      } else if (touches.length === 2) {
        // Two finger pinch
        console.log('🤏 Two finger pinch mode');
        setIsDragging(false);
        setLastDistance(getDistance(touches));
        const centerX = (touches[0].clientX + touches[1].clientX) / 2;
        const centerY = (touches[0].clientY + touches[1].clientY) / 2;
        setLastTouch({ x: centerX, y: centerY });
      }
    } else {
      console.log('🖱️ Mouse drag mode');
      setIsDragging(true);  
      setLastTouch({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle movement
  const handleMove = useCallback((e) => {
    console.log('🚶‍♂️ handleMove called - isActive:', isActive, 'isInteracting:', isInteracting, 'isDragging:', isDragging);
    
    if (!isActive || !isInteracting) {
      console.log('❌ handleMove early return - isActive:', isActive, 'isInteracting:', isInteracting);
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('✅ handleMove proceeding with movement logic');
    
    if (e.touches) {
      const touches = e.touches;
      
      if (touches.length === 1 && isDragging) {
        // Single finger drag
        const touch = touches[0];
        const deltaX = touch.clientX - lastTouch.x;
        const deltaY = touch.clientY - lastTouch.y;
        
        console.log('👆 Single finger drag - deltaX:', deltaX, 'deltaY:', deltaY, 'lastTouch:', lastTouch);
        
        // Better sensitivity for drag - INVERTED for intuitive movement
        const sensitivity = 0.3;
        const deltaPercentX = -deltaX * sensitivity; // NEGATIVE for correct direction
        const deltaPercentY = -deltaY * sensitivity; // NEGATIVE for correct direction
        
        console.log('📊 Calculated deltas - deltaPercentX:', deltaPercentX, 'deltaPercentY:', deltaPercentY);
        console.log('📍 Previous position:', position);
        
        setPosition(prev => {
          const newPos = {
            x: Math.max(10, Math.min(90, prev.x + deltaPercentX)),
            y: Math.max(10, Math.min(90, prev.y + deltaPercentY))
          };
          console.log('🎯 New position calculated:', newPos);
          return newPos;
        });
        
        setLastTouch({ x: touch.clientX, y: touch.clientY });
        setHasChanges(true);
        console.log('✅ hasChanges set to true');
        
      } else if (touches.length === 2) {
        // Pinch zoom
        const distance = getDistance(touches);
        const scaleFactor = distance / lastDistance;
        
        console.log('🤏 Pinch zoom - distance:', distance, 'lastDistance:', lastDistance, 'scaleFactor:', scaleFactor);
        
        if (scaleFactor > 0.8 && scaleFactor < 1.2) {
          setScale(prev => {
            const newScale = Math.max(1, Math.min(3, prev * scaleFactor)); // Scale 1x to 3x
            console.log('🔍 Scale update - previous:', prev, 'new:', newScale);
            return newScale;
          });
          
          setLastDistance(distance);
          setHasChanges(true);
          console.log('✅ pinch hasChanges set to true');
        }
      }
    } else if (isDragging) {
      // Mouse drag
      const deltaX = e.clientX - lastTouch.x;
      const deltaY = e.clientY - lastTouch.y;
      
      console.log('🖱️ Mouse drag - deltaX:', deltaX, 'deltaY:', deltaY, 'lastTouch:', lastTouch);
      
      const sensitivity = 0.3;
      const deltaPercentX = -deltaX * sensitivity; // NEGATIVE for correct direction
      const deltaPercentY = -deltaY * sensitivity; // NEGATIVE for correct direction
      
      console.log('📊 Mouse calculated deltas - deltaPercentX:', deltaPercentX, 'deltaPercentY:', deltaPercentY);
      console.log('📍 Mouse previous position:', position);
      
      setPosition(prev => {
        const newPos = {
          x: Math.max(10, Math.min(90, prev.x + deltaPercentX)),
          y: Math.max(10, Math.min(90, prev.y + deltaPercentY))
        };
        console.log('🎯 Mouse new position calculated:', newPos);
        return newPos;
      });
      
      setLastTouch({ x: e.clientX, y: e.clientY });
      setHasChanges(true);
      console.log('✅ Mouse hasChanges set to true');
    }
  }, [isActive, isInteracting, isDragging, lastTouch, lastDistance]);

  // Handle end of interaction
  const handleEnd = useCallback(() => {
    if (!isActive) return;
    
    setIsDragging(false);
    setIsInteracting(false);
  }, [isActive]);

  // Handle mouse wheel zoom
  const handleWheel = (e) => {
    if (!isActive) return;
    
    console.log('🎡 handleWheel triggered - deltaY:', e.deltaY, 'current scale:', scale);
    
    e.preventDefault();
    
    const scaleDelta = e.deltaY > 0 ? 0.95 : 1.05;
    console.log('📏 Scale delta:', scaleDelta);
    
    setScale(prev => {
      const newScale = Math.max(1, Math.min(3, prev * scaleDelta));
      console.log('🔍 Wheel scale update - previous:', prev, 'new:', newScale);
      return newScale;
    });
    
    setHasChanges(true);
    console.log('✅ Wheel hasChanges set to true');
  };

  // Always sync with savedTransform when it changes
  useEffect(() => {
    if (savedTransform && savedTransform.transform) {
      console.log('🔄 Syncing with savedTransform:', savedTransform.transform);
      setPosition(savedTransform.transform.position);
      setScale(savedTransform.transform.scale || 1);
    }
  }, [savedTransform]);

  // Load position when becoming active - DO NOT reset if no savedTransform
  useEffect(() => {
    if (isActive) {
      if (savedTransform && savedTransform.transform) {
        setPosition(savedTransform.transform.position);
        setScale(savedTransform.transform.scale || 1);
        console.log('🔄 Loading saved transform for active mode:', savedTransform.transform);
      } else {
        // DON'T reset - keep current values to preserve user adjustments
        console.log('🔄 No saved transform - keeping current position/scale');
      }
      setHasChanges(false);
      setIsInteracting(false);
      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    }
  }, [isActive]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Global event listeners for smooth gesture handling
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

  // CONDITIONAL RENDERS AFTER ALL HOOKS
  if (!isActive) {
    const displayPosition = savedTransform?.transform?.position || { x: 50, y: 50 };
    const displayScale = savedTransform?.transform?.scale || 1;
    
    console.log('🔍 INACTIVE RENDER - savedTransform:', savedTransform);
    console.log('🔍 INACTIVE RENDER - displayPosition:', displayPosition, 'displayScale:', displayScale);
    
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

  // Crop mode - active image with gestures
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`} style={{ pointerEvents: 'auto' }}>
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-move select-none z-10"
        onTouchStart={handleStart}
        onMouseDown={handleStart}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
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
      
      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white text-sm p-3 rounded-lg z-40">
        <div className="text-center">
          <p className="mb-1 font-medium">✋ Ajusta la imagen</p>
          <p className="text-xs opacity-80">
            • Arrastra para mover • Pellizca/rueda para zoom
            {hasChanges && (
              <span className="block mt-1 text-green-300 font-medium">
                • Doble click para guardar cambios
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InlineCrop;